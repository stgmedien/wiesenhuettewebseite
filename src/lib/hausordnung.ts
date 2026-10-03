/**
 * Hausordnung-Versioning. Bei jeder substanziellen Änderung Version hochzählen.
 * Beim Booking-Checkout muss der Gast die aktuelle Version explizit akzeptieren —
 * gespeichert in bookings.acceptedHausordnungVersion + acceptedHausordnungAt
 * für rechtliche Nachvollziehbarkeit (im Streitfall kann nachgewiesen werden,
 * welche Hausordnungs-Fassung zum Buchungszeitpunkt galt).
 */

export const CURRENT_HAUSORDNUNG_VERSION = "2026-10";

export const HAUSORDNUNG_HISTORY: Array<{ version: string; effectiveFrom: string }> = [
  { version: "2025-01", effectiveFrom: "2025-01-01" },
  // 2026-07: Kurkarten-Fristen präzisiert (Meldeschein spätestens T-14,
  // Toni-Anruf T-2), Nichtraucher-/Haustier-Passus ergänzt.
  { version: "2026-07", effectiveFrom: "2026-07-18" },
  // 2026-08: Energiespar-Hinweis ergänzt (Vorhänge, Außentüren, Schlafräume
  // nicht überheizen) und Heizungs-Checkliste bei Abreise korrigiert --
  // nach Rueckspreache mit Luetgerts gilt "Stufe 1" nur im Winter (Mitte
  // Nov.-Mitte Maerz), sonst reicht Frostwaechter (Muffbildung sonst).
  { version: "2026-08", effectiveFrom: "2026-08-21" },
  // 2026-10: Offenes Feuer auf dem Gelaende vorerst untersagt (auch an der
  // vorhandenen Feuerstelle) -- Genehmigung nach § 47 LFoG NRW (100 m
  // Waldabstand) ist ungeklaert. Feuerstellen-Regeln und Abreise-Checkpunkt
  // entfallen. Nachtrag 03.10.2026 (ohne Versionssprung, Klarstellung): im
  // digitalen Meldeschein alle Mitreisenden einzeln eintragen, auch Kinder.
  { version: "2026-10", effectiveFrom: "2026-10-02" },
];
