"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { bookings, customers, payments, activityLog } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { BOOKING_BLOCKS_TAG } from "@/lib/availability";
import { MANUAL_REST_MARKER } from "@/lib/payment-markers";
import { stripe } from "@/lib/stripe";
import { sendMail } from "@/lib/mail/send";
import ManagerMessageEmail from "@/lib/mail/templates/manager-message";
import BookingConfirmedEmail from "@/lib/mail/templates/booking-confirmed";
import BookingCancelledEmail from "@/lib/mail/templates/booking-cancelled";
import AvsSelfCheckinEmail from "@/lib/mail/templates/avs-selfcheckin";
import HuettenwartCancellationEmail from "@/lib/mail/templates/huettenwart-cancellation";
import { HUETTENWART_EMAIL, HUETTENWART_CC } from "@/lib/huettenwart";
import { buildIcalCancel } from "@/lib/mail/ical";
import { formatDateLong } from "@/lib/utils";
import { formatEuro, calculatePrice, type Persons } from "@/lib/pricing";
import { resolveBookingTariffs } from "@/lib/pricing-tariffs";
import { mailTemplates, mailTemplateVersions } from "@/lib/db/schema";
import { substituteVars } from "@/lib/mail-render";
import { buildBookingVars } from "@/lib/mail-template-vars";
import { confirmDepositPayment, buildBookingConfirmedEmailProps } from "@/lib/booking-payment-confirmation";
import { generateFeuerwehrListePdf } from "@/lib/generate-feuerwehr-liste";
import { buildInvoicePdfAttachment } from "@/lib/invoice-attachment";
import DepositRefundedEmail from "@/lib/mail/templates/deposit-refunded";
import { buildKurkartenFilename } from "@/lib/kurkarten";
import type { MailAttachment } from "@/lib/mail/send";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
  return session!;
}

const ALLOWED_STATUSES = new Set([
  "angefragt",
  "bestaetigt",
  "bezahlt",
  "angereist",
  "abgereist",
  "storniert",
  "wartung",
]);

export async function setBookingStatus(
  bookingId: string,
  status: string,
  notifyGuest = false
) {
  const session = await requireManager();
  if (!ALLOWED_STATUSES.has(status)) throw new Error("Invalid status");

  const found = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  const b = found[0];
  if (!b) throw new Error("Not found");

  await db
    .update(bookings)
    .set({ status: status as never, updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));

  await db.insert(activityLog).values({
    who: session.user?.name ?? session.user?.email ?? "Manager",
    what: `Status geändert: ${b.status} → ${status}`,
    bookingId,
  });

  // Optionale Gast-Benachrichtigung bei MANUELLEM Statuswechsel.
  // Standardmaessig laufen Buchungs-Mails nur ueber den Stripe-Webhook; ein
  // manueller Wechsel (z.B. storniert -> bestaetigt) verschickt sonst KEINE
  // Mail. Best-effort: schlaegt der Versand fehl, bleibt der Statuswechsel gueltig.
  if (notifyGuest && (status === "bestaetigt" || status === "storniert") && b.customerId) {
    try {
      const c = (
        await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1)
      )[0];
      if (c?.email) {
        if (status === "bestaetigt") {
          const pmtRows = await db
            .select({ kind: payments.kind, amountCents: payments.amountCents })
            .from(payments)
            .where(eq(payments.bookingId, bookingId));
          await sendMail({
            to: c.email,
            subject: `Eure Buchung ${b.bookingNumber} ist bestätigt`,
            template: "booking-confirmed",
            bookingId,
            react: BookingConfirmedEmail(
              buildBookingConfirmedEmailProps({
                booking: b,
                customer: c,
                paidCents: b.paidCents,
                pmtRows,
                kautionDueNow: pmtRows.some((p) => p.kind === "kaution"),
              })
            ),
          });
        } else {
          await sendMail({
            to: c.email,
            subject: `Eure Buchung ${b.bookingNumber} wurde storniert`,
            template: "booking-cancelled",
            bookingId,
            react: BookingCancelledEmail({
              firstName: c.firstName,
              bookingNumber: b.bookingNumber,
              feePercent: 0,
              feeCents: 0,
              baseCents: b.subtotalCents,
              baseLabel: "Buchungssumme (ohne Kaution)",
            }),
          });
        }
        await db.insert(activityLog).values({
          who: session.user?.name ?? session.user?.email ?? "Manager",
          what: `Status-Mail (${status}) an ${c.email} gesendet`,
          bookingId,
        });
      }
    } catch (err) {
      console.error("[setBookingStatus] Gast-Benachrichtigung fehlgeschlagen:", err);
    }
  }

  // Hüttenservice bei Stornierung informieren — nur wenn Zahlung eingegangen ist.
  if (status === "storniert" && b.status !== "storniert" && b.paidCents > 0) {
    try {
      const c = b.customerId
        ? (await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1))[0]
        : null;
      await sendMail({
        to: HUETTENWART_EMAIL,
        bcc: HUETTENWART_CC,
        subject: `Stornierung — ${b.bookingNumber} (${formatDateLong(b.arrival)})`,
        template: "huettenwart-cancellation",
        bookingId,
        attachments: [buildIcalCancel({
          bookingId,
          bookingNumber: b.bookingNumber,
          guestName: c ? `${c.firstName} ${c.lastName}`.trim() : "—",
          arrival: b.arrival,
          departure: b.departure,
          persons: b.persons,
        })],
        react: HuettenwartCancellationEmail({
          bookingNumber: b.bookingNumber,
          guestName: c ? `${c.firstName} ${c.lastName}`.trim() : "—",
          arrival: formatDateLong(b.arrival),
          departure: formatDateLong(b.departure),
          persons: b.persons,
        }),
      });
    } catch (err) {
      console.error("[setBookingStatus] Hüttenwart-Storno-Mail fehlgeschlagen:", err);
    }
  }

  // Loyalty: Wechsel auf 'abgereist' triggert ggf. Treue-Rabatt-Code.
  if (status === "abgereist" && b.status !== "abgereist" && b.customerId) {
    try {
      const { recordCompletedStayAndMaybeIssueDiscount } = await import("@/lib/loyalty");
      await recordCompletedStayAndMaybeIssueDiscount(b.customerId);
    } catch (err) {
      console.error("[loyalty] failed:", err);
    }
  }

  revalidatePath(`/m/buchungen/${bookingId}`);
  revalidatePath("/m/buchungen");
  revalidatePath("/m/dashboard");
  // Status-Wechsel (z.B. storniert/abgelehnt) gibt Tage frei oder blockt sie →
  // öffentlichen Verfügbarkeits-Cache invalidieren.
  revalidateTag(BOOKING_BLOCKS_TAG, "max");
}

