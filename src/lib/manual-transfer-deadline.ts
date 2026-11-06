// Zahlungsfrist fuer Selbstbedienungs-Buchungen per klassischer Ueberweisung
// (payment_mode "manual_transfer"). Vorstandsvorgabe 10/2026: Diese Buchungen
// blockierten Termine bisher unbegrenzt, ohne dass Geld floss — jetzt muss die
// Anzahlung binnen 7 Tagen eingehen, sonst wird der Termin automatisch wieder
// freigegeben. Nach 5 Tagen geht eine Erinnerung raus.

/** Tage ab Buchung, bis die Anzahlung eingegangen sein muss. */
export const MANUAL_TRANSFER_DEPOSIT_DAYS = 7;
/** Tage ab Buchung bis zur Erinnerungsmail. */
export const MANUAL_TRANSFER_REMINDER_DAYS = 5;

// Die Frist gilt NUR fuer Buchungen, die ab diesem Zeitpunkt angelegt wurden.
// Aeltere Ueberweisungsbuchungen bleiben bewusst unberuehrt (Vorgabe: "Frist
// nur fuer neue") — sie wurden ohne Fristhinweis gebucht.
export const MANUAL_TRANSFER_DEADLINE_CUTOFF = new Date("2026-10-06T00:00:00+02:00");

const DAY_MS = 24 * 60 * 60 * 1000;

/** Letzter Tag (ISO-Datum), an dem die Anzahlung eingegangen sein muss. */
export const manualTransferDepositDeadlineIso = (createdAt: Date): string => {
  const d = new Date(createdAt.getTime() + MANUAL_TRANSFER_DEPOSIT_DAYS * DAY_MS);
  // Kalendertag in deutscher Zeit — Buchungen kurz vor Mitternacht sollen
  // nicht einen Tag "verlieren".
  return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
};

/** Kalendertag (ISO-Datum), ab dem die Erinnerungsmail rausgeht. */
export const manualTransferReminderIso = (createdAt: Date): string =>
  new Date(createdAt.getTime() + MANUAL_TRANSFER_REMINDER_DAYS * DAY_MS).toLocaleDateString(
    "sv-SE",
    { timeZone: "Europe/Berlin" }
  );
