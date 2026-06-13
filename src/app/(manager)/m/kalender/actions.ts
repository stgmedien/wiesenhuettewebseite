"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  isCleaningDayReleased,
  releaseCleaningDay,
  unreleaseCleaningDay,
} from "@/lib/cleaning-overrides";

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
