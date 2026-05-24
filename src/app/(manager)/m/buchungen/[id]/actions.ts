"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { bookings, customers, payments, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { BOOKING_BLOCKS_TAG } from "@/lib/availability";
import { stripe } from "@/lib/stripe";
import { sendMail } from "@/lib/mail/send";
import ManagerMessageEmail from "@/lib/mail/templates/manager-message";
import ReviewApprovedEmail from "@/lib/mail/templates/review-approved";
import ReviewRejectedEmail from "@/lib/mail/templates/review-rejected";
import { formatEuro } from "@/lib/pricing";
import { mailTemplates, mailTemplateVersions } from "@/lib/db/schema";
import { substituteVars } from "@/lib/mail-render";
import { buildBookingVars } from "@/lib/mail-template-vars";

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

export async function setBookingStatus(bookingId: string, status: string) {
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

  // Send the mail
  try {
    await sendMail({
      to: customer.email,
      subject: data.subject,
      template: data.paymentEnabled ? "manager-message-payment" : "manager-message",
      bookingId: booking.id,
      replyTo: session.user?.email ?? undefined,
      react: ManagerMessageEmail({
        guestName: `${customer.firstName} ${customer.lastName}`.trim(),
        bookingNumber: booking.bookingNumber,
        managerName: session.user?.name ?? "Wiesenhütte-Team",
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
// Phase B: Vorstands-Review fuer Private-Feier-Buchungen
// =============================================================

export async function reviewApproveBooking(
  bookingId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireManager();
  const me = session.user?.email ?? session.user?.name ?? "Manager";

  const b = (await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1))[0];
  if (!b) return { ok: false, error: "Buchung nicht gefunden" };
  if (!b.requiresReview || b.reviewStatus !== "pending") {
    return { ok: false, error: "Buchung erwartet keine Pruefung mehr" };
  }
  const c = b.customerId
    ? (await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1))[0]
    : null;
  if (!c) return { ok: false, error: "Kunde fehlt" };

  // Anzahlung (50%) + Kaution erzeugen — analog createBookingAndCheckout.
  const prepaymentCents = Math.round((b.subtotalCents * 50) / 100);
  const remainderCents = b.subtotalCents - prepaymentCents;
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.xn--wiesenhtte-geb.com";

  let checkoutUrl: string | null = null;
  let checkoutSessionId: string | null = null;
  try {
    const sessionStripe = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      locale: "de",
      customer_email: c.email,
      billing_address_collection: "auto",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: prepaymentCents,
            product_data: {
              name: `Anzahlung 50 % — Wiesenhuette ${b.arrival} bis ${b.departure}`,
              description: `Buchung ${b.bookingNumber} · ${b.persons} Personen · ${b.nights} Naechte. Restzahlung ${formatEuro(
                remainderCents
              )} wird vor Anreise eingezogen.`,
            },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: b.depositCents,
            product_data: {
              name: "Kaution",
              description: "Wird innerhalb 14 Tage nach mangelfreier Abreise zurueckerstattet.",
            },
          },
        },
      ],
      metadata: {
        bookingId: b.id,
        bookingNumber: b.bookingNumber,
        flow: "review-approved",
      },
      success_url: `${baseUrl}/buchen/erfolg?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/buchen?canceled=1`,
    });
    checkoutUrl = sessionStripe.url ?? null;
    checkoutSessionId = sessionStripe.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Stripe-Fehler";
    console.error("[reviewApprove] stripe session create failed:", err);
    return { ok: false, error: `Stripe-Session konnte nicht angelegt werden: ${msg}` };
  }
  if (!checkoutUrl) return { ok: false, error: "Stripe-Session-URL fehlt" };

  // DB-Updates: review_status, stripe_session_id, payments-Rows.
  await db
    .update(bookings)
    .set({
      reviewStatus: "approved",
      reviewDecidedAt: new Date(),
      reviewDecidedBy: me,
      stripeSessionId: checkoutSessionId,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId));

  // payment-Zeilen anlegen, wenn noch nicht vorhanden (idempotent: bei
  // erneutem Klick keine Duplikate).
  const existingPayments = await db.select().from(payments).where(eq(payments.bookingId, bookingId));
  if (existingPayments.length === 0) {
    await db.insert(payments).values([
      { bookingId, kind: "anzahlung", status: "offen", amountCents: prepaymentCents, method: "Stripe Checkout" },
      { bookingId, kind: "kaution", status: "offen", amountCents: b.depositCents, method: "Stripe Checkout" },
      { bookingId, kind: "restzahlung", status: "offen", amountCents: remainderCents, method: "Stripe Off-Session (auto T-7)" },
    ]);
  }

  // Approval-Mail mit Zahlungslink an den Gast.
  try {
    await sendMail({
      to: c.email,
      subject: `Eure Buchungsanfrage wurde freigegeben — Buchung ${b.bookingNumber}`,
      template: "review-approved",
      bookingId,
      react: ReviewApprovedEmail({
        firstName: c.firstName,
        bookingNumber: b.bookingNumber,
        arrival: b.arrival,
        departure: b.departure,
        prepaymentEuroLabel: formatEuro(prepaymentCents),
        checkoutUrl,
      }),
    });
  } catch (err) {
    console.error("[review-approved] mail failed (non-blocking):", err);
  }

  await db.insert(activityLog).values({
    who: me,
    what: `Private-Feier-Buchung ${b.bookingNumber} FREIGEGEBEN — Zahlungslink an ${c.email} verschickt.`,
    bookingId,
  });

  revalidatePath(`/m/buchungen/${bookingId}`);
  revalidatePath("/m/buchungen");
  revalidateTag(BOOKING_BLOCKS_TAG, "max");
  return { ok: true };
}

export async function reviewRejectBooking(
  bookingId: string,
  rejectionReason?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireManager();
  const me = session.user?.email ?? session.user?.name ?? "Manager";

  const b = (await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1))[0];
  if (!b) return { ok: false, error: "Buchung nicht gefunden" };
  if (!b.requiresReview || b.reviewStatus !== "pending") {
    return { ok: false, error: "Buchung erwartet keine Pruefung mehr" };
  }
  const c = b.customerId
    ? (await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1))[0]
    : null;

  await db
    .update(bookings)
    .set({
      reviewStatus: "rejected",
      reviewDecidedAt: new Date(),
      reviewDecidedBy: me,
      // Tage wieder freigeben, indem Status auf 'storniert' geht.
      status: "storniert",
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId));

  if (c) {
    try {
      await sendMail({
        to: c.email,
        subject: `Eure Anfrage — Buchung ${b.bookingNumber}`,
        template: "review-rejected",
        bookingId,
        react: ReviewRejectedEmail({
          firstName: c.firstName,
          bookingNumber: b.bookingNumber,
          arrival: b.arrival,
          departure: b.departure,
          rejectionReason: rejectionReason ?? null,
        }),
      });
    } catch (err) {
      console.error("[review-rejected] mail failed (non-blocking):", err);
    }
  }

  await db.insert(activityLog).values({
    who: me,
    what: `Private-Feier-Buchung ${b.bookingNumber} ABGELEHNT${rejectionReason ? ` — Grund: ${rejectionReason}` : ""}.`,
    bookingId,
  });

  revalidatePath(`/m/buchungen/${bookingId}`);
  revalidatePath("/m/buchungen");
  revalidateTag(BOOKING_BLOCKS_TAG, "max");
  return { ok: true };
}
