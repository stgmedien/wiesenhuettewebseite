import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import {
  bookings,
  customers,
  payments,
  activityLog,
  emailLog,
  stripeWebhookEvents,
  vouchers,
  membershipTiers,
  users,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { BOOKING_BLOCKS_TAG } from "@/lib/availability";
import { sendMail } from "@/lib/mail/send";
import BookingConfirmedEmail from "@/lib/mail/templates/booking-confirmed";
import BookingInternalEmail from "@/lib/mail/templates/booking-internal";
import KurtaxeInfoEmail from "@/lib/mail/templates/kurtaxe-info";
import MietvertragEmail from "@/lib/mail/templates/mietvertrag";
import VoucherPurchaseEmail from "@/lib/mail/templates/voucher-purchase";
import VoucherGiftEmail from "@/lib/mail/templates/voucher-gift";
import MemberWelcomeEmail from "@/lib/mail/templates/member-welcome";
import MemberJoinedInternalEmail from "@/lib/mail/templates/member-joined-internal";
import { formatDateLong } from "@/lib/utils";
import { createInvoiceForBooking } from "@/lib/invoice";
import type Stripe from "stripe";

export const runtime = "nodejs"; // raw body needed
export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

/**
 * Idempotenz-Helper: prueft, ob fuer (bookingId, template) bereits eine
 * erfolgreich versendete Mail im emailLog steht. Schuetzt vor doppelten
 * Mails bei Stripe-Webhook-Retries oder bei mehreren Stripe-Events
 * (checkout.session.completed + async_payment_succeeded).
 */
async function wasMailSent(bookingId: string, template: string): Promise<boolean> {
  const r = await db
    .select({ id: emailLog.id })
    .from(emailLog)
    .where(
      and(
        eq(emailLog.bookingId, bookingId),
        eq(emailLog.template, template),
        eq(emailLog.status, "sent")
      )
    )
    .limit(1);
  return !!r[0];
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "missing signature or secret" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: `signature verification failed: ${msg}` }, { status: 400 });
  }

  // Idempotenz: bei Stripe-Retry (z.B. Network-Glitch) blockt PRIMARY KEY den
  // zweiten INSERT → wir antworten 200 deduped ohne Handler nochmal laufen zu lassen.
  // Insertion erfolgt VOR Handler-Logic — sollte ein Handler crashen, bleibt der
  // Event in DB als "processed" markiert und Stripe wird nicht weiter retryen.
  // (Failure-Recovery wäre eine spätere Verbesserung mit status-column-Flow.)
  try {
    await db.insert(stripeWebhookEvents).values({
      eventId: event.id,
      eventType: event.type,
    });
  } catch {
    // Unique-Violation → schon verarbeitet
    return NextResponse.json({ received: true, deduped: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutFailed(session);
        break;
      }
      case "checkout.session.expired": {
        // Checkout abgelaufen/abgebrochen → verwaiste "angefragt"-Buchung
        // freigeben, damit die Tage nicht dauerblockiert bleiben.
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }
      case "payment_intent.succeeded": {
        // Wird bereits ueber checkout.session.completed abgedeckt; hier nur Logging
        // damit auch Off-Session-Payments (Restzahlung-Auto-Charge) registriert werden.
        const pi = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(pi);
        break;
      }
      // -----------------------------------------------------------
      // Mitgliedsbeitrag-Subscription Events
      // -----------------------------------------------------------
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpsert(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      default:
        // ignore other event types
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] handler error", err);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const kind = session.metadata?.kind;

  // Geschenk-Gutschein-Kauf: separater Pfad (kein bookingId)
  if (kind === "gift-voucher") {
    await handleGiftVoucherPaid(session);
    return;
  }

  // Spenden (z. B. Zeltpodest): kein Folgeprozess nötig —
  // Stripe selbst ist hier die Buchhaltung. Bewusst still erledigen.
  if (kind === "donation") {
    return;
  }

  // Online-Beitritt (/mitglied-werden): Zahlung bestätigt →
  // Mitgliedschaft sofort aktivieren (kein bookingId).
  if (kind === "membership-signup") {
    await handleMembershipSignupPaid(session);
    return;
  }

  const bookingId = session.metadata?.bookingId;
  if (!bookingId) {
    console.warn("[webhook] checkout.session.completed without bookingId");
    return;
  }

  const found = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  const booking = found[0];
  if (!booking) {
    console.warn(`[webhook] booking ${bookingId} not found`);
    return;
  }

  const amountCents = (session.amount_total ?? 0) | 0;

  // Nachbelastung / Restzahlung: nur Zahlung erfassen, Status NICHT verändern.
  if (kind === "nachbelastung" || kind === "restzahlung") {
    await db
      .update(bookings)
      .set({
        paidCents: booking.paidCents + amountCents,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));

    await db.insert(payments).values({
      bookingId,
      kind: kind === "restzahlung" ? "restzahlung" : "vollzahlung",
      status: "erhalten",
      amountCents,
      method: "Stripe",
      stripePaymentIntentId: (session.payment_intent as string | null) ?? null,
      receivedAt: new Date(),
    });

    await db.insert(activityLog).values({
      who: "Stripe",
      what: `Zahlungseingang ${kind === "restzahlung" ? "Restzahlung" : "Nachbelastung"} ${(amountCents / 100).toFixed(2)} € — Buchung ${booking.bookingNumber}`,
      bookingId,
    });
    return;
  }

  // Anzahlung (initiale Buchung): Buchung auf "bezahlt" setzen + offene Zahlungen markieren
  await db
    .update(bookings)
    .set({
      status: "bezahlt",
      paidCents: amountCents,
      stripePaymentIntentId: (session.payment_intent as string | null) ?? null,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId));

  await db
    .update(payments)
    .set({
      status: "erhalten",
      receivedAt: new Date(),
      stripePaymentIntentId: (session.payment_intent as string | null) ?? null,
    })
    .where(eq(payments.bookingId, bookingId));

  await db.insert(activityLog).values({
    who: "Stripe",
    what: `Anzahlung erhalten — Buchung ${booking.bookingNumber} bestätigt (${(amountCents / 100).toFixed(2)} €)`,
    bookingId,
  });

  // Geschenk-Gutschein einlösen, falls bei der Buchung verwendet
  if (booking.voucherId && booking.voucherDiscountCents > 0) {
    try {
      const { markVoucherRedeemed } = await import("@/lib/voucher-redeem");
      await markVoucherRedeemed(booking.voucherId, booking.id, booking.voucherDiscountCents);
      await db.insert(activityLog).values({
        who: "Stripe",
        what: `Gutschein eingelöst — ${(booking.voucherDiscountCents / 100).toFixed(2)} € für Buchung ${booking.bookingNumber}`,
        bookingId,
      });
    } catch (err) {
      console.error("[webhook] voucher redemption tracking failed (non-blocking):", err);
    }
  }

  // GoBD-Rechnung anlegen (atomare Nummer via Postgres-Sequence)
  try {
    const inv = await createInvoiceForBooking(bookingId);
    if (inv.isNew) {
      await db.insert(activityLog).values({
        who: "System",
        what: `Rechnung ${inv.invoiceNumber} ausgestellt`,
        bookingId,
      });
    }
  } catch (err) {
    console.error("[webhook] invoice creation failed (non-blocking):", err);
  }

  // Send mails
  const customer = booking.customerId
    ? (await db.select().from(customers).where(eq(customers.id, booking.customerId)).limit(1))[0]
    : null;

  if (customer) {
    const guestName = `${customer.firstName} ${customer.lastName}`.trim();
    if (!(await wasMailSent(bookingId, "booking-confirmed"))) {
      try {
        await sendMail({
          to: customer.email,
          subject: `Eure Buchung ${booking.bookingNumber} ist bestätigt`,
          template: "booking-confirmed",
          bookingId,
          react: BookingConfirmedEmail({
            bookingNumber: booking.bookingNumber,
            guestName,
            arrival: formatDateLong(booking.arrival),
            departure: formatDateLong(booking.departure),
            nights: booking.nights,
            persons: booking.persons,
            totalCents: booking.subtotalCents,
            depositCents: booking.depositCents,
            paidCents: amountCents,
            baseUrl,
          }),
        });
      } catch (err) {
        console.error("[webhook] customer mail failed", err);
      }
    }

    // Mietvertrag — automatisch generiert aus Buchungsdaten
    if (!(await wasMailSent(bookingId, "mietvertrag"))) {
      try {
        const subtotal = booking.subtotalCents;
        const prepayment = Math.round(subtotal * 0.5);
        const remainder = subtotal - prepayment;
        await sendMail({
          to: customer.email,
          subject: `Mietvertrag Wiesenhütte — Buchung ${booking.bookingNumber}`,
          template: "mietvertrag",
          bookingId,
        react: MietvertragEmail({
          bookingNumber: booking.bookingNumber,
          arrival: formatDateLong(booking.arrival),
          departure: formatDateLong(booking.departure),
          nights: booking.nights,
          customer: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            company: customer.company,
            email: customer.email,
            phone: customer.phone,
            street: customer.street,
            zip: customer.zip,
            city: customer.city,
          },
          persons: {
            adults: booking.adults,
            members: booking.members,
            children: booking.children,
            pupils: booking.pupils,
            teachers: booking.teachers,
            total: booking.persons,
          },
          pricing: {
            accommodationCents: booking.accommodationCents,
            energyFlatCents: booking.energyFlatCents,
            cleaningCents: booking.cleaningCents,
            soloSurchargeCents: booking.soloSurchargeCents,
            minOccupancySurchargeCents: booking.minOccupancySurchargeCents,
            subtotalCents: subtotal,
            depositCents: booking.depositCents,
            prepaymentCents: prepayment,
            remainderCents: remainder,
          },
          signedAt: new Date().toISOString(),
          contractDate: new Date().toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }),
        }),
      });
      } catch (err) {
        console.error("[webhook] mietvertrag mail failed", err);
      }
    }

    // Kurtaxe-Info — Abrechnung läuft noch NICHT automatisiert; der Gast
    // bekommt nur den Hinweis, dass wir uns separat persönlich melden.
    const adultsForKurtaxe = booking.adults + booking.members + booking.teachers;
    if (adultsForKurtaxe > 0 && !(await wasMailSent(bookingId, "kurtaxe-info"))) {
      try {
        await sendMail({
          to: customer.email,
          subject: `Kurtaxe Hochsauerland — wir melden uns bei Euch (Buchung ${booking.bookingNumber})`,
          template: "kurtaxe-info",
          bookingId,
          react: KurtaxeInfoEmail({
            guestName,
            bookingNumber: booking.bookingNumber,
            arrival: formatDateLong(booking.arrival),
            departure: formatDateLong(booking.departure),
          }),
        });
      } catch (err) {
        console.error("[webhook] kurtaxe mail failed", err);
      }
    }

    const internalTo = process.env.MAIL_INTERNAL_TO;
    if (internalTo && !(await wasMailSent(bookingId, "booking-internal"))) {
      try {
        await sendMail({
          to: internalTo,
          subject: `📌 Neue Buchung ${booking.bookingNumber} — ${guestName}`,
          template: "booking-internal",
          bookingId,
          react: BookingInternalEmail({
            bookingNumber: booking.bookingNumber,
            guestName,
            guestEmail: customer.email,
            guestPhone: customer.phone,
            arrival: formatDateLong(booking.arrival),
            departure: formatDateLong(booking.departure),
            nights: booking.nights,
            persons: booking.persons,
            customerType: customer.type,
            totalCents: booking.subtotalCents,
            paidCents: amountCents,
            managerUrl: `${baseUrl}/m/buchungen/${bookingId}`,
            notes: booking.customerMessage ?? undefined,
          }),
        });
      } catch (err) {
        console.error("[webhook] internal mail failed", err);
      }
    }
  }
}

