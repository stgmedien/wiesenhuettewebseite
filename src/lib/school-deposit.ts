// =============================================================
// Schulgruppen-Zahlungsaufschub (payment_mode = "school_deferred")
//
// Schulgruppen (Klassenfahrt / Schul-/Studienfahrt) koennen die 50 %-Anzahlung
// nicht sofort beim Buchen leisten (Eltern-Gelder werden ueber Wochen
// gesammelt). Deshalb wird beim Buchen KEIN Stripe-Checkout erzeugt; die
// Anzahlung wird stattdessen vom Cron zeitgesteuert faellig:
//
//   A-30  Anzahlung wird faellig  → Mail mit Stripe-Zahlungslink
//   A-23  Warnung 1               → bei Nichtzahlung Storno-Gebuehr + Stornierung
//   A-18  Warnung 2 (letzte)      → dito
//   A-16  Frist (14 Tage) abgelaufen, weiterhin unbezahlt → Auto-Storno
//   A-14  (nur wenn Anzahlung bezahlt) Restzahlung — laeuft ueber die normale
//         bestehende T-14-Off-Session-Pipeline, weil der Anzahlungs-Checkout
//         die Karte via setup_future_usage gespeichert hat.
//
// (A = Anreisetag.) Sobald die Anzahlung bezahlt ist, setzt der Webhook den
// Status auf "bezahlt" — ab da ist die Buchung von einer normalen Buchung
// nicht mehr zu unterscheiden und durchlaeuft die Standard-Pipeline.
// =============================================================

