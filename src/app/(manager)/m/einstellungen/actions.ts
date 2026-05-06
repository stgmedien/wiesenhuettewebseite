"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { updateSiteSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

const schema = z.object({
  cleaningDaysAfterDeparture: z.coerce.number().int().min(0).max(7),
});

const requireManager = async () => {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const role = (session.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Forbidden");
  return session;
};

export async function saveSiteSettings(
  raw: { cleaningDaysAfterDeparture: number }
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManager();
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const managerName = session.user?.name ?? session.user?.email ?? "Manager";
  await updateSiteSettings({ cleaningDaysAfterDeparture: parsed.data.cleaningDaysAfterDeparture }, managerName);

  await db.insert(activityLog).values({
    who: managerName,
    what: `Reinigungspuffer auf ${parsed.data.cleaningDaysAfterDeparture} Tag(e) gesetzt`,
  });

  // Pages, die die Settings nutzen, neu rendern
  revalidatePath("/buchen");
  revalidatePath("/m/kalender");
  revalidatePath("/m/einstellungen");
  return { ok: true };
}