async function handleCheckoutFailed(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) return;
  await db
    .update(bookings)
    .set({ status: "angefragt", updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));
  await db.insert(activityLog).values({
    who: "Stripe",
    what: `Zahlung fehlgeschlagen — Buchung bleibt im Status „angefragt"`,
    bookingId,
  });
}

// =============================================================
// checkout.session.expired — Checkout abgelaufen/abgebrochen.
// Gibt eine verwaiste Standard-Buchung wieder frei (storniert), damit die
// Tage nicht dauerhaft blockiert bleiben. Greift NUR bei normalen, noch
// unbezahlten Buchungen — Schul-Zahlungsaufschub (payment_mode
// "school_deferred") und Vorstands-Review (requiresReview) haben einen
// eigenen Lebenszyklus und werden NICHT angefasst.
// =============================================================
async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) return;
  const found = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  const booking = found[0];
  if (!booking) return;
  if (
    booking.status !== "angefragt" ||
    booking.paidCents > 0 ||
    booking.paymentMode !== "standard" ||
    booking.requiresReview
  ) {
    return; // nichts freizugeben
  }
  await db
    .update(bookings)
    .set({ status: "storniert", updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));
  // offene Zahlungs-Zeilen als fehlgeschlagen markieren (Aufräumen)
  await db
    .update(payments)
    .set({ status: "fehlgeschlagen" })
    .where(and(eq(payments.bookingId, bookingId), eq(payments.status, "offen")));
  await db.insert(activityLog).values({
    who: "Stripe",
    what: `Checkout abgelaufen/abgebrochen — Buchung ${booking.bookingNumber} automatisch storniert, Tage wieder frei.`,
    bookingId,
  });
  // Öffentlichen Verfügbarkeits-Cache invalidieren → Tage sofort wieder buchbar.
  revalidateTag(BOOKING_BLOCKS_TAG, "max");
}