// =============================================================
// Custom mail to the booker (optional with payment link)
// =============================================================

const messageSchema = z.object({
  bookingId: z.string().uuid(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(8000),
  paymentEnabled: z.boolean().default(false),
  paymentAmountEuros: z.coerce.number().positive().optional(),
  paymentReason: z.string().max(255).optional(),
  attachKurkarten: z.boolean().default(false),
  attachFeuerwehrliste: z.boolean().default(false),
});

export type SendBookingMessageResult =
  | { ok: true; paymentUrl?: string }
  | { ok: false; error: string };

export async function sendBookingMessage(
  raw: z.infer<typeof messageSchema>
): Promise<SendBookingMessageResult> {
  let session: Awaited<ReturnType<typeof requireManager>>;
  try {
    session = await requireManager();
  } catch {
    return { ok: false, error: "Nicht autorisiert" };
  }

  const parsed = messageSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const data = parsed.data;

  if (data.paymentEnabled) {
    if (!data.paymentAmountEuros || data.paymentAmountEuros <= 0) {
      return { ok: false, error: "Bei aktivem Zahlungslink muss ein Betrag > 0 angegeben sein." };
    }
  }

  const found = await db.select().from(bookings).where(eq(bookings.id, data.bookingId)).limit(1);
  const booking = found[0];
  if (!booking) return { ok: false, error: "Buchung nicht gefunden." };

  const customer = booking.customerId
    ? (await db.select().from(customers).where(eq(customers.id, booking.customerId)).limit(1))[0]
    : null;
  if (!customer) return { ok: false, error: "Kunde fehlt." };

  let paymentUrl: string | undefined;
  let amountCents: number | undefined;
  if (data.paymentEnabled && data.paymentAmountEuros) {
    amountCents = Math.round(data.paymentAmountEuros * 100);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      locale: "de",
      customer_email: customer.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amountCents,
            product_data: {
              name: data.paymentReason || `Zahlung zu Buchung ${booking.bookingNumber}`,
              description: `Buchung ${booking.bookingNumber} · Wiesenhütte`,
            },
          },
        },
      ],
      // Karte für spätere Off-Session-Abbuchungen speichern (Cron T-14,
      // Aufenthalt-Verlängerung o.ä.) — wichtig v.a. für Alt-Verträge, die
      // nie einen Stripe-Checkout durchlaufen haben (Anzahlung per
      // Banküberweisung) und daher noch keine hinterlegte Zahlungsmethode
      // haben. Der Webhook schreibt die PaymentIntent-ID danach auf die
      // Buchung zurück, falls dort noch keine hinterlegt ist.
      customer_creation: "always",
      payment_intent_data: {
        setup_future_usage: "off_session",
        metadata: { bookingId: booking.id, bookingNumber: booking.bookingNumber },
      },
      metadata: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        kind: "nachbelastung",
        reason: data.paymentReason ?? "",
      },
      success_url: `${baseUrl}/buchen/erfolg?bn=${booking.bookingNumber}`,
      cancel_url: `${baseUrl}/buchen/abbruch?bn=${booking.bookingNumber}`,
    });

    if (!stripeSession.url) {
      return { ok: false, error: "Stripe-Sitzung konnte nicht erzeugt werden." };
    }
    paymentUrl = stripeSession.url;

    await db.insert(payments).values({
      bookingId: booking.id,
      kind: "vollzahlung",
      status: "offen",
      amountCents,
      method: "Stripe Payment Link",
      stripePaymentIntentId: null,
    });

    await db.insert(activityLog).values({
      who: session.user?.name ?? session.user?.email ?? "Manager",
      what: `Zahlungslink erstellt: ${formatEuro(amountCents)} (${data.paymentReason ?? "—"}) → an ${customer.email}`,
      bookingId: booking.id,
    });
  }

  // Optionale Anhänge: bereits hochgeladene Kurkarten-PDF / Feuerwehr-Meldeliste
  // manuell mitschicken (z. B. wenn der automatische T-3-Versand aus
  // irgendeinem Grund nicht gelaufen ist).
  const attachments: MailAttachment[] = [];
  if (data.attachKurkarten && booking.kurkartenPdfUrl) {
    try {
      const res = await fetch(booking.kurkartenPdfUrl);
      if (res.ok) {
        attachments.push({
          filename: buildKurkartenFilename(customer.lastName, booking.arrival),
          content: Buffer.from(await res.arrayBuffer()),
          contentType: "application/pdf",
        });
      }
    } catch (err) {
      console.error("[sendBookingMessage] Kurkarten-PDF-Abruf fehlgeschlagen:", err);
    }
  }
  if (data.attachFeuerwehrliste && booking.feuerwehrListePdfUrl) {
    try {
      const res = await fetch(booking.feuerwehrListePdfUrl);
      if (res.ok) {
        attachments.push({
          filename: `Feuerwehr-Meldeliste-${booking.bookingNumber}.pdf`,
          content: Buffer.from(await res.arrayBuffer()),
          contentType: "application/pdf",
        });
      }
    } catch (err) {
      console.error("[sendBookingMessage] Feuerwehrliste-Abruf fehlgeschlagen:", err);
    }
  }

  // Send the mail
  try {
    await sendMail({
      to: customer.email,
      subject: data.subject,
      template: data.paymentEnabled ? "manager-message-payment" : "manager-message",
      bookingId: booking.id,
      replyTo: session.user?.email ?? undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      react: ManagerMessageEmail({
        guestName: `${customer.firstName} ${customer.lastName}`.trim(),
        bookingNumber: booking.bookingNumber,
        bodyText: data.body,
        paymentLinkUrl: paymentUrl,
        paymentAmountFormatted: amountCents ? formatEuro(amountCents) : undefined,
        paymentReason: data.paymentReason,
      }),
    });

    await db.insert(activityLog).values({
      who: session.user?.name ?? session.user?.email ?? "Manager",
      what: `Mail gesendet an ${customer.email}: „${data.subject}"`,
      bookingId: booking.id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { ok: false, error: `Mail-Versand fehlgeschlagen: ${msg}` };
  }

  revalidatePath(`/m/buchungen/${data.bookingId}`);
  revalidatePath("/m/dashboard");
  return { ok: true, paymentUrl };
}

// =============================================================
// Vorlage in Manager-Message einsetzen — laedt aktive Version eines
// Templates und substituiert die Buchungs-Variablen.
// =============================================================

export async function applyTemplateForBooking(
  templateId: string,
  bookingId: string
): Promise<{ ok: true; subject: string; body: string } | { ok: false; error: string }> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") {
    return { ok: false, error: "Nicht autorisiert" };
  }

  const tpl = (
    await db.select().from(mailTemplates).where(eq(mailTemplates.id, templateId)).limit(1)
  )[0];
  if (!tpl) return { ok: false, error: "Vorlage nicht gefunden" };
  if (!tpl.activeVersionId) return { ok: false, error: "Vorlage hat keine aktive Version" };

  const ver = (
    await db
      .select()
      .from(mailTemplateVersions)
      .where(eq(mailTemplateVersions.id, tpl.activeVersionId))
      .limit(1)
  )[0];
  if (!ver) return { ok: false, error: "Aktive Version nicht gefunden" };

  const vars = await buildBookingVars(bookingId);
  return {
    ok: true,
    subject: substituteVars(ver.subject, vars),
    body: substituteVars(ver.bodyMd, vars),
  };
}

