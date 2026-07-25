import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { warmUpDb } from "@/lib/db/warmup";
import { bookings, customers, payments, activityLog, invoices } from "@/lib/db/schema";
import { and, eq, lte, gt, sql, ne, desc } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { sendMail, type MailAttachment } from "@/lib/mail/send";
import DepositRefundedEmail from "@/lib/mail/templates/deposit-refunded";
import { formatDateLong } from "@/lib/utils";
import { formatEuro, CANCELLATION_POLICY_CUTOFF } from "@/lib/pricing";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePdf } from "@/lib/invoice-pdf";

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
    .select()
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
          // Rechnung als PDF anhängen, falls eine aktive existiert — das ist
          // bisher der einzige Moment, in dem die Rechnung aktiv verschickt
          // wird (sonst nur Selbstbedienung im Konto). Best-effort: schlägt
          // das PDF fehl, geht die Mail trotzdem ohne Anhang raus.
          let attachments: MailAttachment[] | undefined;
          try {
            const invRows = await db
              .select()
              .from(invoices)
              .where(and(eq(invoices.bookingId, b.id), ne(invoices.status, "storniert")))
              .orderBy(desc(invoices.createdAt))
              .limit(1);
            const activeInvoice = invRows[0];
            if (activeInvoice) {
              const pdfBuffer = await renderToBuffer(
                InvoicePdf({
                  invoiceNumber: activeInvoice.invoiceNumber,
                  issueDate: activeInvoice.issueDate ?? activeInvoice.createdAt,
                  bookingNumber: b.bookingNumber,
                  customer: activeInvoice.customerSnapshot as {
                    name: string;
                    company?: string;
                    street?: string;
                    zip?: string;
                    city?: string;
                    country?: string;
                    email?: string;
                  },
                  arrival: b.arrival,
                  departure: b.departure,
                  nights: b.nights,
                  persons: b.persons,
                  lineItems: activeInvoice.lineItems as {
                    label: string;
                    qty: number;
                    unitCents: number;
                    totalCents: number;
                  }[],
                  subtotalCents: activeInvoice.subtotalCents,
                  depositCents: b.depositCents,
                  kurtaxeCents: b.kurtaxeCents,
                  kurtaxePersons: b.adults + b.members + b.teachers,
                  isLegacy: b.createdAt < CANCELLATION_POLICY_CUTOFF,
                  notes: activeInvoice.notes ?? undefined,
                })
              );
              attachments = [
                {
                  filename: `Rechnung_${activeInvoice.invoiceNumber}.pdf`,
                  content: pdfBuffer,
                  contentType: "application/pdf",
                },
              ];
            }
          } catch (pdfErr) {
            console.error(`[cron/release-deposits] Rechnungs-PDF fehlgeschlagen für ${b.bookingNumber}:`, pdfErr);
          }

          try {
            await sendMail({
              to: c.email,
              subject: `Kaution zurückgebucht — Buchung ${b.bookingNumber}`,
              template: "deposit-refunded",
              bookingId: b.id,
              attachments,
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
