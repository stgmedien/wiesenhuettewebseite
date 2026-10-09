"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { completeDepositRelease, verifyDepositReleaseToken } from "@/lib/deposit-release";

/**
 * Bestätigung der Kautions-Überweisung über den Link aus der Auftragsmail —
 * ohne Login, abgesichert über das an die Zahlungszeile gebundene Token.
 * Bewusst als POST (Formular), damit Mail-Scanner, die Links vorab öffnen,
 * nichts auslösen.
 */
export async function confirmDepositTransfer(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const token = String(formData.get("t") ?? "");
  if (!id || !token || !verifyDepositReleaseToken(id, token)) return;

  const r = await completeDepositRelease(id, "Vereinsfinanzen (Link aus Auftragsmail)");
  if (r.ok) {
    const p = (
      await db.select({ bookingId: payments.bookingId }).from(payments).where(eq(payments.id, id)).limit(1)
    )[0];
    if (p) revalidatePath(`/m/buchungen/${p.bookingId}`);
    revalidatePath("/m/dashboard");
  }
  revalidatePath("/kaution-freigabe");
}