// =============================================================
// Manuelle Zahlung erfassen — z.B. 100-€-Vorauszahlungen, die per
// Ueberweisung an den Verein gingen. Schreibt eine payments-Zeile
// (status="erhalten") und erhoeht bookings.paidCents.
// =============================================================

const recordPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  amountEuros: z.coerce.number().positive().max(100000),
  method: z.string().min(1).max(60),
  kind: z.enum(["anzahlung", "restzahlung", "vollzahlung", "kaution"]).default("anzahlung"),
  // Preset: legt den Altsystem-Restzahlungs-Marker an (exakter method-String,
  // kind=restzahlung, status="offen") → T-14-Cron fordert den Rest per Stripe an.
  // Zählt NICHT zu paidCents (noch nicht erhalten). Verhindert Tippfehler.
  altsystemRest: z.boolean().optional(),
  // Bestätigung statt nur Erfassung: löst dieselbe Automatik aus wie eine
  // Online-Zahlung (Rechnung, Gast-Bestätigung + Mietvertrag, Hüttenwart-
  // Info mit iCal). Für Gäste, die per Überweisung direkt an den Verein
  // gezahlt haben (kein Stripe möglich) — z. B. Vereine ohne eigene Karte.
  confirmAndNotify: z.boolean().optional(),
});

