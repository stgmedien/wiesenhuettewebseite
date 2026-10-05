// "Reservierung" = Sperrzeit fuer eine geplante eigene Fahrt (z. B. ESG),
// deren Details noch nicht feststehen. Technisch eine Buchung mit Status
// "wartung" (blockt den Kalender, kein Preis, keine Zahlungsfrist) — anders
// als eine echte Wartung zaehlt sie aber wie ein Aufenthalt: oeffentlich als
// "belegt" statt "Wartung" und mit Reinigungstag danach. Erkannt wird sie am
// Praefix im Feld `purpose`; eine eigene Spalte gibt es dafuer nicht.

export const RESERVATION_PREFIX = "RESERVIERT: ";
export const WARTUNG_PREFIX = "WARTUNG: ";

export const isReservation = (b: { status: string; purpose?: string | null }): boolean =>
  b.status === "wartung" && !!b.purpose?.startsWith(RESERVATION_PREFIX);

/** Anzeigename ohne technisches Praefix, z. B. "ESG Klasse 9b". */
export const sperrzeitLabel = (purpose?: string | null): string => {
  if (!purpose) return "";
  if (purpose.startsWith(RESERVATION_PREFIX)) return purpose.slice(RESERVATION_PREFIX.length);
  if (purpose.startsWith(WARTUNG_PREFIX)) return purpose.slice(WARTUNG_PREFIX.length);
  return purpose;
};