// =============================================================
// charge.refunded — markiert die zugehoerige Zahlung als erstattet,
// fuegt eine 'rueckerstattung'-Payment-Row mit negativem Betrag hinzu,
// und passt booking.paidCents an.
// =============================================================
async function handleChargeRefunded(charge: Stripe.Charge) {
  const piId = (charge.payment_intent as string | null) ?? null;
  if (!piId) {
    console.warn("[webhook] charge.refunded ohne payment_intent");
    return;
  }
  // Buchung anhand der payment_intent_id finden
  const found = await db
    .select()
    .from(bookings)
    .where(eq(bookings.stripePaymentIntentId, piId))
    .limit(1);
  const booking = found[0];
  if (!booking) {
    // Versuch ueber payments-Tabelle
    const pmtRows = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, piId))
      .limit(1);
    if (!pmtRows[0]) {
      console.warn(`[webhook] charge.refunded: keine Buchung fuer PI ${piId}`);
      return;
    }
    await markRefund(pmtRows[0].bookingId, charge.amount_refunded, piId);
    return;
  }
  await markRefund(booking.id, charge.amount_refunded, piId);
}

async function markRefund(
  bookingId: string,
  amountRefundedCents: number,
  piId: string
) {
  // Existing rueckerstattung-Payment? (Idempotenz: wenn unsere Cron schon
  // einen Refund eingetragen hat, nicht doppelt buchen)
  const existing = await db
    .select()
    .from(payments)
    .where(eq(payments.bookingId, bookingId));
  const alreadyRefunded = existing.find(
    (p) => p.kind === "rueckerstattung" && p.stripePaymentIntentId === piId
  );
  if (alreadyRefunded) {
    console.log(`[webhook] refund fuer PI ${piId} bereits eingetragen, skip`);
    return;
  }

  // Markiere die zugehoerige Original-Zahlung als 'erstattet'
  const original = existing.find(
    (p) => p.stripePaymentIntentId === piId && p.kind !== "rueckerstattung"
  );
  if (original) {
    await db
      .update(payments)
      .set({ status: "erstattet" })
      .where(eq(payments.id, original.id));
  }

  // Neue Rueckerstattungs-Row
  await db.insert(payments).values({
    bookingId,
    kind: "rueckerstattung",
    status: "erstattet",
    amountCents: -Math.abs(amountRefundedCents),
    method: "Stripe",
    stripePaymentIntentId: piId,
    receivedAt: new Date(),
  });

  // paidCents aktualisieren
  const bookingRow = (
    await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1)
  )[0];
  if (bookingRow) {
    const newPaid = Math.max(0, bookingRow.paidCents - Math.abs(amountRefundedCents));
    await db
      .update(bookings)
      .set({ paidCents: newPaid, updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));
  }

  await db.insert(activityLog).values({
    who: "Stripe",
    what: `Rückerstattung erfasst — ${(amountRefundedCents / 100).toFixed(2)} € (PI ${piId})`,
    bookingId,
  });
}

