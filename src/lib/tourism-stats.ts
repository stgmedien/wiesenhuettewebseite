import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { and, gt, lt, notInArray } from "drizzle-orm";

/**
 * Zahlen fuer die monatliche IT.NRW-Tourismusstatistik (BeherbStatG,
 * Totalerhebung mit Abschneidegrenze ab 10 Betten — meldepflichtig jeden
 * Monat, dauerhaft, siehe https://www.idev.nrw.de). "wartung" (interne
 * Sperrzeiten, kein Gast) und "storniert" (nie angereist) zaehlen nicht als
 * Gaeste-Aufenthalt.
 */
const EXCLUDED_STATUSES: ("storniert" | "wartung")[] = ["storniert", "wartung"];

const toUtcDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86_400_000);

export type TourismStatsBooking = {
  bookingNumber: string;
  status: string;
  arrival: string;
  departure: string;
  persons: number;
  nightsInMonth: number;
};

export type TourismStats = {
  /** "YYYY-MM" */
  month: string;
  monthLabel: string;
  /** Anzahl Gaeste, die im Berichtsmonat angereist sind. */
  arrivals: number;
  /** Gaeste-Uebernachtungen im Berichtsmonat (Personen x Naechte, anteilig bei Aufenthalten ueber die Monatsgrenze). */
  overnightStays: number;
  bookings: TourismStatsBooking[];
};

const formatMonthLabel = (monthIso: string): string =>
  toUtcDate(`${monthIso}-01`).toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

/** monthIso: "YYYY-MM" */
export async function computeTourismStats(monthIso: string): Promise<TourismStats> {
  const monthStart = `${monthIso}-01`;
  const startDate = toUtcDate(monthStart);
  const monthEnd = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 1))
    .toISOString()
    .slice(0, 10); // exklusive Obergrenze = 1. des Folgemonats

  const rows = await db
    .select({
      bookingNumber: bookings.bookingNumber,
      status: bookings.status,
      arrival: bookings.arrival,
      departure: bookings.departure,
      persons: bookings.persons,
    })
    .from(bookings)
    .where(
      and(
        lt(bookings.arrival, monthEnd),
        gt(bookings.departure, monthStart),
        notInArray(bookings.status, EXCLUDED_STATUSES)
      )
    );

  let arrivals = 0;
  let overnightStays = 0;
  const detail: TourismStatsBooking[] = [];

  for (const b of rows) {
    if (b.arrival >= monthStart && b.arrival < monthEnd) {
      arrivals += b.persons;
    }

    const overlapStart = b.arrival > monthStart ? b.arrival : monthStart;
    const overlapEnd = b.departure < monthEnd ? b.departure : monthEnd;
    const nightsInMonth = Math.max(0, daysBetween(toUtcDate(overlapStart), toUtcDate(overlapEnd)));
    overnightStays += nightsInMonth * b.persons;

    detail.push({
      bookingNumber: b.bookingNumber,
      status: b.status,
      arrival: b.arrival,
      departure: b.departure,
      persons: b.persons,
      nightsInMonth,
    });
  }

  detail.sort((a, b) => a.arrival.localeCompare(b.arrival));

  return {
    month: monthIso,
    monthLabel: formatMonthLabel(monthIso),
    arrivals,
    overnightStays,
    bookings: detail,
  };
}
