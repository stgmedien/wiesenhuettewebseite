"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { bookings, customers, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendMail } from "@/lib/mail/send";
import DepositHoldEmail from "@/lib/mail/templates/deposit-hold";
import { formatDateLong } from "@/lib/utils";

const requireManager = async () => {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const role = (session.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Forbidden");
  return session;
};

const holdSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().min(5).max(2000),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Stoppt den automatischen Rueckanweisung der Kaution. Setzt deposit_hold=true,
 * speichert Grund + Manager + Zeitpunkt, schickt eine Mail an den Bucher.
 */
export async function holdDepositRefund(raw: z.infer<typeof holdSchema>): Promise<ActionResult> {
  const session = await requireManager();
  const parsed = holdSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const { bookingId, reason } = parsed.data;
  const managerName = session.user?.name ?? session.user?.email ?? "Manager";

  const found = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  const booking = found[0];
  if (!booking) return { ok: false, error: "Buchung nicht gefunden" };

  await db
    .update(bookings)
    .set({
      depositHold: true,
      depositHoldReason: reason.trim(),
      depositHoldAt: new Date(),
      depositHoldBy: managerName,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId));

  await db.insert(activityLog).values({
    who: managerName,
    what: `Kaution-Refund STOP — Grund: ${reason.trim().slice(0, 200)}`,
    bookingId,
  });

  // Bucher informieren
  const customer = booking.customerId
    ? (
        await db.select().from(customers).where(eq(customers.id, booking.customerId)).limit(1)
      )[0]
    : null;
  if (customer) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.vercel.app";
    try {
      await sendMail({
        to: customer.email,
        subject: `Kaution einbehalten — Buchung ${booking.bookingNumber}`,
        template: "deposit-hold",
        bookingId,
        replyTo: session.user?.email ?? undefined,
        react: DepositHoldEmail({
          guestName: `${customer.firstName} ${customer.lastName}`.trim(),
          bookingNumber: booking.bookingNumber,
          arrival: formatDateLong(booking.arrival),
          departure: formatDateLong(booking.departure),
          depositCents: booking.depositCents,
          reason: reason.trim(),
          baseUrl,
        }),
      });
    } catch (err) {
      console.error("[deposit-hold] mail failed", err);
      // Hold bleibt gesetzt — Manager wird im Activity-Log darauf hingewiesen, dass Mail fehlte
      await db.insert(activityLog).values({
        who: "System",
        what: `Kaution-Hold-Mail an ${customer.email} FEHLGESCHLAGEN — bitte Bucher anders informieren`,
        bookingId,
      });
    }
  }

  revalidatePath(`/m/buchungen/${bookingId}`);
  revalidatePath("/m/buchungen");
  return { ok: true };
}

/**
 * Hebt den Hold auf — Auto-Refund läuft beim nächsten Cron-Lauf wieder.
 */
export async function releaseDepositHold(bookingId: string): Promise<ActionResult> {
  const session = await requireManager();
  const managerName = session.user?.name ?? session.user?.email ?? "Manager";

  const found = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  const booking = found[0];
  if (!booking) return { ok: false, error: "Buchung nicht gefunden" };

  await db
    .update(bookings)
    .set({
      depositHold: false,
      depositHoldReason: null,
      depositHoldAt: null,
      depositHoldBy: null,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId));

  await db.insert(activityLog).values({
    who: managerName,
    what: `Kaution-Refund-Hold aufgehoben — Auto-Refund laeuft wieder`,
    bookingId,
  });

  revalidatePath(`/m/buchungen/${bookingId}`);
  revalidatePath("/m/buchungen");
  return { ok: true };
}
