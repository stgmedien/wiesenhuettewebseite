import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  bookings,
  customers,
  payments,
  emailLog,
  activityLog,
  feedbackEntries,
  discountCodes,
} from "@/lib/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { sendMail } from "@/lib/mail/send";
import PaymentReminderEmail from "@/lib/mail/templates/payment-reminder";
import ArrivalInfoEmail from "@/lib/mail/templates/arrival-info";
import FeedbackRequestEmail from "@/lib/mail/templates/feedback-request";
import BirthdayEmail from "@/lib/mail/templates/birthday";
import { formatDateLong } from "@/lib/utils";
import {
  generateFeedbackToken,
  hashFeedbackToken,
  feedbackUrl,
  feedbackExpiry,
} from "@/lib/feedback";
import crypto from "crypto";

const BIRTHDAY_DISCOUNT_PERCENT = 10;
const BIRTHDAY_VALID_DAYS = 60;

function generateBirthdayCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTVWXYZ23456789"; // ohne 0,1,I,L,O,U
  let s = "";
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) s += alphabet[bytes[i] % alphabet.length];
  return `HBD-${s.slice(0, 4)}-${s.slice(4)}`;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  // Aufruf-Schutz analog daily-cleanup — fail-closed
  const auth = req.headers.get("authorization") || "";
  const isVercelCron = !!req.headers.get("x-vercel-cron-signature");
  if (!isVercelCron) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const stats = {
    paymentReminderSent: 0,
    arrivalInfoSent: 0,
    feedbackRequestSent: 0,
    birthdaySent: 0,
    autoChargeSucceeded: 0,
    autoChargeFailed: 0,
  };

  // ---------- T-21: Zahlungserinnerung (1 Woche vor Auto-Einzug bei T-14) ----------
  const t21 = isoDayOffset(21);
  const t21Bookings = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.arrival, t21), eq(bookings.status, "bezahlt")));
  for (const b of t21Bookings) {
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
          daysUntilArrival: 21,
          paymentLink: null,
          autoChargePlanned: !!b.stripePaymentIntentId,
        }),
      });
      stats.paymentReminderSent++;
    } catch (err) {
      console.error("[cron] payment_reminder failed:", err);
    }
  }

  // ---------- T-14: Off-Session-Charge der Restzahlung ----------
  const t14 = isoDayOffset(14);
  const t14Bookings = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.arrival, t14), eq(bookings.status, "bezahlt")));
  for (const b of t14Bookings) {
    const remainderCents = Math.max(
      0,
      b.subtotalCents - Math.min(b.paidCents, b.subtotalCents)
    );
    if (remainderCents > 0 && b.stripePaymentIntentId) {
      const restPmts = await db
        .select()
        .from(payments)
        .where(and(eq(payments.bookingId, b.id), eq(payments.kind, "restzahlung")));
      const alreadyPaid = restPmts.some((p) => p.status === "erhalten");
      const alreadyAttempted = restPmts.some((p) => p.method === "Stripe Off-Session attempt");
      if (alreadyPaid || alreadyAttempted) continue;
      try {
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
          metadata: { bookingId: b.id, bookingNumber: b.bookingNumber, kind: "restzahlung" },
          description: `Restzahlung Wiesenhütte ${b.bookingNumber}`,
        });
        await db.insert(payments).values({
          bookingId: b.id,
          kind: "restzahlung",
          status: newPi.status === "succeeded" ? "erhalten" : "offen",
          amountCents: remainderCents,
          method: newPi.status === "succeeded" ? "Stripe Off-Session" : "Stripe Off-Session attempt",
          stripePaymentIntentId: newPi.id,
          receivedAt: newPi.status === "succeeded" ? new Date() : null,
        });
        if (newPi.status === "succeeded") {
          await db.update(bookings)
            .set({ paidCents: b.paidCents + remainderCents, updatedAt: new Date() })
            .where(eq(bookings.id, b.id));
          stats.autoChargeSucceeded++;
        } else {
          stats.autoChargeFailed++;
        }
        await db.insert(activityLog).values({
          who: "Cron",
          what: `Restzahlungs-Off-Session-Charge (T-14): ${(remainderCents / 100).toFixed(2)} € — ${newPi.status}`,
          bookingId: b.id,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[cron] off-session charge failed for ${b.bookingNumber}:`, msg);
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
          what: `Restzahlungs-Off-Session-Charge FEHLGESCHLAGEN (T-14): ${msg.slice(0, 200)}`,
          bookingId: b.id,
        });
        stats.autoChargeFailed++;
      }
    }
  }

  // ---------- T-7: Anreise-Info-Mail ----------
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

  }

  // ---------- T-1: Schlüsselübergabe ----------
  // Bewusst ENTFERNT: Die Schlüssel-/Safe-Code-Mail wird nicht mehr
  // automatisch versendet. Schlüsselübergabe wird anderweitig geregelt.

  // ---------- T+2 nach Abreise: Feedback-Anfrage (Token-Mail) ----------
  // Strukturiertes Survey-Feedback unter /feedback/[token]. Antworten landen
  // in feedback_entries und werden im Manager-Backend ausgewertet.
  const tMinus2 = isoDayOffset(-2);
  const feedbackBookings = await db
    .select()
    .from(bookings)
    .where(
      and(eq(bookings.departure, tMinus2), eq(bookings.status, "abgereist"))
    );
  for (const b of feedbackBookings) {
    if (await alreadySent(b.id, "feedback_request")) continue;
    // Sicherstellen, dass nicht schon ein feedback_entry existiert (Idempotenz
    // bei Mehrfach-Cron-Aufrufen)
    const existing = await db
      .select({ id: feedbackEntries.id })
      .from(feedbackEntries)
      .where(eq(feedbackEntries.bookingId, b.id))
      .limit(1);
    if (existing[0]) continue;

    const customer = b.customerId
      ? (await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1))[0]
      : null;
    if (!customer) continue;

    // Token erzeugen, Hash speichern, Mail versenden
    const token = generateFeedbackToken();
    const tokenHash = hashFeedbackToken(token);
    const expiresAt = feedbackExpiry();
    try {
      await db.insert(feedbackEntries).values({
        bookingId: b.id,
        tokenHash,
        expiresAt,
      });
      await sendMail({
        to: customer.email,
        subject: `Wie war Dein Aufenthalt? — 2 Min. Feedback (${b.bookingNumber})`,
        template: "feedback_request",
        bookingId: b.id,
        react: FeedbackRequestEmail({
          firstName: customer.firstName,
          bookingNumber: b.bookingNumber,
          feedbackUrl: feedbackUrl(BASE_URL, token),
        }),
      });
      stats.feedbackRequestSent++;
    } catch (err) {
      console.error("[cron] feedback_request failed:", err);
    }
  }

  // ---------- Geburtstagsmail mit Discount-Code ----------
  // Tägliche Suche nach Customers, deren birth_date heute Monat+Tag-Match liefert.
  // Pro Jahr nur einmal pro Customer (issuedReason='Geburtstag YYYY' im
  // discount_codes-Audit).
  const todayDate = new Date();
  const todayMonth = todayDate.getMonth() + 1;
  const todayDay = todayDate.getDate();
  const thisYear = todayDate.getFullYear();
  const birthdayReason = `Geburtstag ${thisYear}`;

  try {
    const birthdayRows = (await db.execute(sql`
      SELECT c.id, c.email, c.first_name
      FROM customers c
      WHERE c.birth_date IS NOT NULL
        AND EXTRACT(MONTH FROM c.birth_date) = ${todayMonth}
        AND EXTRACT(DAY FROM c.birth_date) = ${todayDay}
        AND c.email_opt_out = false
        AND c.anonymized_at IS NULL
        AND c.email NOT LIKE '%@wiesenhuette.invalid'
        AND NOT EXISTS (
          SELECT 1 FROM discount_codes dc
          WHERE dc.customer_id = c.id
            AND dc.issued_reason = ${birthdayReason}
        )
    `)) as unknown as Array<{ id: string; email: string; first_name: string }>;

    for (const row of birthdayRows) {
      const code = generateBirthdayCode();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + BIRTHDAY_VALID_DAYS);

      try {
        await db.insert(discountCodes).values({
          code,
          kind: "promo",
          percentOff: BIRTHDAY_DISCOUNT_PERCENT,
          customerId: row.id,
          issuedReason: birthdayReason,
          validUntil: validUntil.toISOString().slice(0, 10),
          maxRedemptions: 1,
          active: true,
        });
        await sendMail({
          to: row.email,
          subject: `🎉 Alles Gute zum Geburtstag, ${row.first_name}!`,
          template: "birthday",
          react: BirthdayEmail({
            firstName: row.first_name,
            discountCode: code,
            discountPercent: BIRTHDAY_DISCOUNT_PERCENT,
            validUntilFormatted: validUntil.toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }),
            bookingUrl: `${BASE_URL}/buchen`,
          }),
        });
        await db.insert(activityLog).values({
          who: "System (Geburtstags-Cron)",
          what: `Geburtstagsmail an ${row.email} versendet (Code ${code}, ${BIRTHDAY_DISCOUNT_PERCENT}% bis ${validUntil.toLocaleDateString("de-DE")})`,
        });
        stats.birthdaySent++;
      } catch (err) {
        console.error(`[cron] birthday mail failed for ${row.email}:`, err);
      }
    }
  } catch (err) {
    console.error("[cron] birthday query failed:", err);
  }

  return NextResponse.json({ ok: true, date: isoDayOffset(0), stats });
}
