import { track as vercelTrack } from "@vercel/analytics";

/**
 * Zentrale, getippte Event-Namen fuer das Funnel-Tracking.
 *
 * Wir messen bewusst nur die umsatzrelevanten Funnel-Schritte (Buchung,
 * Mitgliedschaft, Gutschein) — keine personenbezogenen Daten. Vercel Web
 * Analytics ist cookielos; `track()` ist ein No-Op, solange die <Analytics/>-
 * Komponente nicht gemountet ist (also wenn der Statistik-Consent fehlt).
 * Deshalb kann `track()` ueberall gefahrlos aufgerufen werden.
 */
export type AnalyticsEvent =
  // Buchungs-Funnel
  | "booking_start" // Wizard betreten / erster Schritt sichtbar
  | "booking_dates_selected" // gueltiger Zeitraum + Personen gewaehlt
  | "booking_step_purpose" // Schritt „Anlass" erreicht
  | "booking_step_contact" // Schritt „Kontaktdaten" erreicht
  | "booking_step_review" // Schritt „Uebersicht & Zahlung" erreicht
  | "booking_checkout_start" // Stripe-Checkout / Anfrage ausgeloest
  | "booking_review_requested" // Privatfeier → Vorstands-Pruefung statt Zahlung
  | "booking_school_deferred" // Schulgruppe → Zahlung spaeter
  // Mitgliedschaft
  | "membership_start" // Beitritts-Wizard betreten
  | "membership_checkout_start" // Stripe-Subscription-Checkout ausgeloest
  // Gutschein
  | "voucher_start" // Gutschein-Kauf begonnen
  | "voucher_checkout_start" // Stripe-Checkout fuer Gutschein ausgeloest
  // Preis-Transparenz
  | "price_page_view" // /preise aufgerufen
  | "price_to_booking"; // von /preise weiter zu /buchen

type Props = Record<string, string | number | boolean | null | undefined>;

/**
 * Funnel-Event senden. Sicher in jedem Client-Component aufrufbar; tut nichts,
 * wenn kein Statistik-Consent erteilt wurde (Analytics-Script nicht geladen).
 */
export function track(event: AnalyticsEvent, props?: Props): void {
  try {
    vercelTrack(event, props as Record<string, string | number | boolean | null>);
  } catch {
    /* defensiv: Tracking darf den Flow nie blockieren */
  }
}
