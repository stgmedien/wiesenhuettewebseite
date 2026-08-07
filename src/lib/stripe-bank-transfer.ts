/**
 * Stripe-Banküberweisung (Payment-Method "customer_balance", SEPA):
 * Vereins-/Schul-/Firmengruppen zahlen bevorzugt per klassischer Überweisung.
 * Stripe zeigt dazu eine virtuelle DEUTSCHE IBAN an, ordnet den Zahlungseingang
 * automatisch zu und kann später per Standard-Refunds-API (SEPA-Gutschrift)
 * zurückerstatten — z. B. die Kaution.
 *
 * Wichtige Eigenheiten (siehe docs.stripe.com/payments/bank-transfers):
 * - Checkout-Sessions brauchen ein Stripe-Customer-Objekt (`customer`),
 *   `customer_email`/`customer_creation` reichen nicht.
 * - `setup_future_usage` wird von customer_balance nicht unterstützt → für
 *   die Karten-Speicherung stattdessen payment_method_options.card nutzen.
 * - Zahlung ist asynchron: checkout.session.completed kommt mit
 *   payment_status "unpaid"; erst async_payment_succeeded bestätigt den
 *   Geldeingang (Guard im Stripe-Webhook).
 */

import { stripe } from "@/lib/stripe";

/** Gruppen, denen wir Banküberweisung anbieten (klassische Vereins-/Schulkassen). */
export const isBankTransferEligible = (
  customerType: string | null | undefined,
  isSchoolPurpose: boolean
): boolean => customerType === "verein" || customerType === "firma" || isSchoolPurpose;

/**
 * payment_method_options-Baustein für Checkout-Sessions mit Banküberweisung.
 * Immer zusammen mit `payment_method_types: ["card", "customer_balance"]` und
 * einem `customer` verwenden.
 */
export const BANK_TRANSFER_PM_OPTIONS = {
  customer_balance: {
    funding_type: "bank_transfer",
    bank_transfer: {
      type: "eu_bank_transfer",
      eu_bank_transfer: { country: "DE" },
    },
  },
} as const;

/**
 * Stripe-Customer zur E-Mail finden oder anlegen (Banküberweisung setzt ein
 * Customer-Objekt voraus; außerdem hängt daran die virtuelle IBAN und die
 * Refund-Kommunikation — deshalb IMMER mit E-Mail anlegen).
 */
export async function getOrCreateStripeCustomer(
  email: string,
  name?: string | null
): Promise<string> {
  const lower = email.toLowerCase().trim();
  const existing = await stripe.customers.list({ email: lower, limit: 1 });
  if (existing.data[0]) return existing.data[0].id;
  const created = await stripe.customers.create({
    email: lower,
    name: name?.trim() || undefined,
  });
  return created.id;
}
