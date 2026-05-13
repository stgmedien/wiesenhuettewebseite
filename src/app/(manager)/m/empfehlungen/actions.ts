"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { regionalRecommendations, activityLog } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
  return session!.user!.email!;
}

const CATEGORIES = ["restaurant", "einkauf", "aktivitaet", "sehenswuerdigkeit", "notdienst", "verleih"] as const;
const SEASONS = ["", "winter", "sommer"] as const;

const baseSchema = z.object({
  name: z.string().min(2).max(200),
  category: z.enum(CATEGORIES),
  description: z.string().max(2000).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  websiteUrl: z.string().url("Ungültige URL").max(500).optional().nullable().or(z.literal("")),
  phone: z.string().max(60).optional().nullable(),
  openingHours: z.string().max(500).optional().nullable(),
  distanceFromHuetteKm: z.coerce.number().min(0).max(200).optional().nullable(),
  lat: z.coerce.number().min(-90).max(90).optional().nullable(),
  lng: z.coerce.number().min(-180).max(180).optional().nullable(),
  imageUrl: z.string().url("Ungültige Bild-URL").max(500).optional().nullable().or(z.literal("")),
  seasonalOnly: z.enum(SEASONS),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  active: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(true),
});

function pickFormFields(formData: FormData) {
  return {
    name: formData.get("name"),
    category: formData.get("category"),
    description: (formData.get("description") || "").toString().trim() || null,
    address: (formData.get("address") || "").toString().trim() || null,
    websiteUrl: (formData.get("websiteUrl") || "").toString().trim() || null,
    phone: (formData.get("phone") || "").toString().trim() || null,
    openingHours: (formData.get("openingHours") || "").toString().trim() || null,
    distanceFromHuetteKm: formData.get("distanceFromHuetteKm") || null,
    lat: formData.get("lat") || null,
    lng: formData.get("lng") || null,
    imageUrl: (formData.get("imageUrl") || "").toString().trim() || null,
    seasonalOnly: (formData.get("seasonalOnly") || "").toString().trim() as "" | "winter" | "sommer",
    sortOrder: formData.get("sortOrder") || 0,
    active: formData.get("active"),
  };
}

export async function createRecommendation(formData: FormData) {
  const me = await requireManager();
  const parsed = baseSchema.safeParse(pickFormFields(formData));
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  const d = parsed.data;
  await db.insert(regionalRecommendations).values({
    name: d.name,
    category: d.category,
    description: d.description,
    address: d.address,
    websiteUrl: d.websiteUrl || null,
    phone: d.phone,
    openingHours: d.openingHours,
    distanceFromHuetteKm: d.distanceFromHuetteKm ?? null,
    lat: d.lat ?? null,
    lng: d.lng ?? null,
    imageUrl: d.imageUrl || null,
    seasonalOnly: d.seasonalOnly || null,
    sortOrder: d.sortOrder,
    active: d.active,
  });
  await db.insert(activityLog).values({
    who: me,
    what: `Empfehlung angelegt: ${d.name} (${d.category})`,
  });
  revalidatePath("/m/empfehlungen");
  revalidatePath("/empfehlungen");
  return { ok: true as const };
}

const updateSchema = baseSchema.extend({ id: z.string().uuid() });

export async function updateRecommendation(formData: FormData) {
  const me = await requireManager();
  const parsed = updateSchema.safeParse({ ...pickFormFields(formData), id: formData.get("id") });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  const d = parsed.data;
  await db
    .update(regionalRecommendations)
    .set({
      name: d.name,
      category: d.category,
      description: d.description,
      address: d.address,
      websiteUrl: d.websiteUrl || null,
      phone: d.phone,
      openingHours: d.openingHours,
      distanceFromHuetteKm: d.distanceFromHuetteKm ?? null,
      lat: d.lat ?? null,
      lng: d.lng ?? null,
      imageUrl: d.imageUrl || null,
      seasonalOnly: d.seasonalOnly || null,
      sortOrder: d.sortOrder,
      active: d.active,
      updatedAt: new Date(),
    })
    .where(eq(regionalRecommendations.id, d.id));
  await db.insert(activityLog).values({
    who: me,
    what: `Empfehlung bearbeitet: ${d.name}`,
  });
  revalidatePath("/m/empfehlungen");
  revalidatePath("/empfehlungen");
  return { ok: true as const };
}

export async function deleteRecommendation(formData: FormData) {
  const me = await requireManager();
  const id = z.string().uuid().parse(formData.get("id"));
  const rows = await db
    .select()
    .from(regionalRecommendations)
    .where(eq(regionalRecommendations.id, id))
    .limit(1);
  if (!rows[0]) return { ok: false as const };
  await db.delete(regionalRecommendations).where(eq(regionalRecommendations.id, id));
  await db.insert(activityLog).values({
    who: me,
    what: `Empfehlung gelöscht: ${rows[0].name}`,
  });
  revalidatePath("/m/empfehlungen");
  revalidatePath("/empfehlungen");
  return { ok: true as const };
}