export type RecordPaymentResult = { ok: true } | { ok: false; error: string };

export async function recordManualPayment(
  raw: z.infer<typeof recordPaymentSchema>
): Promise<RecordPaymentResult> {
  let session: Awaited<ReturnType<typeof requireManager>>;
  try {
    session = await requireManager();
  } catch {
    return { ok: false, error: "Nicht autorisiert" };
  }

  const parsed = recordPaymentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const data = parsed.data;
  const amountCents = Math.round(data.amountEuros * 100);

  const b = (await db.select().from(bookings).where(eq(bookings.id, data.bookingId)).limit(1))[0];
  if (!b) return { ok: false, error: "Buchung nicht gefunden." };

  const isAltRest = data.altsystemRest === true;
  const who = session.user?.name ?? session.user?.email ?? "Manager";

  // Bestätigung + volle Automatik — nur sinnvoll für die initiale Zahlung
  // (Anzahlung/Vollzahlung) einer Buchung, die noch nicht als bezahlt gilt.
  if (data.confirmAndNotify && !isAltRest && (data.kind === "anzahlung" || data.kind === "vollzahlung")) {
    if (b.status !== "angefragt" && b.status !== "bestaetigt") {
      return {
        ok: false,
        error: `Buchung ist bereits „${b.status}" — Bestätigung mit Automatik ist nur vor dem ersten Zahlungseingang sinnvoll. Nutze stattdessen „Nur erfassen".`,
      };
    }
    try {
      await confirmDepositPayment({
        bookingId: data.bookingId,
        amountCents,
        source: who,
        stripePaymentIntentId: null,
        sendInternalNotice: false,
        fallbackPaymentMethod: data.method,
        fallbackPaymentKind: data.kind === "vollzahlung" ? "vollzahlung" : "anzahlung",
      });
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Bestätigung fehlgeschlagen.",
      };
    }
    await db.insert(activityLog).values({
      who,
      what: `Zahlung manuell bestätigt (${data.method}): ${formatEuro(amountCents)} — Buchung auf „bezahlt" gesetzt, Gast- und Hüttenwart-Mail verschickt`,
      bookingId: data.bookingId,
    });
    revalidatePath(`/m/buchungen/${data.bookingId}`);
    revalidatePath("/m/dashboard");
    return { ok: true };
  }

  // Preset "Altsystem-Restzahlung": offener Marker für den T-14-Cron —
  // exakter method-String, kind=restzahlung, status="offen", KEINE Erhöhung
  // von paidCents (der Rest ist noch nicht bezahlt).
  const kind = isAltRest ? "restzahlung" : data.kind;
  const status = isAltRest ? "offen" : "erhalten";
  const method = isAltRest ? MANUAL_REST_MARKER : data.method;

  await db.insert(payments).values({
    bookingId: data.bookingId,
    kind,
    status,
    amountCents,
    method,
    stripePaymentIntentId: null,
    receivedAt: isAltRest ? null : new Date(),
  });

  if (!isAltRest) {
    await db
      .update(bookings)
      .set({ paidCents: b.paidCents + amountCents, updatedAt: new Date() })
      .where(eq(bookings.id, data.bookingId));
  }

  await db.insert(activityLog).values({
    who,
    what: isAltRest
      ? `Altsystem-Restzahlungs-Marker angelegt: ${formatEuro(amountCents)} offen → T-14-Cron`
      : `Manuelle Zahlung erfasst: ${formatEuro(amountCents)} (${data.kind}, ${data.method})`,
    bookingId: data.bookingId,
  });

  revalidatePath(`/m/buchungen/${data.bookingId}`);
  revalidatePath("/m/dashboard");
  return { ok: true };
}

// =============================================================
// Manuelle Bank-Buchungen komplett ins System bringen (ohne Stripe):
// zwei "Häkchen", die dieselbe Buchführung nachziehen wie die
// automatischen Cron-Pfade (T-14-Off-Session-Charge bzw. Kaution-Auto-
// Refund) — nur eben von Dana ausgelöst, wenn Geld per Überweisung kommt
// oder rausgeht statt über Stripe.
// =============================================================

export type ManualFinalPaymentResult =
  | { ok: true; chargeCents: number; kautionCents: number; kurtaxeCents: number }
  | { ok: false; error: string };

/**
 * "Restzahlung + Kaution + Kurtaxe per Überweisung erhalten" — Pendant zur
 * T-14-Off-Session-Charge (daily-mail-jobs), nur ohne Stripe-Charge. Nutzt
 * exakt dieselbe Restbetrags-Ermittlung (offene Altsystem-Restzahlungs-Zeile
 * bevorzugt, sonst subtotalCents − paidCents), damit der T-14-Cron diese
 * Buchung danach korrekt als "bereits bezahlt" überspringt.
 */
