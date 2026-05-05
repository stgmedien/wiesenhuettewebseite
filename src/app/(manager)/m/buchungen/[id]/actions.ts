"use server";

import { db } from "@/lib/db";
import { bookings, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const ALLOWED = new Set([
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
  if (!ALLOWED.has(status)) throw new Error("Invalid status");

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
