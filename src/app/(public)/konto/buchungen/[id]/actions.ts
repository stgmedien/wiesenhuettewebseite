"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { bookings, customers, activityLog, payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cancellationFee, formatEuro } from "@/lib/pricing";
import { sendMail } from "@/lib/mail/send";
import BookingCancelledEmail from "@/lib/mail/templates/booking-cancelled";

const idSchema = z.string().uuid();

async function loadOwnedBooking(bookingId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht eingeloggt");
  const userId = (session.user as { id?: string }).id;
  if (!userId) throw new Error("Session ohne User-ID");

  const linked = await db
    .select()
    .from(customers)
    .where(eq(customers.userId, userId))
    .limit(1);
  const customer = linked[0];
  if (!customer) throw new Error("Kein Customer-Record");

  const found = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  const booking = found[0];
  if (!booking) throw new Error("Buchung nicht gefunden");
  if (booking.customerId !== customer.id) {
    throw new Error("Diese Buchung gehört nicht zu Deinem Konto");
  }

  return { booking, customer, session };
}

export async function cancelOwnBooking(formData: FormData) {
  const id = idSchema.parse(formData.get("id"));
  const reason = (formData.get("reason") ?? "").toString().trim() || null;

  const { booking, customer } = await loadOwnedBooking(id);

  if (
    booking.status === "storniert" ||
    booking.status === "abgereist" ||
    booking.status === "angereist"
  ) {
    return { ok: false, error: "Diese Buchung kann nicht mehr storniert werden." };
  }

  const fee = cancellationFee(booking.subtotalCents, booking.arrival);

  await db
    .update(bookings)
    .set({
      status: "storniert",
      internalNotes: [
        booking.internalNotes,
        `Storniert vom Kunden am ${new Date().toLocaleString("de-DE")}${
          reason ? ` — Grund: ${reason}` : ""
        }. Storno-Gebühr ${fee.percent}% = ${formatEuro(fee.feeCents)}.`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, booking.id));

  // Offene Zahlungen als 'fehlgeschlagen' markieren (nicht mehr fällig)
  await db
    .update(payments)
    .set({ status: "fehlgeschlagen" })
    .where(eq(payments.bookingId, booking.id));

  await db.insert(activityLog).values({
    who: customer.email,
    what: `Buchung ${booking.bookingNumber} storniert vom Kunden — Storno-Gebühr ${fee.percent}% (${formatEuro(fee.feeCents)})${
      reason ? `, Grund: ${reason}` : ""
    }`,
    bookingId: booking.id,
  });

  // Bestätigungs-Mail an Kunde + Intern an Manager
  try {
    await sendMail({
      to: customer.email,
      subject: `Stornierung bestätigt — Buchung ${booking.bookingNumber}`,
      template: "booking_cancelled",
      bookingId: booking.id,
      react: BookingCancelledEmail({
        firstName: customer.firstName,
        bookingNumber: booking.bookingNumber,
        feePercent: fee.percent,
        feeCents: fee.feeCents,
        subtotalCents: booking.subtotalCents,
      }),
      bcc: process.env.MAIL_INTERNAL_TO ?? undefined,
    });
  } catch (err) {
    console.error("[cancel-mail] failed:", err);
  }

  revalidatePath(`/konto/buchungen/${booking.id}`);
  revalidatePath("/konto");
  return { ok: true };
}