export async function confirmManualFinalPayment(
  bookingId: string
): Promise<ManualFinalPaymentResult> {
  let session: Awaited<ReturnType<typeof requireManager>>;
  try {
    session = await requireManager();
  } catch {
    return { ok: false, error: "Nicht autorisiert" };
  }

  const b = (await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1))[0];
  if (!b) return { ok: false, error: "Buchung nicht gefunden." };
  if (b.status !== "bezahlt") {
    return { ok: false, error: `Nur bei Buchungen im Status „Bezahlt" möglich (aktuell „${b.status}").` };
  }

  const restPmts = await db
    .select()
    .from(payments)
    .where(and(eq(payments.bookingId, b.id), eq(payments.kind, "restzahlung")));
  if (restPmts.some((p) => p.status === "erhalten")) {
    return { ok: false, error: "Die Restzahlung wurde bereits erfasst." };
  }
  const originalRestRow = restPmts.find((p) => p.status === "offen");
  const rentRemainderCents = originalRestRow
    ? originalRestRow.amountCents
    : Math.max(0, b.subtotalCents - Math.min(b.paidCents, b.subtotalCents));

  const kautionPmts = await db
    .select()
    .from(payments)
    .where(and(eq(payments.bookingId, b.id), eq(payments.kind, "kaution")));
  const kautionCents = kautionPmts.some((p) => p.status === "erhalten") ? 0 : b.depositCents;

  const kurtaxePmts = await db
    .select()
    .from(payments)
    .where(and(eq(payments.bookingId, b.id), eq(payments.kind, "kurtaxe")));
  const kurtaxeCents = kurtaxePmts.some((p) => p.status === "erhalten") ? 0 : b.kurtaxeCents;

  const chargeCents = rentRemainderCents + kautionCents + kurtaxeCents;
  if (chargeCents <= 0) {
    return { ok: false, error: "Kein offener Restbetrag gefunden — nichts zu bestätigen." };
  }

  const method = "Banküberweisung (manuell bestätigt)";
  if (originalRestRow) {
    await db
      .update(payments)
      .set({ status: "erhalten", method, receivedAt: new Date() })
      .where(eq(payments.id, originalRestRow.id));
  } else {
    await db.insert(payments).values({
      bookingId: b.id,
      kind: "restzahlung",
      status: "erhalten",
      amountCents: rentRemainderCents,
      method,
      receivedAt: new Date(),
    });
  }
  if (kautionCents > 0) {
    await db.insert(payments).values({
      bookingId: b.id,
      kind: "kaution",
      status: "erhalten",
      amountCents: kautionCents,
      method,
      receivedAt: new Date(),
    });
  }
  if (kurtaxeCents > 0) {
    await db.insert(payments).values({
      bookingId: b.id,
      kind: "kurtaxe",
      status: "erhalten",
      amountCents: kurtaxeCents,
      method,
      receivedAt: new Date(),
    });
  }
  await db
    .update(bookings)
    .set({ paidCents: b.paidCents + chargeCents, updatedAt: new Date() })
    .where(eq(bookings.id, b.id));

  await db.insert(activityLog).values({
    who: session.user?.name ?? session.user?.email ?? "Manager",
    what: `Restzahlung manuell bestätigt (Banküberweisung): ${formatEuro(chargeCents)} (davon ${formatEuro(kautionCents)} Kaution, ${formatEuro(kurtaxeCents)} Kurtaxe)`,
    bookingId: b.id,
  });

  revalidatePath(`/m/buchungen/${bookingId}`);
  revalidatePath("/m/dashboard");
  return { ok: true, chargeCents, kautionCents, kurtaxeCents };
}

/**
 * "Kaution manuell zurücküberwiesen" — Pendant zum release-deposits-Cron
 * für Buchungen ohne Stripe-Zahlungsvorgang (der Cron kann dort technisch
 * gar nicht automatisch erstatten, siehe stripePaymentIntentId-Filter dort).
 * Verschickt dieselbe "Kaution zurück"-Mail mit Rechnung als PDF-Anhang.
 */
export async function confirmManualDepositReturn(
  bookingId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  let session: Awaited<ReturnType<typeof requireManager>>;
  try {
    session = await requireManager();
  } catch {
    return { ok: false, error: "Nicht autorisiert" };
  }

  const b = (await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1))[0];
  if (!b) return { ok: false, error: "Buchung nicht gefunden." };
  if (b.status !== "abgereist") {
    return { ok: false, error: "Nur bei bereits abgereisten Buchungen möglich." };
  }
  if (b.depositCents <= 0) {
    return { ok: false, error: "Keine Kaution auf dieser Buchung hinterlegt." };
  }

  const existing = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.bookingId, b.id), eq(payments.kind, "rueckerstattung")))
    .limit(1);
  if (existing.length > 0) {
    return { ok: false, error: "Für diese Buchung wurde die Kaution bereits erstattet/erfasst." };
  }

  await db.insert(payments).values({
    bookingId: b.id,
    kind: "rueckerstattung",
    status: "erstattet",
    amountCents: b.depositCents,
    method: "Banküberweisung (manuell)",
    receivedAt: new Date(),
  });

  await db.insert(activityLog).values({
    who: session.user?.name ?? session.user?.email ?? "Manager",
    what: `Kaution manuell zurücküberwiesen: ${formatEuro(b.depositCents)}`,
    bookingId: b.id,
  });

  if (b.customerId) {
    const c = (await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1))[0];
    if (c) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.vercel.app";
      const attachment = await buildInvoicePdfAttachment(b.id);
      try {
        await sendMail({
          to: c.email,
          subject: `Kaution zurückgebucht — Buchung ${b.bookingNumber}`,
          template: "deposit-refunded",
          bookingId: b.id,
          attachments: attachment ? [attachment] : undefined,
          react: DepositRefundedEmail({
            guestName: `${c.firstName} ${c.lastName}`.trim(),
            bookingNumber: b.bookingNumber,
            arrival: formatDateLong(b.arrival),
            departure: formatDateLong(b.departure),
            refundCents: b.depositCents,
            baseUrl,
          }),
        });
      } catch (err) {
        console.error("[confirmManualDepositReturn] Mail fehlgeschlagen:", err);
      }
    }
  }

  revalidatePath(`/m/buchungen/${bookingId}`);
  revalidatePath("/m/dashboard");
  return { ok: true };
}

