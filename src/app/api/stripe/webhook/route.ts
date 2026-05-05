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
