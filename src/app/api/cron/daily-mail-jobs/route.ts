import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { warmUpDb } from "@/lib/db/warmup";
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
import SchoolDepositDueEmail from "@/lib/mail/templates/school-deposit-due";
import SchoolDepositWarningEmail from "@/lib/mail/templates/school-deposit-warning";
import SchoolBookingCancelledEmail from "@/lib/mail/templates/school-booking-cancelled";
import HuettenwartNoticeEmail from "@/lib/mail/templates/huettenwart-notice";
import { HUETTENWART_EMAIL } from "@/lib/huettenwart";
import RestzahlungRequestEmail from "@/lib/mail/templates/restzahlung-request";
import { MANUAL_REST_MARKER, MANUAL_REST_SENT_MARKER } from "@/lib/payment-markers";
import AvsReminderInternalEmail from "@/lib/mail/templates/avs-reminder-internal";
import MailFailureDigestEmail from "@/lib/mail/templates/mail-failure-digest";
import { getUnresolvedMailFailures } from "@/lib/mail-log";
import { findMailTemplateMeta } from "@/lib/automatic-mail-templates";
import {
  getOrCreateDepositCheckout,
  SCHOOL_DEPOSIT_DUE_DAYS,
  SCHOOL_WARNING_1_DAYS,
  SCHOOL_WARNING_2_DAYS,
  SCHOOL_CANCEL_DAYS,
} from "@/lib/school-deposit";
import { cancellationFeeForBooking, formatEuro } from "@/lib/pricing";
import { revalidateTag } from "next/cache";
import { BOOKING_BLOCKS_TAG } from "@/lib/availability";
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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.de";

// Hüttenwart-Mails (T-7) gehen an die gemeinsame Konstante HUETTENWART_EMAIL
// aus src/lib/huettenwart.ts (auch Webhook + Storno-Pfade nutzen sie, Issue #68).

const isoDayOffset = (offset: number): string => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

