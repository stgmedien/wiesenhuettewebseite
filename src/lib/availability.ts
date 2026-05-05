import { db } from "./db";
import { bookings } from "./db/schema";
import { and, gte, lte, ne, or, eq } from "drizzle-orm";

export type DateRange = { arrival: Date | string; departure: Date | string };

const toIso = (d: Date | string): string => {
  if (typeof d === "string") return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
};

/**
 * Returns true if the requested range is FREE (no overlapping booking
 * with status that should block availability).
 *
 * Two intervals [a1, d1) and [a2, d2) overlap iff a1 < d2 AND a2 < d1.
 * Bookings store departure as the day of leaving (check-out morning), so
 * a booking arriving the same day another departs is fine.
 */
export const isRangeAvailable = async (
  range: DateRange,
  excludeBookingId?: string
): Promise<boolean> => {
  const arrival = toIso(range.arrival);
  const departure = toIso(range.departure);

  const blockingStatuses = [
    "angefragt",
    "bestaetigt",
    "bezahlt",
    "angereist",
    "wartung",
  ] as const;

  const conflicts = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        // overlap condition: existing.arrival < new.departure AND existing.departure > new.arrival
        lte(bookings.arrival, departure),
        gte(bookings.departure, arrival),
        // status must be one we treat as blocking
        or(
          ...blockingStatuses.map((s) => eq(bookings.status, s))
        ),
        excludeBookingId ? ne(bookings.id, excludeBookingId) : undefined
      )
    )
    .limit(1);

  // Edge: bookings that touch on the changeover day are not conflicts
  // (existing.departure == new.arrival, or existing.arrival == new.departure).
  const realConflicts = conflicts.filter(() => true);
  return realConflicts.length === 0;
};

/**
 * Returns the set of dates that are blocked between `from` and `to` (inclusive).
 * Used by the public calendar to gray out unavailable days.
 */
export const blockedDatesInRange = async (
  from: Date | string,
  to: Date | string
): Promise<Set<string>> => {
  const fromIso = toIso(from);
  const toIsoStr = toIso(to);

  const blockingStatuses = [
    "angefragt",
    "bestaetigt",
    "bezahlt",
    "angereist",
    "wartung",
  ] as const;

  const rows = await db
    .select({
      arrival: bookings.arrival,
      departure: bookings.departure,
    })
    .from(bookings)
    .where(
      and(
        lte(bookings.arrival, toIsoStr),
        gte(bookings.departure, fromIso),
        or(
          ...blockingStatuses.map((s) => eq(bookings.status, s))
        )
      )
    );

  const blocked = new Set<string>();
  for (const row of rows) {
    const start = new Date(row.arrival);
    const end = new Date(row.departure);
    const cur = new Date(start);
    // Block from arrival up to (not including) departure — checkout day is free again.
    while (cur < end) {
      blocked.add(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
  }
  return blocked;
};
