/** Radtouren-Matching: Wochenend-Slots & Schwelle. */

/** Ab so vielen bestätigten Interessierten gilt ein Slot als Match. */
export const RAD_MATCH_THRESHOLD = 8;

/** So viele kommende Wochenenden werden zur Auswahl angeboten. */
export const RAD_SLOT_COUNT = 12;

export type RadSlot = {
  /** Slot-ID = ISO-Datum des Freitags (YYYY-MM-DD). */
  id: string;
  fridayIso: string;
  sundayIso: string;
};

const toIso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

/**
 * Die nächsten `count` Wochenenden (Fr–So), beginnend frühestens in
 * `minLeadDays` Tagen — kurzfristiger ließe sich eine Gruppe kaum organisieren.
 */
export const upcomingWeekends = (
  count: number = RAD_SLOT_COUNT,
  from: Date = new Date(),
  minLeadDays = 10
): RadSlot[] => {
  const start = new Date(from);
  start.setDate(start.getDate() + minLeadDays);
  // Auf den nächsten Freitag (Wochentag 5) vorrollen.
  const day = start.getDay();
  const untilFriday = (5 - day + 7) % 7;
  start.setDate(start.getDate() + untilFriday);

  const slots: RadSlot[] = [];
  for (let i = 0; i < count; i++) {
    const friday = new Date(start);
    friday.setDate(friday.getDate() + i * 7);
    const sunday = new Date(friday);
    sunday.setDate(sunday.getDate() + 2);
    slots.push({ id: toIso(friday), fridayIso: toIso(friday), sundayIso: toIso(sunday) });
  }
  return slots;
};

/** „Fr 10. – So 12. Juli 2026" — lokalisierte Slot-Beschriftung. */
export const formatSlotLabel = (slot: RadSlot, locale: string): string => {
  const lc = locale === "de" ? "de-DE" : locale === "nl" ? "nl-NL" : "en-GB";
  const fr = new Date(`${slot.fridayIso}T12:00:00`);
  const so = new Date(`${slot.sundayIso}T12:00:00`);
  const frS = fr.toLocaleDateString(lc, { weekday: "short", day: "numeric", month: "short" });
  const soS = so.toLocaleDateString(lc, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${frS} – ${soS}`;
};
