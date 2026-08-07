/**
 * Marker-Strings für den Altsystem-Restzahlungs-Flow (`payments.method`).
 *
 * Zentral definiert, damit der T-14-Cron (`daily-mail-jobs`) und die manuelle
 * Erfassung (`ManualPaymentForm`) EXAKT denselben String verwenden — der Cron
 * filtert `payments.method === MANUAL_REST_MARKER && status === "offen"`, ein
 * Tippfehler würde die automatische Restzahlungs-Mail verhindern.
 */

/** Offener Rest einer Altsystem-Buchung → T-14-Cron erzeugt Stripe-Link. */
export const MANUAL_REST_MARKER = "Altsystem-Restzahlung @T-14";

/** Nach Versand umgesetzter Marker → kein erneuter Versand. */
export const MANUAL_REST_SENT_MARKER = "Altsystem-Restzahlung gesendet";

/**
 * Stripe-Banküberweisung (customer_balance): Checkout ist abgeschlossen,
 * aber das Geld ist noch nicht eingegangen (SEPA dauert 1–3 Werktage).
 * Der Marker hält die Buchung sichtbar "in Zahlung" und schützt sie vor dem
 * Stale-Booking-Auto-Storno im daily-cleanup.
 */
export const BANK_TRANSFER_PENDING_MARKER = "Stripe Banküberweisung angekündigt";

/** Anzeigename für per Banküberweisung eingegangene Stripe-Zahlungen. */
export const BANK_TRANSFER_LABEL = "Stripe Banküberweisung";
