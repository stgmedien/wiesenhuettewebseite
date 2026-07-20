/**
 * Hausordnung-Versioning. Bei jeder substanziellen Änderung Version hochzählen.
 * Beim Booking-Checkout muss der Gast die aktuelle Version explizit akzeptieren —
 * gespeichert in bookings.acceptedHausordnungVersion + acceptedHausordnungAt
 * für rechtliche Nachvollziehbarkeit (im Streitfall kann nachgewiesen werden,
 * welche Hausordnungs-Fassung zum Buchungszeitpunkt galt).
 */

export const CURRENT_HAUSORDNUNG_VERSION = "2026-07";

export const HAUSORDNUNG_HISTORY: Array<{ version: string; effectiveFrom: string }> = [
  { version: "2025-01", effectiveFrom: "2025-01-01" },
  // 2026-07: Kurkarten-Fristen präzisiert (Meldeschein spätestens T-14,
  // Toni-Anruf T-2), Nichtraucher-/Haustier-Passus ergänzt.
  { version: "2026-07", effectiveFrom: "2026-07-18" },
];