// =============================================================
// payment_intent.succeeded — primaer fuer Off-Session-Charges
// (Restzahlungs-Automatik). Bei normalen Checkout-Sessions kommt der
// Erfolg ohnehin ueber checkout.session.completed; wir ignorieren hier
// Doppel-Buchungen via Idempotenz-Check auf payments.stripePaymentIntentId.
// =============================================================
async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  const bookingId = pi.metadata?.bookingId;
  const kind = pi.metadata?.kind;
  if (!bookingId) return; // wir verwalten nur PIs mit unserer bookingId-Metadata

  // Idempotenz: schon erfasst?
  const existing = await db
    .select({ id: payments.id, status: payments.status })
    .from(payments)
    .where(eq(payments.stripePaymentIntentId, pi.id))
    .limit(1);
  if (existing[0] && existing[0].status === "erhalten") return;

  const amountCents = pi.amount_received ?? pi.amount;

  if (existing[0]) {
    await db
      .update(payments)
      .set({ status: "erhalten", receivedAt: new Date() })
      .where(eq(payments.id, existing[0].id));
  } else {
    await db.insert(payments).values({
      bookingId,
      kind: kind === "kaution-capture" ? "kaution" : "restzahlung",
      status: "erhalten",
      amountCents,
      method: "Stripe (Off-Session)",
      stripePaymentIntentId: pi.id,
      receivedAt: new Date(),
    });
  }

  // Booking paidCents anpassen
  const bookingRow = (
    await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1)
  )[0];
  if (bookingRow) {
    await db
      .update(bookings)
      .set({
        paidCents: bookingRow.paidCents + amountCents,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));
  }

  await db.insert(activityLog).values({
    who: "Stripe",
    what: `Off-Session-Zahlung erfasst — ${(amountCents / 100).toFixed(2)} € (${kind ?? "unknown"}, PI ${pi.id})`,
    bookingId,
  });
}

