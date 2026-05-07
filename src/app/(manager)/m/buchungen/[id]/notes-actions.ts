"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { notes, customers, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
  return session!.user!.email!;
}

const addSchema = z.object({
  scope: z.enum(["booking", "customer", "inquiry"]),
  refId: z.string().uuid(),
  body: z.string().min(1).max(4000),
  internal: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(true),
  pinned: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
});

export async function addNote(formData: FormData) {
  const me = await requireManager();
  const parsed = addSchema.safeParse({
    scope: formData.get("scope"),
    refId: formData.get("refId"),
    body: formData.get("body"),
    internal: formData.get("internal"),
    pinned: formData.get("pinned"),
  });
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe." };

  await db.insert(notes).values({
    scope: parsed.data.scope,
    refId: parsed.data.refId,
    body: parsed.data.body,
    internal: parsed.data.internal,
    pinned: parsed.data.pinned,
    by: me,
  });

  await db.insert(activityLog).values({
    who: me,
    what: `Notiz angelegt (${parsed.data.scope}=${parsed.data.refId})`,
    bookingId: parsed.data.scope === "booking" ? parsed.data.refId : null,
  });

  revalidatePath(`/m/buchungen/${parsed.data.refId}`);
  return { ok: true as const };
}

export async function deleteNote(formData: FormData) {
  const me = await requireManager();
  const id = z.string().uuid().parse(formData.get("id"));
  const refId = z.string().uuid().parse(formData.get("refId"));
  await db.delete(notes).where(eq(notes.id, id));
  await db.insert(activityLog).values({
    who: me,
    what: `Notiz gelöscht (${id})`,
    bookingId: refId,
  });
  revalidatePath(`/m/buchungen/${refId}`);
  return { ok: true as const };
}

const tagsSchema = z.object({
  customerId: z.string().uuid(),
  tags: z.string().max(500), // comma-separated
});

export async function updateCustomerTags(formData: FormData) {
  const me = await requireManager();
  const parsed = tagsSchema.safeParse({
    customerId: formData.get("customerId"),
    tags: formData.get("tags"),
  });
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe." };
  const tagList = parsed.data.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
  await db
    .update(customers)
    .set({ tags: tagList })
    .where(eq(customers.id, parsed.data.customerId));
  await db.insert(activityLog).values({
    who: me,
    what: `Customer-Tags aktualisiert (${parsed.data.customerId}): [${tagList.join(", ")}]`,
  });
  revalidatePath(`/m/buchungen`);
  return { ok: true as const };
}
