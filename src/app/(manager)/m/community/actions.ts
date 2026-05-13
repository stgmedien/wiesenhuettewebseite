"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { communityEntries, activityLog } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
  return session!.user!.email!;
}

const idSchema = z.object({ id: z.string().uuid() });
const moderateSchema = z.object({
  id: z.string().uuid(),
  note: z.string().max(2000).optional().nullable(),
});

export async function approveCommunityEntry(formData: FormData) {
  const me = await requireManager();
  const parsed = moderateSchema.safeParse({
    id: formData.get("id"),
    note: (formData.get("note") || "").toString().trim() || null,
  });
  if (!parsed.success) return { ok: false as const, error: "Ungültige Eingabe." };

  const rows = await db
    .select()
    .from(communityEntries)
    .where(eq(communityEntries.id, parsed.data.id))
    .limit(1);
  const entry = rows[0];
  if (!entry) return { ok: false as const, error: "Eintrag nicht gefunden." };

  await db
    .update(communityEntries)
    .set({
      status: "approved",
      moderatedBy: me,
      moderatedAt: new Date(),
      moderationNote: parsed.data.note,
    })
    .where(eq(communityEntries.id, parsed.data.id));

  await db.insert(activityLog).values({
    who: me,
    what: `Community-Eintrag freigegeben (${entry.kind}, ${entry.authorName})`,
  });

  revalidatePath("/m/community");
  revalidatePath("/gaestebuch");
  revalidatePath("/schulprojekt");
  return { ok: true as const };
}

export async function rejectCommunityEntry(formData: FormData) {
  const me = await requireManager();
  const parsed = moderateSchema.safeParse({
    id: formData.get("id"),
    note: (formData.get("note") || "").toString().trim() || null,
  });
  if (!parsed.success) return { ok: false as const, error: "Ungültige Eingabe." };

  const rows = await db
    .select()
    .from(communityEntries)
    .where(eq(communityEntries.id, parsed.data.id))
    .limit(1);
  const entry = rows[0];
  if (!entry) return { ok: false as const, error: "Eintrag nicht gefunden." };

  await db
    .update(communityEntries)
    .set({
      status: "rejected",
      moderatedBy: me,
      moderatedAt: new Date(),
      moderationNote: parsed.data.note,
    })
    .where(eq(communityEntries.id, parsed.data.id));

  await db.insert(activityLog).values({
    who: me,
    what: `Community-Eintrag abgelehnt (${entry.kind}, ${entry.authorName})${parsed.data.note ? ` — Grund: ${parsed.data.note}` : ""}`,
  });

  revalidatePath("/m/community");
  revalidatePath("/gaestebuch");
  revalidatePath("/schulprojekt");
  return { ok: true as const };
}

export async function deleteCommunityEntry(formData: FormData) {
  const me = await requireManager();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false as const, error: "Ungültige Eingabe." };

  const rows = await db
    .select()
    .from(communityEntries)
    .where(eq(communityEntries.id, parsed.data.id))
    .limit(1);
  const entry = rows[0];
  if (!entry) return { ok: false as const, error: "Eintrag nicht gefunden." };

  await db.delete(communityEntries).where(eq(communityEntries.id, parsed.data.id));

  await db.insert(activityLog).values({
    who: me,
    what: `Community-Eintrag gelöscht (${entry.kind}, ${entry.authorName})`,
  });

  revalidatePath("/m/community");
  revalidatePath("/gaestebuch");
  revalidatePath("/schulprojekt");
  return { ok: true as const };
}
