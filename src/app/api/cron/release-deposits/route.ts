import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { warmUpDb } from "@/lib/db/warmup";
import { bookings, customers, payments, activityLog } from "@/lib/db/schema";
import { and, eq, lte, gt, sql } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { sendMail } from "@/lib/mail/send";
import DepositRefundedEmail from "@/lib/mail/templates/deposit-refunded";
import { formatDateLong } from "@/lib/utils";
import { formatEuro } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron — runs daily.
 *
 * Refunds the 300 € Kaution automatically 14 days after departure for
 * every booking where:
 *  - status = 'abgereist'
 *  - departure happened more than 14 days ago
 *  - depositCents > 0
 *  - stripePaymentIntentId is set (only Portal-bookings, not manual)
 *  - no payment row with kind='rueckerstattung' exists yet (idempotency)
 *
 * Manager can BLOCK auto-refund by:
 *  - setting booking status to anything other than 'abgereist'
 *    (e.g. 'angereist' for an active dispute, or back to 'bestaetigt')
 *  - issuing a partial refund manually first (creates rueckerstattung row)
 */
export async function GET(req: NextRequest) {
  // Auth: Vercel injects authorization with CRON_SECRET when cron triggers.
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Neon-Kaltstart abfedern: Verbindung mit Retries aufbauen, bevor
  // Kautionen erstattet werden (in Prod beobachtete CONNECT_TIMEOUTs
  // ließen ganze Läufe stumm ausfallen).
  await warmUpDb();

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  // Find candidates
  const candidates = await db
    .select({
      id: bookings.id,
      bookingNumber: bookings.bookingNumber,
      arrival: bookings.arrival,
      departure: bookings.departure,
      depositCents: bookings.depositCents,
      stripePaymentIntentId: bookings.stripePaymentIntentId,
      customerId: bookings.customerId,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "abgereist"),
        lte(bookings.departure, cutoffIso),
        gt(bookings.depositCents, 0),
        // Manager can pause auto-refund explicitly — skip those
        eq(bookings.depositHold, false),
        // Only Portal bookings — manual ones have no Stripe PI to refund against
        sql`${bookings.stripePaymentIntentId} IS NOT NULL`
      )
    );

  // Filter out those that already had a refund issued
  const eligible: typeof candidates = [];
  for (const c of candidates) {
    const existing = await db
      .select({ id: payments.id })
      .from(payments)
      .where(and(eq(payments.bookingId, c.id), eq(payments.kind, "rueckerstattung")))
      .limit(1);
    if (existing.length === 0) eligible.push(c);
  }

  const summary = {
    scanned: candidates.length,
    refunded: 0 as number,
    skipped: candidates.length - eligible.length,
    failed: [] as { bookingNumber: string; error: string }[],
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.vercel.app";

  for (const b of eligible) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: b.stripePaymentIntentId!,
        amount: b.depositCents,
        reason: "requested_by_customer",
        metadata: {
          bookingId: b.id,
          bookingNumber: b.bookingNumber,
          kind: "kaution-rueckerstattung",
          source: "cron",
        },
      });

      await db.insert(payments).values({
        bookingId: b.id,
        kind: "rueckerstattung",
        status: "erstattet",
        amountCents: b.depositCents,
        method: "Stripe Auto-Refund",
        stripePaymentIntentId: b.stripePaymentIntentId,
        receivedAt: new Date(),
      });

      await db.insert(activityLog).values({
        who: "Cron",
        what: `Kaution automatisch erstattet (${formatEuro(b.depositCents)}) — Buchung ${b.bookingNumber} · Stripe-Refund ${refund.id}`,
        bookingId: b.id,
      });

      // Send confirmation mail to the customer (best-effort; don't fail the cron if mail fails)
      if (b.customerId) {
        const cFound = await db
          .select()
          .from(customers)
          .where(eq(customers.id, b.customerId))
          .limit(1);
        const c = cFound[0];
        if (c) {
          try {
            await sendMail({
              to: c.email,
              subject: `Kaution zurückgebucht — Buchung ${b.bookingNumber}`,
              template: "deposit-refunded",
              bookingId: b.id,
              react: DepositRefundedEmail({
                guestName: `${c.firstName} ${c.lastName}`.trim(),
                bookingNumber: b.bookingNumber,
                arrival: formatDateLong(b.arrival),
                departure: formatDateLong(b.departure),
                refundCents: b.depositCents,
                baseUrl,
              }),
            });
          } catch (mailErr) {
            console.error(`[cron/release-deposits] mail failed for ${b.bookingNumber}`, mailErr);
          }
        }
      }

      summary.refunded += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      summary.failed.push({ bookingNumber: b.bookingNumber, error: msg });
      console.error(`[cron/release-deposits] refund failed for ${b.bookingNumber}:`, msg);

      await db.insert(activityLog).values({
        who: "Cron",
        what: `Auto-Erstattung der Kaution FEHLGESCHLAGEN für ${b.bookingNumber}: ${msg} — bitte manuell prüfen`,
        bookingId: b.id,
      });
    }
  }

  return NextResponse.json(summary);
}
