/**
 * Hausordnung-Versioning. Bei jeder substanziellen Änderung Version hochzählen.
 * Beim Booking-Checkout muss der Gast die aktuelle Version explizit akzeptieren —
 * gespeichert in bookings.acceptedHausordnungVersion + acceptedHausordnungAt
 * für rechtliche Nachvollziehbarkeit (im Streitfall kann nachgewiesen werden,
 * welche Hausordnungs-Fassung zum Buchungszeitpunkt galt).
 */

export const CURRENT_HAUSORDNUNG_VERSION = "2025-01";

export const HAUSORDNUNG_HISTORY: Array<{ version: string; effectiveFrom: string }> = [
  { version: "2025-01", effectiveFrom: "2025-01-01" },
];