// Zieht `days` Tage von einem ISO-Datum ab (UTC-stabil) → YYYY-MM-DD.
const minusDaysIso = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
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

  // Neon-Kaltstart abfedern: Verbindung mit Retries aufbauen, bevor Mails
  // rausgehen (in Prod beobachtete CONNECT_TIMEOUTs ließen Läufe ausfallen).
  await warmUpDb();

  const stats = {
    paymentReminderSent: 0,
    arrivalInfoSent: 0,
    huettenwartNoticeSent: 0,
    feedbackRequestSent: 0,
    birthdaySent: 0,
    autoChargeSucceeded: 0,
    autoChargeFailed: 0,
    schoolDepositDueSent: 0,
    schoolWarningSent: 0,
    schoolCancelled: 0,
    manualRestSent: 0,
    avsReminderSent: 0,
    mailFailureDigestSent: 0,
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
          // Teilnehmer nachmelden geht bis Anreise−15 (Issue #60); bei T-21 ist
          // das heute+6 — letzter Hinweis.
          increaseHintUntil: formatDateLong(isoDayOffset(6)),
        }),
      });
      stats.paymentReminderSent++;
    } catch (err) {
      console.error("[cron] payment_reminder failed:", err);
    }
  }

  // ---------- T-21: Interne Erinnerung — AVS-Meldeschein-Link fehlt noch ----------
  // Der AVS-Link kann nicht automatisch erzeugt werden (Winterberg-Portal ist
  // manuell, keine API — Stand Telefonat mit Anika Emde, Juli 2026). Diese
  // Mail ersetzt die Automatisierung NICHT, sondern erinnert Dana + Johannes
  // rechtzeitig (3 Wochen vor Anreise), damit der Link manuell erzeugt und
  // in der Buchung eingetragen wird, bevor T-14 die Restzahlung anstößt.
  const avsCandidates = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.arrival, t21),
        sql`${bookings.status} IN ('bestaetigt', 'bezahlt')`
      )
    );
  const avsMissing: { bookingId: string; bookingNumber: string; guestName: string; arrival: string }[] = [];
  for (const b of avsCandidates) {
    if (!b.customerId) continue;
    if (await alreadySent(b.id, "avs-selfcheckin")) continue;
    if (await alreadySent(b.id, "avs-reminder-internal")) continue;
    const customer = (
      await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1)
    )[0];
    if (!customer) continue;
    avsMissing.push({
      bookingId: b.id,
      bookingNumber: b.bookingNumber,
      guestName: `${customer.firstName} ${customer.lastName}`.trim() || "Gast",
      arrival: formatDateLong(b.arrival),
    });
  }
  if (avsMissing.length > 0) {
    const internalTo = process.env.MAIL_INTERNAL_TO;
    if (internalTo) {
      try {
        await sendMail({
          to: internalTo,
          bcc: "johannesleiskau@gmail.com",
          subject: `AVS-Meldeschein-Link fehlt noch: ${avsMissing.length} ${avsMissing.length === 1 ? "Buchung" : "Buchungen"} (Anreise in 3 Wochen)`,
          template: "avs-reminder-internal",
          react: AvsReminderInternalEmail({ bookings: avsMissing, baseUrl: BASE_URL }),
        });
        for (const b of avsMissing) {
          await db.insert(emailLog).values({
            bookingId: b.bookingId,
            to: internalTo,
            subject: "AVS-Meldeschein-Link fehlt noch",
            template: "avs-reminder-internal",
            status: "sent",
          });
        }
        stats.avsReminderSent = avsMissing.length;
      } catch (err) {
        console.error("[cron] avs-reminder-internal failed:", err);
      }
    }
  }

  // ---------- Taegliche Sammel-Erinnerung: fehlgeschlagene Mails ----------
  // Laeuft jeden Tag neu (kein alreadySent-Schutz, anders als die T-21-AVS-
  // Erinnerung oben) — eine Faelle bleibt so lange in der Liste, bis eine
  // spaetere erfolgreiche Mail derselben Vorlage an dieselbe Buchung
  // nachgewiesen ist (siehe getUnresolvedMailFailures). Max. 1 Mail/Tag.
  try {
    const mailFailures = await getUnresolvedMailFailures();
    if (mailFailures.length > 0) {
      const internalTo = process.env.MAIL_INTERNAL_TO;
      if (internalTo) {
        await sendMail({
          to: internalTo,
          bcc: "johannesleiskau@gmail.com",
          subject: `${mailFailures.length} ${mailFailures.length === 1 ? "Mail konnte" : "Mails konnten"} nicht zugestellt werden`,
          template: "mail-failure-digest",
          react: MailFailureDigestEmail({
            failures: mailFailures.map((f) => ({
              bookingId: f.bookingId,
              bookingNumber: f.bookingNumber,
              guestName: f.guestName,
              templateLabel: findMailTemplateMeta(f.template)?.label ?? f.template,
              to: f.to,
              error: f.error,
            })),
            baseUrl: BASE_URL,
          }),
        });
        stats.mailFailureDigestSent = mailFailures.length;
      }
    }
  } catch (err) {
    console.error("[cron] mail-failure-digest failed:", err);
  }

  // ---------- T-14: Off-Session-Charge der Restzahlung (+ Kaution + Kurtaxe) ----------
  // Kaution UND Kurtaxe werden nicht mehr bei Buchung eingezogen, sondern hier
  // zusammen mit der Restzahlung faellig (Kaution: Vorstandsbeschluss; Kurtaxe:
  // AVS/Winterberg zieht beim Gast nichts ein, die Rechnung geht an den
  // Verein, der sie eintreiben muss). Kurzfristige Buchungen (< 14 Tage vor
  // Anreise) zahlen beides schon bei Buchung komplett mit und laufen wegen
  // der Anreise-Distanz nie durch diesen Cron-Block.
  const t14 = isoDayOffset(14);
  const t14Bookings = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.arrival, t14), eq(bookings.status, "bezahlt")));
  for (const b of t14Bookings) {
    const restPmts = await db
      .select()
      .from(payments)
      .where(and(eq(payments.bookingId, b.id), eq(payments.kind, "restzahlung")));
    const alreadyPaid = restPmts.some((p) => p.status === "erhalten");
    const alreadyAttempted = restPmts.some((p) => p.method === "Stripe Off-Session attempt");
    if (alreadyPaid || alreadyAttempted) continue;

    // Die bei Buchung angelegte "offene" Restzahlungs-Zeile traegt den
    // korrekten reinen Mietrest (ohne Kaution) — die nutzen statt neu zu
    // berechnen. subtotalCents - paidCents waere falsch, sobald paidCents
    // schon eine (kurzfristig sofort bezahlte) Kaution enthaelt.
    const originalRestRow = restPmts.find((p) => p.status === "offen");
    const rentRemainderCents = originalRestRow
      ? originalRestRow.amountCents
      : Math.max(0, b.subtotalCents - Math.min(b.paidCents, b.subtotalCents));

    const kautionPmts = await db
      .select()
      .from(payments)
      .where(and(eq(payments.bookingId, b.id), eq(payments.kind, "kaution")));
    const kautionAlreadyPaid = kautionPmts.some((p) => p.status === "erhalten");
    const kautionCents = kautionAlreadyPaid ? 0 : b.depositCents;

    const kurtaxePmts = await db
      .select()
      .from(payments)
      .where(and(eq(payments.bookingId, b.id), eq(payments.kind, "kurtaxe")));
    const kurtaxeAlreadyPaid = kurtaxePmts.some((p) => p.status === "erhalten");
    const kurtaxeCents = kurtaxeAlreadyPaid ? 0 : b.kurtaxeCents;

    const chargeCents = rentRemainderCents + kautionCents + kurtaxeCents;

    if (chargeCents > 0 && b.stripePaymentIntentId) {
      try {
        const originalPi = await stripe.paymentIntents.retrieve(b.stripePaymentIntentId);
        const stripeCustomer = originalPi.customer as string | null;
        const stripePaymentMethod = originalPi.payment_method as string | null;
        if (!stripeCustomer || !stripePaymentMethod) {
          console.warn(`[cron] keine Customer/PM auf PI ${b.stripePaymentIntentId}`);
          continue;
        }
        const newPi = await stripe.paymentIntents.create({
          amount: chargeCents,
          currency: "eur",
          customer: stripeCustomer,
          payment_method: stripePaymentMethod,
          off_session: true,
          confirm: true,
          metadata: { bookingId: b.id, bookingNumber: b.bookingNumber, kind: "restzahlung" },
          description: `Restzahlung${
            kautionCents > 0 || kurtaxeCents > 0
              ? ` inkl. ${[kautionCents > 0 && "Kaution", kurtaxeCents > 0 && "Kurtaxe"].filter(Boolean).join(" + ")}`
              : ""
          } Wiesenhütte ${b.bookingNumber}`,
        });
        if (newPi.status === "succeeded") {
          if (originalRestRow) {
            await db
              .update(payments)
              .set({
                status: "erhalten",
                method: "Stripe Off-Session",
                stripePaymentIntentId: newPi.id,
                receivedAt: new Date(),
              })
              .where(eq(payments.id, originalRestRow.id));
          } else {
            await db.insert(payments).values({
              bookingId: b.id,
              kind: "restzahlung",
              status: "erhalten",
              amountCents: rentRemainderCents,
              method: "Stripe Off-Session",
              stripePaymentIntentId: newPi.id,
              receivedAt: new Date(),
            });
          }
          if (kautionCents > 0) {
            await db.insert(payments).values({
              bookingId: b.id,
              kind: "kaution",
              status: "erhalten",
              amountCents: kautionCents,
              method: "Stripe Off-Session",
              stripePaymentIntentId: newPi.id,
              receivedAt: new Date(),
            });
          }
          if (kurtaxeCents > 0) {
            await db.insert(payments).values({
              bookingId: b.id,
              kind: "kurtaxe",
              status: "erhalten",
              amountCents: kurtaxeCents,
              method: "Stripe Off-Session",
              stripePaymentIntentId: newPi.id,
              receivedAt: new Date(),
            });
          }
          await db.update(bookings)
            .set({ paidCents: b.paidCents + chargeCents, updatedAt: new Date() })
            .where(eq(bookings.id, b.id));
          stats.autoChargeSucceeded++;
        } else {
          await db.insert(payments).values({
            bookingId: b.id,
            kind: "restzahlung",
            status: "offen",
            amountCents: chargeCents,
            method: "Stripe Off-Session attempt",
            stripePaymentIntentId: newPi.id,
          });
          stats.autoChargeFailed++;
        }
        await db.insert(activityLog).values({
          who: "Cron",
          what: `Restzahlungs-Off-Session-Charge (T-14): ${(chargeCents / 100).toFixed(2)} € (davon ${(kautionCents / 100).toFixed(2)} € Kaution, ${(kurtaxeCents / 100).toFixed(2)} € Kurtaxe) — ${newPi.status}`,
          bookingId: b.id,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[cron] off-session charge failed for ${b.bookingNumber}:`, msg);
        await db.insert(payments).values({
          bookingId: b.id,
          kind: "restzahlung",
          status: "fehlgeschlagen",
          amountCents: chargeCents,
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

  // ---------- Altsystem-Restzahlung: T-14 Stripe-Link-Mail ----------
  // Buchungen, die im ALTEN System mit 100 € angezahlt wurden (Anzahlung manuell
  // verbucht). Marker: payments.method == MANUAL_REST_MARKER + status "offen";
  // amountCents = geplanter Restbetrag (Summe + Kaution − 100), MANUELL von
  // Dana im ManualPaymentForm eingetragen. WICHTIG: Kurtaxe zieht AVS/Winterberg
  // beim Gast NICHT ein (Rechnung geht an den Verein) — falls der Alt-Vertrag
  // die Kurtaxe "versteckt" in der Summe enthielt, MUSS dieser Betrag mit im
  // Restbetrag bleiben (nicht rausrechnen, sonst zahlt der Verein sie aus
  // eigener Tasche). 14 Tage vor Anreise: Stripe-Checkout-Link für den Rest +
  // Mail. Eng begrenzt auf die markierten Zeilen — fasst die normale
  // Stripe-Pipeline nicht an.
  const today0 = isoDayOffset(0);
  const in14 = isoDayOffset(14);
  const manualRest = await db
    .select()
    .from(payments)
    .where(and(eq(payments.method, MANUAL_REST_MARKER), eq(payments.status, "offen")));
  for (const pm of manualRest) {
    const b = (await db.select().from(bookings).where(eq(bookings.id, pm.bookingId)).limit(1))[0];
    if (!b || b.status === "storniert") continue;
    if (b.arrival < today0 || b.arrival > in14) continue; // erst ab T-14, nicht rückwirkend
    if (await alreadySent(b.id, "restzahlung_request_manual")) continue;
    const customer = b.customerId
      ? (await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1))[0]
      : null;
    if (!customer) continue;
    const remainderCents = pm.amountCents;
    if (remainderCents <= 0) continue;
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        locale: "de",
        customer_email: customer.email,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: remainderCents,
              product_data: {
                name: `Restzahlung Wiesenhütte ${b.bookingNumber}`,
                description: `Buchung ${b.bookingNumber} · ${b.arrival} bis ${b.departure} · inkl. Kaution, abzgl. 100 € Anzahlung.`,
              },
            },
          },
        ],
        metadata: { bookingId: b.id, bookingNumber: b.bookingNumber, kind: "nachbelastung" },
        success_url: `${BASE_URL}/buchen/erfolg?bn=${b.bookingNumber}`,
        cancel_url: `${BASE_URL}/buchen/abbruch?bn=${b.bookingNumber}`,
      });
      if (!session.url) throw new Error("keine Stripe-Session-URL");
      await sendMail({
        to: customer.email,
        subject: `Restzahlung Eurer Wiesenhütten-Buchung ${b.bookingNumber}`,
        template: "restzahlung_request_manual",
        bookingId: b.id,
        react: RestzahlungRequestEmail({
          firstName: customer.firstName,
          bookingNumber: b.bookingNumber,
          institution: b.institution,
          arrival: formatDateLong(b.arrival),
          departure: formatDateLong(b.departure),
          remainderCents,
          depositCents: b.depositCents,
          checkoutUrl: session.url,
        }),
      });
      // Marker entschärfen → kein erneuter Versand (zusätzlich zur alreadySent-Idempotenz).
      await db
        .update(payments)
        .set({ method: MANUAL_REST_SENT_MARKER })
        .where(eq(payments.id, pm.id));
      await db.insert(activityLog).values({
        who: "Cron",
        what: `Altsystem-Restzahlung angefordert (T-14): ${formatEuro(remainderCents)} → ${customer.email}`,
        bookingId: b.id,
      });
      stats.manualRestSent++;
    } catch (err) {
      console.error(`[cron] Altsystem-Restzahlung fehlgeschlagen (${b.bookingNumber}):`, err);
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
            baseUrl: BASE_URL,
          }),
        });
        stats.arrivalInfoSent++;
      } catch (err) {
        console.error("[cron] arrival_info failed:", err);
      }
    }

    // Hüttenwart-Benachrichtigung (Toni): gleiche T-7-Logik, eigene
    // Idempotenz. Enthält Portal-Link zur Buchung für Ansicht + Abnahme.
    if (!(await alreadySent(b.id, "huettenwart_notice"))) {
      try {
        // Liegt bis T-7 schon eine hochgeladene Kurkarten-Sammel-PDF vor
        // (AVS-Gruppenregistrierung), bekommt Toni sie direkt mit angehängt —
        // dann muss niemand mehr manuell dran denken, sie ihm zuzuschicken.
        let attachments: { filename: string; content: Buffer; contentType: string }[] | undefined;
        if (b.kurkartenPdfUrl) {
          try {
            const pdfRes = await fetch(b.kurkartenPdfUrl);
            if (pdfRes.ok) {
              attachments = [
                {
                  filename: `Kurkarten-${b.bookingNumber}.pdf`,
                  content: Buffer.from(await pdfRes.arrayBuffer()),
                  contentType: "application/pdf",
                },
              ];
            }
          } catch (err) {
            console.error("[cron] Kurkarten-PDF-Abruf fehlgeschlagen:", err);
          }
        }

        await sendMail({
          to: HUETTENWART_EMAIL,
          subject: `In 7 Tagen: Gruppe an der Wiesenhütte — ${b.bookingNumber}`,
          template: "huettenwart_notice",
          bookingId: b.id,
          attachments,
          react: HuettenwartNoticeEmail({
            bookingNumber: b.bookingNumber,
            guestName: `${customer.firstName} ${customer.lastName}`.trim(),
            guestPhone: customer.phone,
            arrival: formatDateLong(b.arrival),
            departure: formatDateLong(b.departure),
            persons: b.persons,
            nights: b.nights,
            purpose: b.purpose,
            managerUrl: `${BASE_URL}/m/buchungen/${b.id}`,
          }),
        });
        stats.huettenwartNoticeSent++;
      } catch (err) {
        console.error("[cron] huettenwart_notice failed:", err);
      }
    }
  }

  // =====================================================================
  // Schulgruppen-Zahlungsaufschub (payment_mode = "school_deferred")
  //
  // Nur Buchungen, die noch NICHT bezahlt sind (status "angefragt"). Sobald
  // die Anzahlung bezahlt ist, setzt der Webhook den Status auf "bezahlt" und
  // die Buchung verlaesst diese Sequenz (Restzahlung laeuft dann ueber die
  // normale T-14-Pipeline oben).
  // =====================================================================

  // ---------- A-30: Anzahlung wird faellig (Zahlungslink) ----------
  // Fenster statt exaktem Tag, damit auch spaet (innerhalb 30 Tagen) gebuchte
  // Schulgruppen beim naechsten Cron-Lauf ihre Zahlungsaufforderung erhalten.
  const schoolDueFrom = isoDayOffset(SCHOOL_CANCEL_DAYS + 1); // bis hier muss noch Zeit bis zum Auto-Storno sein
  const schoolDueTo = isoDayOffset(SCHOOL_DEPOSIT_DUE_DAYS);
  const schoolDueBookings = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.paymentMode, "school_deferred"),
        eq(bookings.status, "angefragt"),
        gte(bookings.arrival, schoolDueFrom),
        lte(bookings.arrival, schoolDueTo)
      )
    );
  for (const b of schoolDueBookings) {
    if (await alreadySent(b.id, "school_deposit_due")) continue;
    const customer = b.customerId
      ? (await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1))[0]
      : null;
    if (!customer) continue;
    const checkout = await getOrCreateDepositCheckout(b, customer.email);
    if (!checkout) {
      await db.insert(activityLog).values({
        who: "Cron",
        what: `Schul-Anzahlungslink konnte NICHT erzeugt werden — Buchung ${b.bookingNumber}`,
        bookingId: b.id,
      });
      continue;
    }
    const deadlineIso = minusDaysIso(b.arrival, SCHOOL_CANCEL_DAYS);
    try {
      await sendMail({
        to: customer.email,
        subject: `Anzahlung fällig — Buchung ${b.bookingNumber}`,
        template: "school_deposit_due",
        bookingId: b.id,
        react: SchoolDepositDueEmail({
          firstName: customer.firstName,
          bookingNumber: b.bookingNumber,
          institution: b.institution ?? "Eure Gruppe",
          arrival: formatDateLong(b.arrival),
          departure: formatDateLong(b.departure),
          prepaymentEuroLabel: formatEuro(checkout.prepaymentCents),
          checkoutUrl: checkout.url,
          deadlineLabel: formatDateLong(deadlineIso),
        }),
      });
      await db.insert(activityLog).values({
        who: "Cron",
        what: `Schul-Anzahlung fällig gestellt (A-30): ${formatEuro(checkout.prepaymentCents)} — Frist ${formatDateLong(deadlineIso)}`,
        bookingId: b.id,
      });
      stats.schoolDepositDueSent++;
    } catch (err) {
      console.error("[cron] school_deposit_due failed:", err);
    }
  }

  // ---------- A-23 / A-18: Warnungen bei weiterhin offener Anzahlung ----------
  const schoolWarnings: Array<{ days: number; template: string; isFinal: boolean }> = [
    { days: SCHOOL_WARNING_1_DAYS, template: "school_deposit_warning_1", isFinal: false },
    { days: SCHOOL_WARNING_2_DAYS, template: "school_deposit_warning_2", isFinal: true },
  ];
  for (const w of schoolWarnings) {
    const day = isoDayOffset(w.days);
    const warnBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.paymentMode, "school_deferred"),
          eq(bookings.status, "angefragt"),
          eq(bookings.arrival, day)
        )
      );
    for (const b of warnBookings) {
      // Nur warnen, wenn die Anzahlung ueberhaupt schon angefordert wurde.
      if (!(await alreadySent(b.id, "school_deposit_due"))) continue;
      if (await alreadySent(b.id, w.template)) continue;
      const customer = b.customerId
        ? (await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1))[0]
        : null;
      if (!customer) continue;
      const checkout = await getOrCreateDepositCheckout(b, customer.email);
      if (!checkout) continue;
      const deadlineIso = minusDaysIso(b.arrival, SCHOOL_CANCEL_DAYS);
      const fee = cancellationFeeForBooking(b);
      try {
        await sendMail({
          to: customer.email,
          subject: w.isFinal
            ? `Letzte Erinnerung: Anzahlung offen — Buchung ${b.bookingNumber}`
            : `Erinnerung: Anzahlung offen — Buchung ${b.bookingNumber}`,
          template: w.template,
          bookingId: b.id,
          react: SchoolDepositWarningEmail({
            firstName: customer.firstName,
            bookingNumber: b.bookingNumber,
            institution: b.institution ?? "Eure Gruppe",
            arrival: formatDateLong(b.arrival),
            prepaymentEuroLabel: formatEuro(checkout.prepaymentCents),
            checkoutUrl: checkout.url,
            deadlineLabel: formatDateLong(deadlineIso),
            stornoFeeLabel: formatEuro(fee.feeCents),
            isFinal: w.isFinal,
          }),
        });
        stats.schoolWarningSent++;
      } catch (err) {
        console.error(`[cron] ${w.template} failed:`, err);
      }
    }
  }

  // ---------- A-16: Auto-Storno bei weiterhin offener Anzahlung ----------
  const schoolCancelDay = isoDayOffset(SCHOOL_CANCEL_DAYS);
  const schoolCancelBookings = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.paymentMode, "school_deferred"),
        eq(bookings.status, "angefragt"),
        eq(bookings.arrival, schoolCancelDay)
      )
    );
  for (const b of schoolCancelBookings) {
    // Sicherheitsnetz: nur stornieren, wenn wir tatsaechlich zur Zahlung
    // aufgefordert haben (sonst nie ohne Vorwarnung stornieren).
    if (!(await alreadySent(b.id, "school_deposit_due"))) continue;
    if (await alreadySent(b.id, "school_cancelled")) continue;
    const fee = cancellationFeeForBooking(b);
    await db
      .update(bookings)
      .set({ status: "storniert", updatedAt: new Date() })
      .where(eq(bookings.id, b.id));
    // Tage wieder freigeben → oeffentlicher Verfuegbarkeits-Cache invalidieren.
    revalidateTag(BOOKING_BLOCKS_TAG, "max");
    const customer = b.customerId
      ? (await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1))[0]
      : null;
    if (customer) {
      try {
        await sendMail({
          to: customer.email,
          subject: `Buchung storniert — ${b.bookingNumber}`,
          template: "school_cancelled",
          bookingId: b.id,
          react: SchoolBookingCancelledEmail({
            firstName: customer.firstName,
            bookingNumber: b.bookingNumber,
            institution: b.institution ?? "Eure Gruppe",
            arrival: formatDateLong(b.arrival),
            departure: formatDateLong(b.departure),
            feePercent: fee.percent,
            feeCents: fee.feeCents,
          }),
        });
      } catch (err) {
        console.error("[cron] school_cancelled mail failed:", err);
      }
    }
    await db.insert(activityLog).values({
      who: "Cron",
      what: `Schul-Buchung ${b.bookingNumber} AUTO-STORNIERT (A-16, Anzahlung nicht eingegangen). Fällige Stornogebühr ${fee.percent}% = ${formatEuro(fee.feeCents)}.`,
      bookingId: b.id,
    });
    stats.schoolCancelled++;
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
