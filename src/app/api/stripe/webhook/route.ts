import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { bookings, customers, payments, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendMail } from "@/lib/mail/send";
import BookingConfirmedEmail from "@/lib/mail/templates/booking-confirmed";
import BookingInternalEmail from "@/lib/mail/templates/booking-internal";
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

  const paidCents = (session.amount_total ?? 0) | 0;

  await db
    .update(bookings)
    .set({
      status: "bezahlt",
      paidCents,
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
    what: `Zahlung erhalten — Buchung ${booking.bookingNumber} bestätigt (${(paidCents / 100).toFixed(2)} €)`,
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
          paidCents,
          baseUrl,
        }),
      });
    } catch (err) {
      console.error("[webhook] customer mail failed", err);
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
            paidCents,
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