// =============================================================
// MEMBERSHIP SUBSCRIPTION EVENTS
// =============================================================
//
// Stripe sendet hier die Lifecycle-Events der jährlichen
// Mitgliedsbeitrags-Abos. Wir spiegeln Stripe-State auf customers-Felder:
//   stripeSubscriptionId, subscriptionStatus, subscriptionCurrentPeriodEnd,
//   stripeSubscriptionCustomerId, membershipTierCode
//
// Idempotenz: alle Handler sind upserts auf customers.id.
// =============================================================

// Resolves the local customer-row für eine Stripe-Subscription über die metadata.customerId
// (zuverlässig — wir setzen sie beim Checkout). Falls nicht gesetzt, fallback über
// stripe_subscription_customer_id.
async function findCustomerForSubscription(sub: Stripe.Subscription) {
  const localCustomerId = sub.metadata?.customerId;
  if (localCustomerId) {
    const r = await db
      .select()
      .from(customers)
      .where(eq(customers.id, localCustomerId))
      .limit(1);
    if (r[0]) return r[0];
  }
  const stripeCustomerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (stripeCustomerId) {
    const r = await db
      .select()
      .from(customers)
      .where(eq(customers.stripeSubscriptionCustomerId, stripeCustomerId))
      .limit(1);
    if (r[0]) return r[0];
  }
  return null;
}

/**
 * Online-Beitritt über /mitglied-werden: Die Checkout-Session (mode=subscription,
 * kind=membership-signup) ist bezahlt → Mitgliedschaft SOFORT aktivieren.
 * Anders als der manuelle Nachweis-Pfad (pending → Manager prüft) ist die
 * Zahlung hier selbst der Nachweis des Beitritts.
 */
