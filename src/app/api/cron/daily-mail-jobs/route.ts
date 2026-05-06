import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, customers, payments, emailLog, activityLog } from "@/lib/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { sendMail } from "@/lib/mail/send";
import PaymentReminderEmail from "@/lib/mail/templates/payment-reminder";
import ArrivalInfoEmail from "@/lib/mail/templates/arrival-info";
import KeyHandoverEmail from "@/lib/mail/templates/key-handover";
import ReviewRequestEmail from "@/lib/mail/templates/review-request";
import { formatDateLong } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const KEY_SAFE_CODE = process.env.HUETTE_KEY_SAFE_CODE ?? "0000";
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.xn--wiesenhtte-geb.com";

const isoDayOffset = (offset: number): string => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

const alreadySent = async (
  bookingId: string,
  template: string
): Promise<boolean> => {
  const r = await db
    .select({ id: emailLog.id })
    .from(emailLog)
    .where(and(eq(emailLog.bookingId, bookingId), eq(emailLog.template, template)))
    .limit(1);
  return !!r[0];
};

export async function GET(req: Request) {
  // Aufruf-Schutz analog daily-cleanup
  const auth = req.headers.get("authorization") || "";
  const isVercelCron = !!req.headers.get("x-vercel-cron-signature");
  const cronSecret = process.env.CRON_SECRET;
  if (!isVercelCron && cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = {
    paymentReminderSent: 0,
    arrivalInfoSent: 0,
    keyHandoverSent: 0,
    reviewRequestSent: 0,
    autoChargeSucceeded: 0,
    autoChargeFailed: 0,
  };

  // ---------- T-14: Zahlungserinnerung ----------
  const t14 = isoDayOffset(14);
  const t14Bookings = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.arrival, t14), eq(bookings.status, "bezahlt")));
  for (const b of t14Bookings) {
    if (await alreadySent(b.id, "payment_reminder")) continue;
    const remainder = b.subtotalCents - b.paidCents + 0; // ohne Kaution, paidCents enthielt Anzahlung
    const remainderCents = Math.max(0, b.subtotalCents - Math.min(b.paidCents, b.subtotalCents));
    if (remainderCents <= 0) continue;
    const customer = b.customerId
      ? (await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1))[0]
      : null;
    if (!customer) continue;
    try {
      await sendMail({
        to: customer.email,
        subject: `Restzahlung Wiesenhütte — Buchung ${b.bookingNumber}`,
        template: "payment_reminder",
        bookingId: b.id,
        react: PaymentReminderEmail({
          firstName: customer.firstName,
          bookingNumber: b.bookingNumber,
          arrival: formatDateLong(b.arrival),
          remainderCents,
          daysUntilArrival: 14,
          paymentLink: null,
          autoChargePlanned: !!b.stripePaymentIntentId,
        }),
      });
      stats.paymentReminderSent++;
    } catch (err) {
      console.error("[cron] payment_reminder failed:", err);
    }
  }

  // ---------- T-7: Anreise-Info + Off-Session-Charge der Restzahlung ----------
  const t7 = isoDayOffset(7);
  const t7Bookings = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.arrival, t7), eq(bookings.status, "bezahlt")));
  for (const b of t7Bookings) {
    const customer = b.customerId
      ? (await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1))[0]
      : null;
    if (!customer) continue;

    // 1) Anreise-Info-Mail
    if (!(await alreadySent(b.id, "arrival_info"))) {
      try {
        await sendMail({
          to: customer.email,
          subject: `In 7 Tagen: Eure Anreise zur Wiesenhütte (${b.bookingNumber})`,
          template: "arrival_info",
          bookingId: b.id,
          react: ArrivalInfoEmail({
            firstName: customer.firstName,
            bookingNumber: b.bookingNumber,
            arrival: formatDateLong(b.arrival),
            departure: formatDateLong(b.departure),
            persons: b.persons,
            nights: b.nights,
          }),
        });
        stats.arrivalInfoSent++;
      } catch (err) {
        console.error("[cron] arrival_info failed:", err);
      }
    }

    // 2) Off-Session-Charge der Restzahlung
    const remainderCents = Math.max(
      0,
      b.subtotalCents - Math.min(b.paidCents, b.subtotalCents)
    );
    if (remainderCents > 0 && b.stripePaymentIntentId) {
      // Wurde Restzahlung schon erhalten?
      const restPmts = await db
        .select()
        .from(payments)
        .where(and(eq(payments.bookingId, b.id), eq(payments.kind, "restzahlung")));
      const alreadyPaid = restPmts.some((p) => p.status === "erhalten");
      const alreadyAttempted = restPmts.some((p) => p.method === "Stripe Off-Session attempt");
      if (alreadyPaid || alreadyAttempted) continue;

      try {
        // Original-PI laden, um Customer + Payment-Method zu kriegen
        const originalPi = await stripe.paymentIntents.retrieve(b.stripePaymentIntentId);
        const stripeCustomer = originalPi.customer as string | null;
        const stripePaymentMethod = originalPi.payment_method as string | null;
        if (!stripeCustomer || !stripePaymentMethod) {
          console.warn(`[cron] keine Customer/PM auf PI ${b.stripePaymentIntentId}`);
          continue;
        }
        const newPi = await stripe.paymentIntents.create({
          amount: remainderCents,
          currency: "eur",
          customer: stripeCustomer,
          payment_method: stripePaymentMethod,
          off_session: true,
          confirm: true,
          metadata: {
            bookingId: b.id,
            bookingNumber: b.bookingNumber,
            kind: "restzahlung",
          },
          description: `Restzahlung Wiesenhütte ${b.bookingNumber}`,
        });
        await db.insert(payments).values({
          bookingId: b.id,
          kind: "restzahlung",
          status: newPi.status === "succeeded" ? "erhalten" : "offen",
          amountCents: remainderCents,
          method:
            newPi.status === "succeeded"
              ? "Stripe Off-Session"
              : "Stripe Off-Session attempt",
          stripePaymentIntentId: newPi.id,
          receivedAt: newPi.status === "succeeded" ? new Date() : null,
        });
        if (newPi.status === "succeeded") {
          await db
            .update(bookings)
            .set({
              paidCents: b.paidCents + remainderCents,
              updatedAt: new Date(),
            })
            .where(eq(bookings.id, b.id));
          stats.autoChargeSucceeded++;
        } else {
          stats.autoChargeFailed++;
        }
        await db.insert(activityLog).values({
          who: "Cron",
          what: `Restzahlungs-Off-Session-Charge: ${(remainderCents / 100).toFixed(2)} € — ${newPi.status}`,
          bookingId: b.id,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[cron] off-session charge failed for ${b.bookingNumber}:`, msg);
        // payment-row anlegen, damit wir wissen dass wir es probiert haben
        await db.insert(payments).values({
          bookingId: b.id,
          kind: "restzahlung",
          status: "fehlgeschlagen",
          amountCents: remainderCents,
          method: "Stripe Off-Session attempt",
          stripePaymentIntentId: null,
        });
        await db.insert(activityLog).values({
          who: "Cron",
          what: `Restzahlungs-Off-Session-Charge FEHLGESCHLAGEN: ${msg.slice(0, 200)}`,
          bookingId: b.id,
        });
        stats.autoChargeFailed++;
      }
    }
  }

  // ---------- T-1: Schlüsselübergabe ----------
  const t1 = isoDayOffset(1);
  const t1Bookings = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.arrival, t1), eq(bookings.status, "bezahlt")));
  for (const b of t1Bookings) {
    if (await alreadySent(b.id, "key_handover")) continue;
    const customer = b.customerId
      ? (await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1))[0]
      : null;
    if (!customer) continue;
    try {
      await sendMail({
        to: customer.email,
        subject: `Schlüssel-Code Wiesenhütte — Buchung ${b.bookingNumber}`,
        template: "key_handover",
        bookingId: b.id,
        react: KeyHandoverEmail({
          firstName: customer.firstName,
          bookingNumber: b.bookingNumber,
          arrival: formatDateLong(b.arrival),
          keySafeCode: KEY_SAFE_CODE,
        }),
      });
      stats.keyHandoverSent++;
    } catch (err) {
      console.error("[cron] key_handover failed:", err);
    }
  }

  // ---------- T+5 nach Abreise: Bewertungsanfrage ----------
  const tMinus5 = isoDayOffset(-5);
  const reviewBookings = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.departure, tMinus5),
        eq(bookings.status, "abgereist")
      )
    );
  for (const b of reviewBookings) {
    if (await alreadySent(b.id, "review_request")) continue;
    const customer = b.customerId
      ? (await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1))[0]
      : null;
    if (!customer) continue;
    try {
      await sendMail({
        to: customer.email,
        subject: `Wie war's an der Wiesenhütte? (${b.bookingNumber})`,
        template: "review_request",
        bookingId: b.id,
        react: ReviewRequestEmail({
          firstName: customer.firstName,
          bookingNumber: b.bookingNumber,
          reviewUrl: `${BASE_URL}/konto/buchungen/${b.id}`,
        }),
      });
      stats.reviewRequestSent++;
    } catch (err) {
      console.error("[cron] review_request failed:", err);
    }
  }

  return NextResponse.json({ ok: true, date: isoDayOffset(0), stats });
}
