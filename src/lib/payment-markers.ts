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