import { db } from "@/lib/db";
import { bookings, payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

export type BookingRow = typeof bookings.$inferSelect;

/** Anlass-Kategorien, die den Schul-Zahlungsaufschub ausloesen. */
export const SCHOOL_DEFERRED_PURPOSES = new Set(["klasse", "schul"]);

export const isSchoolDeferredPurpose = (purposeCategory?: string | null): boolean =>
  !!purposeCategory && SCHOOL_DEFERRED_PURPOSES.has(purposeCategory);

// Zeitpunkte relativ zum Anreisetag (Tage vor Anreise).
export const SCHOOL_DEPOSIT_DUE_DAYS = 30;     // Anzahlung wird faellig (Mail + Link)
export const SCHOOL_WARNING_1_DAYS = 23;       // 1. Warnung
export const SCHOOL_WARNING_2_DAYS = 18;       // 2. (letzte) Warnung
export const SCHOOL_CANCEL_DAYS = 16;          // Auto-Storno bei Nichtzahlung
// Daraus ergibt sich die Zahlungsfrist: A-30 bis A-16 = 14 Tage.
export const SCHOOL_DEPOSIT_WINDOW_DAYS =
  SCHOOL_DEPOSIT_DUE_DAYS - SCHOOL_CANCEL_DAYS; // 14

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.xn--wiesenhtte-geb.com";

/** 50 %-Anzahlung (gerundet) aus dem Subtotal. */
export const schoolPrepaymentCents = (subtotalCents: number): number =>
  Math.round((subtotalCents * 50) / 100);

/**
 * Stripe-expires_at fuer den Anzahlungs-Link: bis zum Auto-Storno-Tag (A-16),
 * begrenzt auf Stripes erlaubtes Fenster [jetzt+1 h, jetzt+30 Tage].
 */
function depositLinkExpiresAt(arrivalIso: string): number {
  const arrivalMs = Date.parse(`${arrivalIso}T00:00:00Z`);
  const deadlineMs = arrivalMs - SCHOOL_CANCEL_DAYS * 86400_000; // A-16 00:00 UTC
  const nowMs = Date.now();
  const minMs = nowMs + 60 * 60 * 1000; // +1 h (Stripe-Minimum ~30 min)
  const maxMs = nowMs + 30 * 86400_000 - 60_000; // <30 Tage (Stripe-Maximum)
  const clamped = Math.min(Math.max(deadlineMs, minMs), maxMs);
  return Math.floor(clamped / 1000);
}

export type DepositCheckout = {
  url: string;
  sessionId: string;
  prepaymentCents: number;
  remainderCents: number;
};

/**
 * Liefert einen gueltigen Anzahlungs-Checkout-Link fuer eine Schul-Buchung —
 * wiederverwendet eine bereits offene Session (fuer die Warn-Mails) oder
 * erzeugt eine neue. Spiegelt die Konfiguration des normalen Initial-Checkouts
 * (Anzahlung + Kaution, setup_future_usage fuer die spaetere Restzahlung,
 * metadata.kind="anzahlung" → Webhook setzt Status "bezahlt").
 *
 * Idempotent: legt Payment-Zeilen nur an, wenn noch keine existieren.
 */
export async function getOrCreateDepositCheckout(
  booking: BookingRow,
  customerEmail: string
): Promise<DepositCheckout | null> {
  const prepaymentCents = schoolPrepaymentCents(booking.subtotalCents);
  const remainderCents = booking.subtotalCents - prepaymentCents;

  // 1) Bestehende offene Session wiederverwenden, falls vorhanden.
  if (booking.stripeSessionId) {
    try {
      const existing = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
      if (existing.status === "open" && existing.url) {
        return { url: existing.url, sessionId: existing.id, prepaymentCents, remainderCents };
      }
    } catch {
      // Session nicht abrufbar → neue erzeugen.
    }
  }

  // 2) Neue Checkout-Session erzeugen (mirror Initial-Checkout).
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      locale: "de",
      customer_email: customerEmail,
      billing_address_collection: "auto",
      expires_at: depositLinkExpiresAt(booking.arrival),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: prepaymentCents,
            product_data: {
              name: `Anzahlung 50 % — Wiesenhütte ${booking.arrival} bis ${booking.departure}`,
              description: `Buchung ${booking.bookingNumber} · ${booking.persons} Personen · ${booking.nights} Nächte. Restzahlung ${(remainderCents / 100).toFixed(2)} € wird 14 Tage vor Anreise automatisch eingezogen.`,
            },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: booking.depositCents,
            product_data: {
              name: "Kaution",
              description: "Wird innerhalb 14 Tage nach mangelfreier Abreise zurückerstattet.",
            },
          },
        },
      ],
      // Karte fuer die spaetere Off-Session-Restzahlung (T-14) speichern.
      customer_creation: "always",
      payment_intent_data: {
        setup_future_usage: "off_session",
        metadata: { bookingId: booking.id, bookingNumber: booking.bookingNumber },
      },
      metadata: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        kind: "anzahlung",
        flow: "school-deferred",
      },
      success_url: `${BASE_URL}/buchen/erfolg?bn=${booking.bookingNumber}`,
      cancel_url: `${BASE_URL}/buchen/abbruch?bn=${booking.bookingNumber}`,
    });
  } catch (err) {
    console.error(`[school-deposit] checkout create failed for ${booking.bookingNumber}:`, err);
    return null;
  }
  if (!session.url) return null;

  // stripeSessionId merken (fuer Wiederverwendung in den Warn-Mails).
  await db
    .update(bookings)
    .set({ stripeSessionId: session.id, updatedAt: new Date() })
    .where(eq(bookings.id, booking.id));

  // Payment-Zeilen nur anlegen, wenn noch keine existieren (idempotent).
  const existingPayments = await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.bookingId, booking.id));
  if (existingPayments.length === 0) {
    await db.insert(payments).values([
      { bookingId: booking.id, kind: "anzahlung", status: "offen", amountCents: prepaymentCents, method: "Stripe Checkout (Schul-Aufschub)" },
      { bookingId: booking.id, kind: "kaution", status: "offen", amountCents: booking.depositCents, method: "Stripe Checkout (Schul-Aufschub)" },
      { bookingId: booking.id, kind: "restzahlung", status: "offen", amountCents: remainderCents, method: "Stripe Off-Session (auto T-14)" },
    ]);
  }

  return { url: session.url, sessionId: session.id, prepaymentCents, remainderCents };
}