// =============================================================
// Bestehende Zahlungszeile korrigieren — Art, Status, Betrag, Methode.
// Für Fehleingaben, die sonst nur per SQL zu beheben waren (z.B. ein
// Altsystem-Restzahlungs-Marker mit falschem Status "erhalten" statt "offen").
//
// paidCents wird konsistent per Delta geführt: eine Zeile zählt zu paidCents,
// wenn sie eine Einnahme ist (kind != "rueckerstattung") UND status "erhalten".
// Beim Speichern wird die Differenz (neuer − alter Beitrag) auf paidCents
// angewandt — self-healing auch für Umbuchungen wie erhalten→offen.
// =============================================================

const editPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  kind: z.enum(["anzahlung", "restzahlung", "vollzahlung", "kaution", "rueckerstattung"]),
  status: z.enum(["offen", "erhalten", "fehlgeschlagen", "erstattet"]),
  amountEuros: z.coerce.number().positive().max(100000),
  method: z.string().min(1).max(80),
});

/** Beitrag einer Zahlungszeile zu paidCents (nur erhaltene Einnahmen zählen). */
const paidContribution = (kind: string, status: string, amountCents: number): number =>
  kind !== "rueckerstattung" && status === "erhalten" ? amountCents : 0;

export async function editPayment(
  raw: z.infer<typeof editPaymentSchema>
): Promise<{ ok: boolean; error?: string }> {
  let session: Awaited<ReturnType<typeof requireManager>>;
  try {
    session = await requireManager();
  } catch {
    return { ok: false, error: "Nicht autorisiert" };
  }

  const parsed = editPaymentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const data = parsed.data;
  const amountCents = Math.round(data.amountEuros * 100);

  const p = (await db.select().from(payments).where(eq(payments.id, data.paymentId)).limit(1))[0];
  if (!p) return { ok: false, error: "Zahlung nicht gefunden." };
  const b = (await db.select().from(bookings).where(eq(bookings.id, p.bookingId)).limit(1))[0];
  if (!b) return { ok: false, error: "Zugehörige Buchung nicht gefunden." };

  const oldContrib = paidContribution(p.kind, p.status, p.amountCents);
  const newContrib = paidContribution(data.kind, data.status, amountCents);

  await db
    .update(payments)
    .set({
      kind: data.kind,
      status: data.status,
      amountCents,
      method: data.method.trim(),
      // Zahlungsdatum konsistent halten: bei "erhalten" bestehendes Datum
      // behalten (oder jetzt setzen), sonst leeren.
      receivedAt: data.status === "erhalten" ? (p.receivedAt ?? new Date()) : null,
    })
    .where(eq(payments.id, data.paymentId));

  const newPaid = Math.max(0, b.paidCents + (newContrib - oldContrib));
  if (newPaid !== b.paidCents) {
    await db
      .update(bookings)
      .set({ paidCents: newPaid, updatedAt: new Date() })
      .where(eq(bookings.id, b.id));
  }

  await db.insert(activityLog).values({
    who: session.user?.name ?? session.user?.email ?? "Manager",
    what:
      `Zahlung korrigiert: ${formatEuro(p.amountCents)}/${p.status}/${p.method ?? "—"} → ` +
      `${formatEuro(amountCents)}/${data.status}/${data.method.trim()}` +
      (newPaid !== b.paidCents ? ` · Bezahlt-Summe ${formatEuro(b.paidCents)} → ${formatEuro(newPaid)}` : ""),
    bookingId: b.id,
  });

  revalidatePath(`/m/buchungen/${b.id}`);
  revalidatePath("/m/dashboard");
  return { ok: true };
}

// =============================================================
// Feature B: Personen-Zusammensetzung einer Buchung anpassen (NUR Vorstand).
// Preis wird PERSONENABHAENGIG neu berechnet (Uebernachtung, Mindestbelegungs-
// Aufschlag, Allein-Aufschlag) — Extras, Rabatte, Kaution bleiben unangetastet
// (Delta-Ansatz, robust gegen Sonderfaelle). Die Geld-Differenz wird separat,
// vom Vorstand bestaetigt, ueber Stripe erstattet (refundBookingDifference).
//
// Use-Case: Mitglied wird nachtraeglich Mitglied -> ein Erwachsener wird zum
// Mitglied (-50% NUR fuer diese Person, nicht die ganze Gruppe).
// =============================================================

