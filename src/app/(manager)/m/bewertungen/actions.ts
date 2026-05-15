"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { externalReviews, activityLog } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { TRUST_REVIEWS_TAG } from "@/lib/trust-reviews";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
  return session!.user!.email!;
}

const idSchema = z.object({ id: z.string().uuid() });

export async function togglePublishedAction(formData: FormData) {
  const me = await requireManager();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const row = (await db.select().from(externalReviews).where(eq(externalReviews.id, id)).limit(1))[0];
  if (!row) throw new Error("Bewertung nicht gefunden");
  await db
    .update(externalReviews)
    .set({ published: !row.published, updatedAt: new Date() })
    .where(eq(externalReviews.id, id));
  await db.insert(activityLog).values({
    who: me,
    what: `External-Review "${row.authorName}" (${row.source}) ${!row.published ? "veröffentlicht" : "depubliziert"}`,
  });
  revalidatePath("/m/bewertungen");
  revalidatePath("/");
  revalidateTag(TRUST_REVIEWS_TAG, "max");
}

export async function toggleHighlightAction(formData: FormData) {
  const me = await requireManager();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const row = (await db.select().from(externalReviews).where(eq(externalReviews.id, id)).limit(1))[0];
  if (!row) throw new Error("Bewertung nicht gefunden");
  await db
    .update(externalReviews)
    .set({ highlight: !row.highlight, updatedAt: new Date() })
    .where(eq(externalReviews.id, id));
  await db.insert(activityLog).values({
    who: me,
    what: `External-Review "${row.authorName}" (${row.source}) Highlight ${!row.highlight ? "an" : "aus"}`,
  });
  revalidatePath("/m/bewertungen");
  revalidatePath("/");
  revalidateTag(TRUST_REVIEWS_TAG, "max");
}

export async function deleteReviewAction(formData: FormData) {
  const me = await requireManager();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const row = (await db.select().from(externalReviews).where(eq(externalReviews.id, id)).limit(1))[0];
  if (!row) return;
  await db.delete(externalReviews).where(eq(externalReviews.id, id));
  await db.insert(activityLog).values({
    who: me,
    what: `External-Review "${row.authorName}" (${row.source}) gelöscht`,
  });
  revalidatePath("/m/bewertungen");
  revalidatePath("/");
  revalidateTag(TRUST_REVIEWS_TAG, "max");
}

const addSchema = z.object({
  source: z.enum(["google", "gruppenhaus", "gruppenunterkuenfte", "manual"]),
  authorName: z.string().min(1).max(200),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  text: z.string().max(4000).optional().nullable(),
  relativeTime: z.string().max(60).optional().nullable(),
  reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  sourceUrl: z.string().url().max(500).optional().nullable(),
  highlight: z.coerce.boolean().default(false),
});

export async function addReviewAction(formData: FormData) {
  const me = await requireManager();
  const raw = {
    source: formData.get("source"),
    authorName: formData.get("authorName"),
    rating: formData.get("rating") || null,
    text: formData.get("text") || null,
    relativeTime: formData.get("relativeTime") || null,
    reviewedAt: formData.get("reviewedAt") || null,
    sourceUrl: formData.get("sourceUrl") || null,
    highlight: formData.get("highlight") === "on",
  };
  const data = addSchema.parse(raw);

  const sourceRef = `${data.source}:manual-${data.authorName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
  await db.insert(externalReviews).values({
    source: data.source,
    authorName: data.authorName.trim(),
    rating: data.rating ?? null,
    text: data.text?.trim() || null,
    relativeTime: data.relativeTime?.trim() || null,
    reviewedAt: data.reviewedAt || null,
    sourceRef,
    sourceUrl: data.sourceUrl || null,
    originalLanguage: "de",
    translated: false,
    published: true,
    highlight: data.highlight,
  });
  await db.insert(activityLog).values({
    who: me,
    what: `External-Review von "${data.authorName}" (${data.source}) manuell hinzugefügt`,
  });
  revalidatePath("/m/bewertungen");
  revalidatePath("/");
  revalidateTag(TRUST_REVIEWS_TAG, "max");
}
