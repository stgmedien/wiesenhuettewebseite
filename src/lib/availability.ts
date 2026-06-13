import { unstable_cache } from "next/cache";
import { db } from "./db";
import { bookings } from "./db/schema";
import { and, gte, lte, ne, or, eq } from "drizzle-orm";
import { getSiteSettings } from "./settings";
import { getReleasedCleaningDates } from "./cleaning-overrides";

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
  "abgereist",
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

  // Belegung gilt bis EINSCHLIESSLICH Abreisetag (der Abreisetag ist der letzte
  // Buchungstag — Gäste reisen an dem Tag ab), die Reinigung erfolgt am/an den
  // Tag(en) DANACH. Effektiv belegt eine Buchung also
  //   [arrival, departure + 1 + cleaningDays)  (halb-offen).
  // Zwei Intervalle überlappen iff existing.arrival < new.effectiveEnd UND
  // existing.effectiveEnd > new.arrival.
  const newEffectiveEnd = addDaysIso(departure, cleaningDays + 1);

  // existing.arrival < newEffectiveEnd  AND  existing.departure + cleaningDays > new.arrival
  // Rewriting: existing.arrival <= addDaysIso(newEffectiveEnd, -1)
  //         AND existing.departure >= addDaysIso(new.arrival, -(cleaningDays - 1)) when cleaningDays >= 1
  // For simplicity, we filter candidates broadly server-side, then refine in JS:
  const broadFrom = addDaysIso(arrival, -30);
  const broadTo = addDaysIso(newEffectiveEnd, 30);

  // Vom Wart freigegebene Reinigungstage verkürzen den Reinigungs-Puffer der
  // jeweiligen Buchung — so ist eine direkt anschließende (Back-to-back-)
  // Buchung an einem freigegebenen Tag wieder möglich.
  const released = await getReleasedCleaningDates(broadFrom, broadTo);

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
    // Wartung bekommt keinen Reinigungs-Puffer danach, belegt aber ebenfalls
    // bis einschließlich End-Tag. Gäste-Buchungen: Abreisetag belegt + danach
    // Reinigung → +1 für den (inklusiven) Abreisetag.
    let cleaningForExisting = c.status === "wartung" ? 0 : cleaningDays;
    const depIso = toIso(c.departure);
    let existingEffectiveEnd = addDaysIso(depIso, cleaningForExisting + 1);
    // Freigegebene Reinigungstage am Ende des Puffers wegkürzen (Tag für Tag),
    // damit sie die Verfügbarkeit nicht mehr blockieren.
    while (
      cleaningForExisting > 0 &&
      existingEffectiveEnd > depIso &&
      released.has(addDaysIso(existingEffectiveEnd, -1))
    ) {
      existingEffectiveEnd = addDaysIso(existingEffectiveEnd, -1);
      cleaningForExisting--;
    }
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

    // Belegte Tage [arrival, departure] INKLUSIVE Abreisetag — der Abreisetag
    // ist der letzte Buchungstag (Gäste reisen erst an diesem Tag ab).
    const cur = new Date(start);
    while (cur <= end) {
      const iso = cur.toISOString().slice(0, 10);
      if (isWartung) wartung.add(iso);
      else booked.add(iso);
      cur.setDate(cur.getDate() + 1);
    }

    // Reinigungstage: am/an den Tag(en) NACH dem Abreisetag —
    // [departure+1, departure+1+cleaningDays). Wartung hat keinen Puffer.
    if (!isWartung) {
      const c = new Date(end);
      c.setDate(c.getDate() + 1); // erster Reinigungstag = Tag nach Abreise
      const clEnd = new Date(c);
      clEnd.setDate(clEnd.getDate() + cleaningDays);
      while (c < clEnd) {
        cleaning.add(c.toISOString().slice(0, 10));
        c.setDate(c.getDate() + 1);
      }
    }
  }

    // Vom Wart freigegebene Reinigungstage wieder freigeben (aus dem
    // Reinigungs-Block entfernen) — der Tag ist dann öffentlich buchbar.
    const released = await getReleasedCleaningDates(
      addDaysIso(fromIso, -cleaningDays),
      toIsoStr
    );
    for (const d of released) cleaning.delete(d);

    return {
      booked: Array.from(booked),
      cleaning: Array.from(cleaning),
      wartung: Array.from(wartung),
    };
  },
  // v2: Reinigungstag liegt jetzt NACH dem Abreisetag (Belegung inkl. Abreisetag).
  // Key-Bump erzwingt frische Berechnung nach Deploy statt alter gecachter Sets.
  ["booking-blocks-v2"],
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