const editPersonsSchema = z.object({
  bookingId: z.string().uuid(),
  adults: z.coerce.number().int().min(0).max(60),
  members: z.coerce.number().int().min(0).max(60),
  children: z.coerce.number().int().min(0).max(60),
  pupils: z.coerce.number().int().min(0).max(60),
  teachers: z.coerce.number().int().min(0).max(60),
});

export type EditPersonsResult =
  | {
      ok: true;
      deltaCents: number; // < 0 = Erstattung an Gast, > 0 = Nachforderung
      kurtaxeDeltaCents: number; // Kurtaxe-Anpassung (separat, nicht Teil von subtotalCents)
      newSubtotalCents: number;
      refundableCents: number; // ueber Stripe automatisch erstattbar (0 = nicht moeglich)
    }
  | { ok: false; error: string };

export async function editBookingPersons(
  raw: z.infer<typeof editPersonsSchema>
): Promise<EditPersonsResult> {
  let session: Awaited<ReturnType<typeof requireManager>>;
  try {
    session = await requireManager();
  } catch {
    return { ok: false, error: "Nicht autorisiert" };
  }
  const parsed = editPersonsSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const d = parsed.data;

  const b = (await db.select().from(bookings).where(eq(bookings.id, d.bookingId)).limit(1))[0];
  if (!b) return { ok: false, error: "Buchung nicht gefunden." };

  const newPersons: Persons = {
    adults: d.adults,
    members: d.members,
    children: d.children,
    pupils: d.pupils,
    teachers: d.teachers,
  };
  const totalPersons = d.adults + d.members + d.children + d.pupils + d.teachers;
  if (totalPersons < 1) return { ok: false, error: "Mindestens 1 Person erforderlich." };

  // Personenabhaengige Posten frisch berechnen — gleiche Tarife/Saison/Solo.
  // Bei Alt-Vertraegen (legacy*Cents gesetzt) bleiben die urspruenglich
  // vereinbarten Saetze fest, auch wenn sich die Personenzahl aendert.
  const tariffs = await resolveBookingTariffs(b);
  const nb = calculatePrice({
    arrival: b.arrival,
    departure: b.departure,
    persons: newPersons,
    soloUse: b.soloUse,
    tariffs,
  });

  const deltaCents =
    nb.accommodationCents -
    b.accommodationCents +
    (nb.minOccupancySurchargeCents - b.minOccupancySurchargeCents) +
    (nb.soloSurchargeCents - b.soloSurchargeCents);
  // Kurtaxe ist eine eigene Spalte (nicht Teil von subtotalCents), muss aber
  // bei jeder Personenänderung mit angepasst werden — sonst wird sie für
  // nachträglich geänderte kurtaxenpflichtige Personen (ab 16 J.) nie neu
  // berechnet und der Verein zahlt die Differenz an Winterberg aus eigener
  // Tasche (bzw. verschenkt sie bei einer Verringerung).
  const kurtaxeDeltaCents = nb.kurtaxeCents - b.kurtaxeCents;
  const newSubtotalCents = b.subtotalCents + deltaCents;
  if (newSubtotalCents < 0) {
    return { ok: false, error: "Neue Zwischensumme wäre negativ — bitte Eingaben prüfen." };
  }

  await db
    .update(bookings)
    .set({
      adults: d.adults,
      members: d.members,
      children: d.children,
      pupils: d.pupils,
      teachers: d.teachers,
      persons: totalPersons,
      accommodationCents: nb.accommodationCents,
      minOccupancySurchargeCents: nb.minOccupancySurchargeCents,
      soloSurchargeCents: nb.soloSurchargeCents,
      kurtaxeCents: nb.kurtaxeCents,
      subtotalCents: newSubtotalCents,
      totalCents: newSubtotalCents,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, d.bookingId));

  await db.insert(activityLog).values({
    who: session.user?.name ?? session.user?.email ?? "Manager",
    what: `Personen angepasst (Mitgl ${d.members} · Erw ${d.adults} · Kind ${d.children} · Schü ${d.pupils} · Lehr ${d.teachers}) → Zwischensumme ${formatEuro(newSubtotalCents)} (${deltaCents >= 0 ? "+" : ""}${formatEuro(deltaCents)})${kurtaxeDeltaCents !== 0 ? `, Kurtaxe ${kurtaxeDeltaCents >= 0 ? "+" : ""}${formatEuro(kurtaxeDeltaCents)}` : ""}`,
    bookingId: d.bookingId,
  });

  revalidatePath(`/m/buchungen/${d.bookingId}`);
  revalidatePath("/m/dashboard");

  const refundableCents =
    deltaCents < 0 && b.stripePaymentIntentId
      ? Math.min(Math.abs(deltaCents), b.paidCents)
      : 0;

  return { ok: true, deltaCents, kurtaxeDeltaCents, newSubtotalCents, refundableCents };
}

