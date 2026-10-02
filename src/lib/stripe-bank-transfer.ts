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

// ---------------------------------------------------------------------------
// Capability-Gate (Hotfix 10/2026): Stripe lehnt Checkout-Sessions mit
// customer_balance HART ab, solange die Zahlungsmethode im Dashboard nicht
// freigeschaltet ist ("payment method type provided: customer_balance is
// invalid … not activated"). Genau das ließ im Sept. 2026 Gruppen-Checkouts
// scheitern (WH-2026-8039, WH-2026-2307). Deshalb: Überweisung nur anbieten,
// wenn das Konto die Capability `bank_transfer_payments` als aktiv meldet.
// Gecacht (10 Min.), fail-closed — im Zweifel nur Karte. Sobald der Vorstand
// die Freischaltung in Stripe abschließt, greift das automatisch, ohne Deploy.
// ---------------------------------------------------------------------------
let capabilityCache: { active: boolean; checkedAt: number } | null = null;
const CAPABILITY_TTL_MS = 10 * 60 * 1000;

export async function isBankTransferActive(): Promise<boolean> {
  if (process.env.BANK_TRANSFER_FORCE === "off") return false;
  const now = Date.now();
  if (capabilityCache && now - capabilityCache.checkedAt < CAPABILITY_TTL_MS) {
    return capabilityCache.active;
  }
  try {
    // Eigenes Konto: stripe-node verlangt bei accounts.retrieve eine ID, das
    // eigene Konto liefert der Endpoint GET /v1/account (ohne ID).
    const account = (await stripe.rawRequest("get", "/v1/account", {})) as unknown as {
      capabilities?: Record<string, string | undefined>;
    };
    const active = account.capabilities?.bank_transfer_payments === "active";
    capabilityCache = { active, checkedAt: now };
    return active;
  } catch (err) {
    console.error("[bank-transfer] Capability-Check fehlgeschlagen — nur Karte:", err);
    capabilityCache = { active: false, checkedAt: now };
    return false;
  }
}

/** Zahlungsarten für Checkout-Sessions: Karte immer, Überweisung nur wenn aktiv. */
export const bankTransferPmTypes = (active: boolean): ("card" | "customer_balance")[] =>
  active ? ["card", "customer_balance"] : ["card"];

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
