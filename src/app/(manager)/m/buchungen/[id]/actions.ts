"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { bookings, customers, payments, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { stripe } from "@/lib/stripe";
import { sendMail } from "@/lib/mail/send";
import ManagerMessageEmail from "@/lib/mail/templates/manager-message";
import { formatEuro } from "@/lib/pricing";

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
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
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

  revalidatePath(`/m/buchungen/${bookingId}`);
  revalidatePath("/m/buchungen");
  revalidatePath("/m/dashboard");
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
  const session = await auth();
  if (!session) return { ok: false, error: "Unauthorized" };

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