export async function refundBookingDifference(
  bookingId: string,
  amountCents: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  let session: Awaited<ReturnType<typeof requireManager>>;
  try {
    session = await requireManager();
  } catch {
    return { ok: false, error: "Nicht autorisiert" };
  }
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { ok: false, error: "Ungültiger Erstattungsbetrag." };
  }

  const b = (await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1))[0];
  if (!b) return { ok: false, error: "Buchung nicht gefunden." };
  if (!b.stripePaymentIntentId) {
    return { ok: false, error: "Keine Stripe-Zahlung verknüpft — bitte manuell erstatten." };
  }
  if (amountCents > b.paidCents) {
    return { ok: false, error: "Erstattung übersteigt den gezahlten Betrag." };
  }

  try {
    await stripe.refunds.create({
      payment_intent: b.stripePaymentIntentId,
      amount: amountCents,
      metadata: { bookingId: b.id, bookingNumber: b.bookingNumber, kind: "personen-anpassung" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Stripe-Fehler";
    return { ok: false, error: `Stripe-Erstattung fehlgeschlagen: ${msg}` };
  }

  // Verbuchung (payments-Zeile + paidCents-Abzug) macht der bestehende
  // charge.refunded-Webhook -> hier KEINE Doppelbuchung.
  await db.insert(activityLog).values({
    who: session.user?.name ?? session.user?.email ?? "Manager",
    what: `Differenz erstattet (Stripe): ${formatEuro(amountCents)} → Buchung ${b.bookingNumber}`,
    bookingId,
  });

  revalidatePath(`/m/buchungen/${bookingId}`);
  return { ok: true };
}

// =============================================================
// AVS-SelfCheck-in-Link an den Gast senden (Vorstands-Workflow, 02.07.2026).
// Der Link wird im AVS-Portal (meldeschein.avs.de → Link-Generator) individuell
// pro Buchung erzeugt und hier eingefügt — die Plattform verschickt dann die
// Check-in-Mail an den Buchenden. Ersetzt die frühere automatische
// Kurtaxe-Info-Mail aus dem Stripe-Webhook.
// =============================================================

const avsLinkSchema = z.object({
  bookingId: z.string().uuid(),
  link: z.string().trim().min(10).max(2000),
});

export async function sendAvsCheckinLink(
  raw: z.infer<typeof avsLinkSchema>
): Promise<{ ok: true; sentTo: string } | { ok: false; error: string }> {
  let session: Awaited<ReturnType<typeof requireManager>>;
  try {
    session = await requireManager();
  } catch {
    return { ok: false, error: "Nicht autorisiert" };
  }
  const parsed = avsLinkSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe." };
  const { bookingId, link } = parsed.data;

  // Nur echte AVS-Links akzeptieren — schützt vor Tippfehlern/falschem Paste.
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return { ok: false, error: "Das ist keine gültige URL — bitte den Link komplett kopieren." };
  }
  if (url.protocol !== "https:" || !(url.hostname === "avs.de" || url.hostname.endsWith(".avs.de"))) {
    return {
      ok: false,
      error: "Der Link muss ein AVS-Link sein (https://…avs.de/…) — bitte aus dem Link-Generator kopieren.",
    };
  }

  const booking = (await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1))[0];
  if (!booking) return { ok: false, error: "Buchung nicht gefunden." };
  if (!booking.customerId) return { ok: false, error: "Buchung hat keinen Kunden." };
  const customer = (
    await db.select().from(customers).where(eq(customers.id, booking.customerId)).limit(1)
  )[0];
  if (!customer) return { ok: false, error: "Kunde nicht gefunden." };

  const guestName = `${customer.firstName} ${customer.lastName}`.trim() || "Gast";
  try {
    await sendMail({
      to: customer.email,
      subject: "Euer digitaler Check-in für die Wiesenhütte — bitte vor der Anreise ausfüllen",
      template: "avs-selfcheckin",
      bookingId: booking.id,
      react: AvsSelfCheckinEmail({
        guestName,
        bookingNumber: booking.bookingNumber,
        arrival: formatDateLong(booking.arrival),
        departure: formatDateLong(booking.departure),
        checkinUrl: url.toString(),
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { ok: false, error: `Mail-Versand fehlgeschlagen: ${msg}` };
  }

  await db.insert(activityLog).values({
    who: session.user?.name ?? session.user?.email ?? "Manager",
    what: `AVS-SelfCheck-in-Link an ${customer.email} verschickt (digitaler Meldeschein/Kurkarten).`,
    bookingId: booking.id,
  });

  revalidatePath(`/m/buchungen/${bookingId}`);
  return { ok: true, sentTo: customer.email };
}

// =============================================================
// Feuerwehr-Meldeliste: aus der Kurkarten-PDF vorgeschlagene Namen (siehe
// kurkarten-upload-Route) werden hier von Dana geprueft/korrigiert und erst
// dann zu einer eigenen, auf Namen reduzierten PDF (kein Preis/QR) erzeugt.
// =============================================================

export async function generateFeuerwehrListe(
  bookingId: string,
  names: string[]
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  let session: Awaited<ReturnType<typeof requireManager>>;
  try {
    session = await requireManager();
  } catch {
    return { ok: false, error: "Nicht autorisiert" };
  }

  try {
    const url = await generateFeuerwehrListePdf(
      bookingId,
      names,
      session.user?.name ?? session.user?.email ?? "Manager"
    );
    revalidatePath(`/m/buchungen/${bookingId}`);
    return { ok: true, url };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Fehler beim Erzeugen." };
  }
}
