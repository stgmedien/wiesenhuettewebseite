"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  isChangeoverReleased,
  isCleaningDayReleased,
  releaseChangeoverDay,
  releaseCleaningDay,
  unreleaseChangeoverDay,
  unreleaseCleaningDay,
} from "@/lib/cleaning-overrides";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
  return session!;
}

/**
 * Toggle: Reinigungstag freigeben ↔ wieder sperren. Manager-only.
 * Gibt den neuen Zustand zurück (`released`).
 */
export async function toggleCleaningReleaseAction(
  dateIso: string
): Promise<{ ok: boolean; released?: boolean; error?: string }> {
  try {
    const session = await requireManager();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
      return { ok: false, error: "Ungültiges Datum." };
    }
    const by =
      (session.user as { email?: string } | undefined)?.email ?? "manager";

    const currentlyReleased = await isCleaningDayReleased(dateIso);
    if (currentlyReleased) {
      await unreleaseCleaningDay(dateIso);
    } else {
      await releaseCleaningDay(dateIso, by);
    }
    revalidatePath("/m/kalender");
    return { ok: true, released: !currentlyReleased };
  } catch (err) {
    console.error("[kalender] toggleCleaningRelease failed:", err);
    return { ok: false, error: "Konnte den Tag nicht ändern." };
  }
}

/**
 * Toggle: Abreisetag als Wechseltag freigeben ↔ wieder sperren. Danach kann
 * die Gruppe unter „Manuell buchen“ am Abreisetag anreisen; Gäste sehen den
 * Tag weiter als belegt. Zurücknehmen geht nur, solange an dem Tag noch
 * niemand neu anreist.
 */
export async function toggleChangeoverAction(
  dateIso: string
): Promise<{ ok: boolean; released?: boolean; error?: string }> {
  try {
    const session = await requireManager();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
      return { ok: false, error: "Ungültiges Datum." };
    }
    const by = (session.user as { email?: string } | undefined)?.email ?? "manager";

    if (await isChangeoverReleased(dateIso)) {
      const arriving = await db
        .select({ id: bookings.id })
        .from(bookings)
        .where(and(eq(bookings.arrival, dateIso), ne(bookings.status, "storniert")))
        .limit(1);
      if (arriving.length > 0) {
        return { ok: false, error: "An diesem Tag reist schon eine neue Buchung an." };
      }
      await unreleaseChangeoverDay(dateIso);
      revalidatePath("/m/kalender");
      return { ok: true, released: false };
    }

    await releaseChangeoverDay(dateIso, by);
    revalidatePath("/m/kalender");
    return { ok: true, released: true };
  } catch (err) {
    console.error("[kalender] toggleChangeover failed:", err);
    return { ok: false, error: "Konnte den Tag nicht ändern." };
  }
}
