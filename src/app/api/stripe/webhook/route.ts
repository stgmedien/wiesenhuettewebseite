import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { bookings, customers, payments, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendMail } from "@/lib/mail/send";
import BookingConfirmedEmail from "@/lib/mail/templates/booking-confirmed";
import BookingInternalEmail from "@/lib/mail/templates/booking-internal";
import KurtaxeInfoEmail from "@/lib/mail/templates/kurtaxe-info";
import MietvertragEmail from "@/lib/mail/templates/mietvertrag";
import { formatDateLong } from "@/lib/utils";
import { createInvoiceForBooking } from "@/lib/invoice";
import type Stripe from "stripe";

export const runtime = "nodejs"; // raw body needed
export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

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
  const bookingId = session.metadata?.bookingId;
  const kind = session.metadata?.kind;
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

    // Mietvertrag — automatisch generiert aus Buchungsdaten
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

    // Kurtaxe-Info — separat über Hochsauerland-Portal
    const kurtaxePortalUrl = process.env.KURTAXE_PORTAL_URL ?? "https://service.hochsauerlandkreis.de/kurtaxe";
    const adultsForKurtaxe = booking.adults + booking.members + booking.teachers;
    if (adultsForKurtaxe > 0) {
      try {
        await sendMail({
          to: customer.email,
          subject: `Kurtaxe Hochsauerland für Buchung ${booking.bookingNumber}`,
          template: "kurtaxe-info",
          bookingId,
          react: KurtaxeInfoEmail({
            guestName,
            bookingNumber: booking.bookingNumber,
            arrival: formatDateLong(booking.arrival),
            departure: formatDateLong(booking.departure),
            adultsForKurtaxe,
            kurtaxePortalUrl,
          }),
        });
      } catch (err) {
        console.error("[webhook] kurtaxe mail failed", err);
      }
    }

    const internalTo = process.env.MAIL_INTERNAL_TO;
    if (internalTo) {
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
