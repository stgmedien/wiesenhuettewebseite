import { unstable_cache } from "next/cache";
import { db } from "./db";
import { bookings } from "./db/schema";
import { and, gte, lte, ne, or, eq } from "drizzle-orm";
import { getSiteSettings } from "./settings";

/** Cache-Tag — bei jeder Buchungs-/Sperrzeit-Mutation via
 *  revalidateTag("booking-blocks") invalidieren. */
export const BOOKING_BLOCKS_TAG = "booking-blocks";

export type DateRange = { arrival: Date | string; departure: Date | string };

const toIso = (d: Date | string): string => {
  if (typeof d === "string") return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
};

const addDaysIso = (iso: string, days: number): string => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const BLOCKING_STATUSES = [
  "angefragt",
  "bestaetigt",
  "bezahlt",
  "angereist",
  "wartung",
] as const;

/**
 * Returns true if the requested range is FREE (no overlapping booking
 * with status that should block availability), considering cleaning days
 * after the departure of every existing booking.
 *
 * With RULES.cleaningDaysAfterDeparture = 1 (default), back-to-back same-day
 * arrival on someone else's departure day is rejected.
 */
export const isRangeAvailable = async (
  range: DateRange,
  excludeBookingId?: string
): Promise<boolean> => {
  const arrival = toIso(range.arrival);
  const departure = toIso(range.departure);
  const settings = await getSiteSettings();
  const cleaningDays = settings.cleaningDaysAfterDeparture;

  // Effective new range = [arrival, departure + cleaningDays). Two intervals overlap iff
  //   existing.arrival < new.effectiveEnd  AND  existing.effectiveEnd > new.arrival
  // Because date strings compare lexicographically (ISO-8601 yyyy-mm-dd) we can do a
  // simple SQL-side check by adding cleaningDays to one side. We compute the cutoffs in JS.
  const newEffectiveEnd = addDaysIso(departure, cleaningDays);

  // existing.arrival < newEffectiveEnd  AND  existing.departure + cleaningDays > new.arrival
  // Rewriting: existing.arrival <= addDaysIso(newEffectiveEnd, -1)
  //         AND existing.departure >= addDaysIso(new.arrival, -(cleaningDays - 1)) when cleaningDays >= 1
  // For simplicity, we filter candidates broadly server-side, then refine in JS:
  const broadFrom = addDaysIso(arrival, -30);
  const broadTo = addDaysIso(newEffectiveEnd, 30);

  const conflicts = await db
    .select({
      id: bookings.id,
      arrival: bookings.arrival,
      departure: bookings.departure,
      status: bookings.status,
    })
    .from(bookings)
    .where(
      and(
        gte(bookings.departure, broadFrom),
        lte(bookings.arrival, broadTo),
        or(...BLOCKING_STATUSES.map((s) => eq(bookings.status, s))),
        excludeBookingId ? ne(bookings.id, excludeBookingId) : undefined
      )
    );

  for (const c of conflicts) {
    // Wartung doesn't get a cleaning buffer afterwards
    const cleaningForExisting = c.status === "wartung" ? 0 : cleaningDays;
    const existingEffectiveEnd = addDaysIso(toIso(c.departure), cleaningForExisting);
    // Overlap
    if (toIso(c.arrival) < newEffectiveEnd && existingEffectiveEnd > arrival) {
      return false;
    }
  }
  return true;
};

export type BookingBlocks = {
  /** Days actually booked (overnight stays). */
  booked: Set<string>;
  /** Cleaning/turnaround days where the cabin is unavailable but no guests stay. */
  cleaning: Set<string>;
  /** Internal-only blocks (Wartung / Sperrzeit). */
  wartung: Set<string>;
};

/**
 * Roh-Variante: liefert serialisierbare Arrays (Sets überleben den
 * Next-Data-Cache nicht — JSON würde sie zu `{}` machen). Gecacht mit Tag
 * "booking-blocks"; Cache-Key enthält die Datums-Range (Args) → rollt täglich
 * automatisch, wird bei Buchungs-Mutationen sofort invalidiert.
 */
const getBookingBlocksRaw = unstable_cache(
  async (
    fromIso: string,
    toIsoStr: string
  ): Promise<{ booked: string[]; cleaning: string[]; wartung: string[] }> => {
    const settings = await getSiteSettings();
    const cleaningDays = settings.cleaningDaysAfterDeparture;

    const rows = await db
    .select({
      arrival: bookings.arrival,
      departure: bookings.departure,
      status: bookings.status,
    })
    .from(bookings)
    .where(
      and(
        lte(bookings.arrival, toIsoStr),
        gte(bookings.departure, addDaysIso(fromIso, -cleaningDays)),
        or(...BLOCKING_STATUSES.map((s) => eq(bookings.status, s)))
      )
    );

  const booked = new Set<string>();
  const cleaning = new Set<string>();
  const wartung = new Set<string>();

  for (const row of rows) {
    const isWartung = row.status === "wartung";
    const start = new Date(toIso(row.arrival));
    const end = new Date(toIso(row.departure));

    // Overnight nights: [arrival, departure)
    const cur = new Date(start);
    while (cur < end) {
      const iso = cur.toISOString().slice(0, 10);
      if (isWartung) wartung.add(iso);
      else booked.add(iso);
      cur.setDate(cur.getDate() + 1);
    }

    // Cleaning days: [departure, departure + cleaningDays). Wartung has no cleaning buffer.
    if (!isWartung) {
      const clEnd = new Date(end);
      clEnd.setDate(clEnd.getDate() + cleaningDays);
      const c = new Date(end);
      while (c < clEnd) {
        cleaning.add(c.toISOString().slice(0, 10));
        c.setDate(c.getDate() + 1);
      }
    }
  }

    return {
      booked: Array.from(booked),
      cleaning: Array.from(cleaning),
      wartung: Array.from(wartung),
    };
  },
  ["booking-blocks-v1"],
  { tags: [BOOKING_BLOCKS_TAG] }
);

/**
 * Categorized blocking days between `from` and `to` (inclusive).
 * Used by the public booking calendar to render different shades.
 * Dünner Wrapper um die gecachte Roh-Variante: rekonstruiert die Sets.
 */
export const getBookingBlocks = async (
  from: Date | string,
  to: Date | string
): Promise<BookingBlocks> => {
  const raw = await getBookingBlocksRaw(toIso(from), toIso(to));
  return {
    booked: new Set(raw.booked),
    cleaning: new Set(raw.cleaning),
    wartung: new Set(raw.wartung),
  };
};

/**
 * Convenience: union of all unavailable days. Used where the caller doesn't
 * need to distinguish between booked / cleaning / wartung.
 */
export const blockedDatesInRange = async (
  from: Date | string,
  to: Date | string
): Promise<Set<string>> => {
  const { booked, cleaning, wartung } = await getBookingBlocks(from, to);
  const all = new Set<string>();
  for (const d of booked) all.add(d);
  for (const d of cleaning) all.add(d);
  for (const d of wartung) all.add(d);
  return all;
};
