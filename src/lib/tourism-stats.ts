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
/** Empfaengerin der monatlichen Statistik-Mail (Tanja). Ueberschreibbar per MAIL_TOURISM_STATS_TO. */
export const TOURISM_STATS_TO_DEFAULT = "skifreunde-gt@wiesenhuette.de";

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

/** Die letzten `count` abgeschlossenen Monate als "YYYY-MM", neuester zuerst. */
export function lastCompletedMonths(count: number, now = new Date()): string[] {
  const out: string[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

/** CSV (Semikolon, für deutsches Excel) mit einer Zeile pro Monat. */
export function tourismStatsCsv(stats: TourismStats[]): string {
  const lines = ["Monat;Ankünfte (Gäste);Übernachtungen;Buchungen"];
  for (const s of stats) {
    const nums = s.bookings.map((b) => b.bookingNumber).join(", ");
    lines.push(`${s.monthLabel};${s.arrivals};${s.overnightStays};"${nums}"`);
  }
  return "﻿" + lines.join("\r\n") + "\r\n";
}