async function handleMembershipSignupPaid(session: Stripe.Checkout.Session) {
  const customerId = session.metadata?.customerId;
  const tierCode = session.metadata?.tierCode ?? null;
  if (!customerId) {
    console.warn("[webhook] membership-signup ohne customerId");
    return;
  }

  const rows = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  const customer = rows[0];
  if (!customer) {
    console.warn(`[webhook] membership-signup: customer ${customerId} nicht gefunden`);
    return;
  }

  // SEPA & Co. zahlen asynchron: checkout.session.completed kommt dann mit
  // payment_status='unpaid'. NICHT sofort aktivieren — sobald die Zahlung
  // durch ist, feuert checkout.session.async_payment_succeeded und landet
  // wieder hier (gleicher Handler, dann mit payment_status='paid').
  if (session.payment_status === "unpaid") {
    await db.insert(activityLog).values({
      who: "Stripe",
      what: `Online-Beitritt: Zahlung ausstehend (SEPA/async) — ${customer.firstName} ${customer.lastName}, Aktivierung folgt nach Zahlungseingang`,
    });
    return;
  }

  const subId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;
  const stripeCustomerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

  // Idempotenz bei Stripe-Retries: dieselbe Subscription wurde bereits
  // aktiviert → nichts mehr tun (insbesondere keine zweite Willkommensmail).
  if (
    customer.membershipStatus === "verified" &&
    subId &&
    customer.stripeSubscriptionId === subId
  ) {
    return;
  }

  // Doppel-Beitritt (z. B. zwei parallel geöffnete Checkouts): Es existiert
  // bereits ein anderes Abo auf diesem Kunden → das NEUE Abo sofort beenden,
  // damit niemand doppelt Jahresbeitrag zahlt. Erstattung der bereits
  // gelaufenen Abbuchung macht der Vorstand manuell (steht im Activity-Log).
  if (
    customer.membershipStatus === "verified" &&
    subId &&
    customer.stripeSubscriptionId &&
    customer.stripeSubscriptionId !== subId
  ) {
    try {
      await stripe.subscriptions.cancel(subId);
    } catch (err) {
      console.error("[webhook] doppeltes Beitritts-Abo konnte nicht gekündigt werden:", err);
    }
    await db.insert(activityLog).values({
      who: "Stripe",
      what: `⚠️ Doppelter Online-Beitritt erkannt: ${customer.firstName} ${customer.lastName} hatte bereits Abo ${customer.stripeSubscriptionId} — neues Abo ${subId} wurde storniert. Bitte ggf. Zahlung erstatten.`,
    });
    return;
  }

  // Existiert schon ein Konto mit dieser Adresse (Beitritt ohne Login)?
  // Dann direkt verknüpfen — getBookingPrefill() löst die Mitgliederpreise
  // über customers.userId auf. Ohne Konto übernimmt das später der
  // Magic-Link-Konsum (consumeMagicLinkToken).
  let linkUserId: string | null = customer.userId;
  if (!linkUserId) {
    const u = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, customer.email))
      .limit(1);
    linkUserId = u[0]?.id ?? null;
  }

  await db
    .update(customers)
    .set({
      type: "mitglied",
      membershipStatus: "verified",
      membershipVerifiedAt: new Date(),
      membershipVerifiedBy: "Online-Beitritt (Stripe)",
      membershipRejectedReason: null,
      subscriptionStatus: "active",
      ...(linkUserId && !customer.userId ? { userId: linkUserId } : {}),
      ...(tierCode ? { membershipTierCode: tierCode } : {}),
      ...(subId ? { stripeSubscriptionId: subId } : {}),
      ...(stripeCustomerId ? { stripeSubscriptionCustomerId: stripeCustomerId } : {}),
    })
    .where(eq(customers.id, customer.id));

  // Tier-Name + Jahresbeitrag für die Mails (Fallback: Session-Betrag).
  let tierName = "Mitgliedschaft";
  let feeCents = session.amount_total ?? 0;
  if (tierCode) {
    const t = await db
      .select()
      .from(membershipTiers)
      .where(eq(membershipTiers.code, tierCode))
      .limit(1);
    if (t[0]) {
      tierName = t[0].name;
      feeCents = t[0].annualFeeCents;
    }
  }

  try {
    await sendMail({
      to: customer.email,
      subject: "Willkommen bei den Skifreunden Gütersloh — Deine Mitgliedschaft ist aktiv! 🎿",
      template: "member-welcome",
      react: MemberWelcomeEmail({
        firstName: customer.firstName ?? null,
        tierName,
        annualFeeCents: feeCents,
        bookUrl: `${baseUrl}/buchen`,
        loginUrl: `${baseUrl}/login`,
      }),
    });
  } catch (err) {
    console.error("[webhook] member-welcome mail failed:", err);
  }

  // Interner Hinweis — der Vorstand übernimmt das neue Mitglied ins Verzeichnis.
  const internal = process.env.MAIL_INTERNAL_TO;
  if (internal) {
    try {
      await sendMail({
        to: internal,
        subject: `Neues Mitglied (online): ${customer.firstName} ${customer.lastName} — ${tierName}`,
        template: "member-joined-internal",
        react: MemberJoinedInternalEmail({
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          phone: customer.phone ?? null,
          tierName,
          annualFeeCents: feeCents,
          managerUrl: `${baseUrl}/m/mitgliedschaften`,
        }),
      });
    } catch (err) {
      console.error("[webhook] member-joined-internal mail failed:", err);
    }
  }

  await db.insert(activityLog).values({
    who: "Stripe",
    what: `Online-Beitritt: ${customer.firstName} ${customer.lastName} ist jetzt Mitglied (${tierName}, ${(feeCents / 100).toFixed(2)} €/Jahr) — automatisch verifiziert`,
  });
}

