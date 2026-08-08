// =============================================================
// Gemeinsame Konstanten für den Gruppen-Planungs-Hub (/gruppe/[token]).
// Client-sicher: KEINE Server-Imports (db, crypto, env) — diese Datei wird
// sowohl in Server-Actions als auch im Browser-Bundle verwendet.
// =============================================================

export type HubKind = "packliste" | "essen" | "zimmer" | "mitfahrt";

/** Feste Zimmerliste der Wiesenhütte — Quelle: /huette (33 Schlafplätze). */
export type HubRoom = {
  name: string;
  floor: string;
  beds: number;
  detail: string;
};

export const HUB_ROOMS: HubRoom[] = [
  { name: "Naturtraum", floor: "1. Etage", beds: 8, detail: "Etagenbetten" },
  {
    name: "Sonnenplatz",
    floor: "1. Etage",
    beds: 4,
    detail: `Etagenbetten · Sitzecke („Lehrerzimmer")`,
  },
  {
    name: "Waldblick",
    floor: "Dachgeschoss",
    beds: 4,
    detail: "Bodenbetten · Innentreppe zu Naturtraum",
  },
  { name: "Vogelnest", floor: "Dachgeschoss", beds: 4, detail: "Bodenbetten" },
  { name: "Baumkrone", floor: "Dachgeschoss", beds: 13, detail: "Bodenbetten" },
];

/** 33 — muss zur Zimmerliste passen (Summe der Betten). */
export const HUB_TOTAL_BEDS = HUB_ROOMS.reduce((sum, r) => sum + r.beds, 0);

export type MealSlot = "frueh" | "mittag" | "abend";

export const MEAL_SLOTS: { key: MealSlot; label: string; emoji: string }[] = [
  { key: "frueh", label: "Frühstück", emoji: "🥐" },
  { key: "mittag", label: "Mittag", emoji: "🥪" },
  { key: "abend", label: "Abendessen", emoji: "🍲" },
];

export type RideType = "biete" | "suche";

// Längenlimits — client-seitig als maxLength, server-seitig via zod erzwungen.
export const HUB_LIMITS = {
  title: 200, // = varchar(200) in hub_entries
  authorName: 80,
  details: 1000,
  ort: 80,
  maxSeats: 8,
} as const;

/** Alle Übernachtungs-Tage einer Buchung (Anreise bis Abreise, inkl. beider). */
export function hubDays(arrivalIso: string, departureIso: string): string[] {
  const days: string[] = [];
  const d = new Date(`${arrivalIso}T12:00:00`);
  const end = new Date(`${departureIso}T12:00:00`);
  // Defensive Schranke: max. 60 Tage, damit ein kaputtes Datum nie die Seite sprengt.
  for (let i = 0; i <= 60 && d.getTime() <= end.getTime(); i++) {
    days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return days;
}
