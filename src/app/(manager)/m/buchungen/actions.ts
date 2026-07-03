"use server";

import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteUnpaidRequests() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Unauthorized");

  const deleted = await db
    .delete(bookings)
    .where(and(eq(bookings.status, "storniert"), eq(bookings.paidCents, 0)))
    .returning({ id: bookings.id });

  revalidatePath("/m/buchungen");
  return { deleted: deleted.length };
}