async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  const customer = await findCustomerForSubscription(sub);
  if (!customer) {
    console.warn(
      `[webhook] subscription ${sub.id} ohne zugeordneten Kunden (metadata.customerId fehlt?)`
    );
    return;
  }

  const stripeCustomerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;

  // current_period_end: Stripe-Subscription speichert es als Unix-Sekunden.
  const periodEndSec = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  const periodEnd =
    typeof periodEndSec === "number" ? new Date(periodEndSec * 1000) : null;

  const tierCode = sub.metadata?.tierCode ?? customer.membershipTierCode ?? null;

  await db
    .update(customers)
    .set({
      stripeSubscriptionId: sub.id,
      stripeSubscriptionCustomerId: stripeCustomerId,
      subscriptionStatus: sub.status,
      subscriptionCurrentPeriodEnd: periodEnd,
      ...(tierCode ? { membershipTierCode: tierCode } : {}),
    })
    .where(eq(customers.id, customer.id));

  await db.insert(activityLog).values({
    who: "Stripe",
    what: `Mitgliedsbeitrag-Abo ${sub.id} → status=${sub.status}${
      tierCode ? `, tier=${tierCode}` : ""
    } (${customer.firstName} ${customer.lastName})`,
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customer = await findCustomerForSubscription(sub);
  if (!customer) return;

  await db
    .update(customers)
    .set({
      stripeSubscriptionId: null,
      subscriptionStatus: "canceled",
      subscriptionCurrentPeriodEnd: null,
      // Keep stripeSubscriptionCustomerId for künftige Re-Subscriptions
      // damit Stripe-Customer-Portal weiter funktioniert.
    })
    .where(eq(customers.id, customer.id));

  await db.insert(activityLog).values({
    who: "Stripe",
    what: `Mitgliedsbeitrag-Abo gekündigt (${sub.id}) — ${customer.firstName} ${customer.lastName}`,
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Wir verarbeiten hier nur Subscription-Invoices.
  const subRef = (invoice as unknown as { subscription?: string | Stripe.Subscription })
    .subscription;
  const subscriptionId =
    typeof subRef === "string" ? subRef : subRef?.id ?? null;
  if (!subscriptionId) return;

  const stripeCustomerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!stripeCustomerId) return;

  // Find local customer
  const r = await db
    .select()
    .from(customers)
    .where(eq(customers.stripeSubscriptionCustomerId, stripeCustomerId))
    .limit(1);
  const customer = r[0];
  if (!customer) {
    // Vielleicht noch nicht über subscription.created verlinkt — wir fallen auf
    // metadata.customerId aus den Sub-Lines zurück:
    const lineMeta = invoice.lines?.data?.[0]?.metadata?.customerId;
    if (lineMeta) {
      const fallback = await db
        .select()
        .from(customers)
        .where(eq(customers.id, lineMeta))
        .limit(1);
      if (fallback[0]) {
        await db
          .update(customers)
          .set({
            stripeSubscriptionCustomerId: stripeCustomerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: "active",
          })
          .where(eq(customers.id, fallback[0].id));
      }
    }
    return;
  }

  // Subscription-Status auf 'active' setzen, falls noch incomplete.
  await db
    .update(customers)
    .set({
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: "active",
    })
    .where(eq(customers.id, customer.id));

  const amountCents = invoice.amount_paid ?? 0;
  await db.insert(activityLog).values({
    who: "Stripe",
    what: `Mitgliedsbeitrag eingezogen — ${(amountCents / 100).toFixed(2)} € (${customer.firstName} ${customer.lastName}, Sub ${subscriptionId})`,
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subRef = (invoice as unknown as { subscription?: string | Stripe.Subscription })
    .subscription;
  const subscriptionId =
    typeof subRef === "string" ? subRef : subRef?.id ?? null;
  if (!subscriptionId) return;

  const stripeCustomerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!stripeCustomerId) return;

  const r = await db
    .select()
    .from(customers)
    .where(eq(customers.stripeSubscriptionCustomerId, stripeCustomerId))
    .limit(1);
  const customer = r[0];
  if (!customer) return;

  await db
    .update(customers)
    .set({
      subscriptionStatus: "past_due",
    })
    .where(eq(customers.id, customer.id));

  await db.insert(activityLog).values({
    who: "Stripe",
    what: `Mitgliedsbeitrag-Lastschrift fehlgeschlagen — ${customer.firstName} ${customer.lastName} (Sub ${subscriptionId})`,
  });
}

// =============================================================
// GESCHENK-GUTSCHEIN — Zahlung erfolgreich, Code aktivieren + Mails
// =============================================================

async function handleGiftVoucherPaid(session: Stripe.Checkout.Session) {
  const voucherId = session.metadata?.voucherId;
  if (!voucherId) {
    console.warn("[webhook] gift-voucher session without voucherId");
    return;
  }

  const found = await db.select().from(vouchers).where(eq(vouchers.id, voucherId)).limit(1);
  const v = found[0];
  if (!v) {
    console.warn(`[webhook] voucher ${voucherId} not found`);
    return;
  }
  if (v.paidAt) {
    // Idempotent: schon verarbeitet
    return;
  }

  const piId = (session.payment_intent as string | null) ?? null;
  await db
    .update(vouchers)
    .set({
      stripePaymentIntentId: piId,
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(vouchers.id, voucherId));

  await db.insert(activityLog).values({
    who: "Stripe",
    what: `Geschenk-Gutschein ${v.code} bezahlt (${(v.valueCents / 100).toFixed(2)} €)`,
  });

  const valueEuros = (v.valueCents / 100).toFixed(2).replace(".", ",");
  const expiresAtFormatted = v.expiresAt
    ? v.expiresAt.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })
    : "—";
  const bookingUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000") + "/buchen";

  // Mail an Käufer (immer)
  try {
    await sendMail({
      to: v.purchaserEmail,
      subject: `Dein Wiesenhütte-Gutschein über ${valueEuros} € ist bereit`,
      template: "voucher_purchase",
      react: VoucherPurchaseEmail({
        purchaserName: v.purchaserName,
        recipientName: v.recipientName,
        recipientEmail: v.recipientEmail,
        deliveryMode: v.deliveryMode as "email" | "print",
        code: v.code,
        valueEuros,
        expiresAtFormatted,
      }),
    });
  } catch (err) {
    console.error("[webhook] voucher purchase mail failed", err);
  }

  // Mail an Empfänger:in (nur bei deliveryMode=email)
  if (v.deliveryMode === "email" && v.recipientEmail && v.recipientName) {
    try {
      await sendMail({
        to: v.recipientEmail,
        subject: `🎁 Ein Geschenk von ${v.purchaserName}: Wiesenhütte-Gutschein über ${valueEuros} €`,
        template: "voucher_gift",
        react: VoucherGiftEmail({
          recipientName: v.recipientName,
          purchaserName: v.purchaserName,
          personalMessage: v.personalMessage,
          code: v.code,
          valueEuros,
          expiresAtFormatted,
          bookingUrl,
        }),
      });
    } catch (err) {
      console.error("[webhook] voucher gift mail failed", err);
    }
  }
}
