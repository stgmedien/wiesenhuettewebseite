"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { hikingRoutes, activityLog } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { quickValidateGpx, slugifyHikingRoute } from "@/lib/hiking";
import crypto from "crypto";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
  return session!.user!.email!;
}

const baseSchema = z.object({
  name: z.string().min(2).max(200),
  summary: z.string().max(500).optional().nullable(),
  description: z.string().max(8000).optional().nullable(),
  difficulty: z.enum(["leicht", "mittel", "schwer"]),
  distanceKm: z.coerce.number().min(0).max(500).optional().nullable(),
  elevationGainM: z.coerce.number().int().min(0).max(10000).optional().nullable(),
  durationMinutes: z.coerce.number().int().min(0).max(60 * 24).optional().nullable(),
  startLat: z.coerce.number().min(-90).max(90).optional().nullable(),
  startLng: z.coerce.number().min(-180).max(180).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  active: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(true),
});

const MAX_GPX_BYTES = 2 * 1024 * 1024;
const MAX_IMG_BYTES = 5 * 1024 * 1024;

async function uploadFile(
  file: File,
  prefix: string,
  allowedMime: string[],
  maxBytes: number,
  validateContent?: (text: string) => { ok: true } | { ok: false; reason: string }
): Promise<{ url: string } | { error: string }> {
  if (!allowedMime.some((m) => file.type === m || (m.endsWith("/*") && file.type.startsWith(m.split("/")[0])))) {
    // Fallback: für GPX akzeptieren wir auch text/xml und application/octet-stream wenn Dateiname .gpx
    if (!(prefix === "gpx" && (file.name.toLowerCase().endsWith(".gpx") || file.type === "")) ) {
      return { error: `Dateiformat ${file.type || "unbekannt"} nicht unterstützt.` };
    }
  }
  if (file.size > maxBytes) {
    return { error: `Datei zu groß (max ${maxBytes / 1024 / 1024} MB).` };
  }
  if (validateContent) {
    const text = await file.text();
    const v = validateContent(text);
    if (!v.ok) return { error: v.reason };
    // re-create buffer below from text to avoid double-read; falls through
    const rand = crypto.randomBytes(6).toString("hex");
    const ext = prefix === "gpx" ? "gpx" : file.name.split(".").pop() || "bin";
    const safe = `wandertouren/${prefix}/${Date.now()}-${rand}.${ext}`;
    const blob = await put(safe, text, {
      access: "public",
      addRandomSuffix: false,
      contentType: prefix === "gpx" ? "application/gpx+xml" : file.type,
    });
    return { url: blob.url };
  }
  const rand = crypto.randomBytes(6).toString("hex");
  const ext = file.name.split(".").pop() || "bin";
  const safe = `wandertouren/${prefix}/${Date.now()}-${rand}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const blob = await put(safe, buf, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type,
  });
  return { url: blob.url };
}

export async function createHikingRoute(formData: FormData) {
  const me = await requireManager();

  const parsed = baseSchema.safeParse({
    name: formData.get("name"),
    summary: (formData.get("summary") || "").toString().trim() || null,
    description: (formData.get("description") || "").toString().trim() || null,
    difficulty: formData.get("difficulty"),
    distanceKm: formData.get("distanceKm") || null,
    elevationGainM: formData.get("elevationGainM") || null,
    durationMinutes: formData.get("durationMinutes") || null,
    startLat: formData.get("startLat") || null,
    startLng: formData.get("startLng") || null,
    sortOrder: formData.get("sortOrder") || 0,
    active: formData.get("active"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  const data = parsed.data;

  // GPX optional
  let gpxUrl: string | null = null;
  const gpxFile = formData.get("gpx");
  if (gpxFile instanceof File && gpxFile.size > 0) {
    const r = await uploadFile(gpxFile, "gpx", ["application/gpx+xml", "text/xml", "application/xml"], MAX_GPX_BYTES, quickValidateGpx);
    if ("error" in r) return { ok: false as const, error: `GPX: ${r.error}` };
    gpxUrl = r.url;
  }

  // Cover-Image optional
  let coverImageUrl: string | null = null;
  const imgFile = formData.get("coverImage");
  if (imgFile instanceof File && imgFile.size > 0) {
    const r = await uploadFile(imgFile, "cover", ["image/jpeg", "image/png", "image/webp"], MAX_IMG_BYTES);
    if ("error" in r) return { ok: false as const, error: `Cover: ${r.error}` };
    coverImageUrl = r.url;
  }

  // Slug aus Name, mit Eindeutigkeits-Check
  let slug = slugifyHikingRoute(data.name);
  if (!slug) slug = `route-${Date.now()}`;
  const existing = await db.select().from(hikingRoutes).where(eq(hikingRoutes.slug, slug)).limit(1);
  if (existing[0]) {
    slug = `${slug}-${crypto.randomBytes(2).toString("hex")}`;
  }

  await db.insert(hikingRoutes).values({
    slug,
    name: data.name,
    summary: data.summary,
    description: data.description,
    difficulty: data.difficulty,
    distanceKm: data.distanceKm ?? null,
    elevationGainM: data.elevationGainM ?? null,
    durationMinutes: data.durationMinutes ?? null,
    startLat: data.startLat ?? null,
    startLng: data.startLng ?? null,
    gpxUrl,
    coverImageUrl,
    sortOrder: data.sortOrder,
    active: data.active,
  });

  await db.insert(activityLog).values({
    who: me,
    what: `Wandertour angelegt: ${data.name} (${data.difficulty})`,
  });

  revalidatePath("/m/wandertouren");
  revalidatePath("/wandertouren");
  return { ok: true as const, slug };
}

const updateSchema = baseSchema.extend({
  id: z.string().uuid(),
});

export async function updateHikingRoute(formData: FormData) {
  const me = await requireManager();
  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    summary: (formData.get("summary") || "").toString().trim() || null,
    description: (formData.get("description") || "").toString().trim() || null,
    difficulty: formData.get("difficulty"),
    distanceKm: formData.get("distanceKm") || null,
    elevationGainM: formData.get("elevationGainM") || null,
    durationMinutes: formData.get("durationMinutes") || null,
    startLat: formData.get("startLat") || null,
    startLng: formData.get("startLng") || null,
    sortOrder: formData.get("sortOrder") || 0,
    active: formData.get("active"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  const data = parsed.data;

  const updateData: Record<string, unknown> = {
    name: data.name,
    summary: data.summary,
    description: data.description,
    difficulty: data.difficulty,
    distanceKm: data.distanceKm ?? null,
    elevationGainM: data.elevationGainM ?? null,
    durationMinutes: data.durationMinutes ?? null,
    startLat: data.startLat ?? null,
    startLng: data.startLng ?? null,
    sortOrder: data.sortOrder,
    active: data.active,
    updatedAt: new Date(),
  };

  // Optional: neue GPX/Cover hochladen
  const gpxFile = formData.get("gpx");
  if (gpxFile instanceof File && gpxFile.size > 0) {
    const r = await uploadFile(gpxFile, "gpx", ["application/gpx+xml", "text/xml", "application/xml"], MAX_GPX_BYTES, quickValidateGpx);
    if ("error" in r) return { ok: false as const, error: `GPX: ${r.error}` };
    updateData.gpxUrl = r.url;
  }
  const imgFile = formData.get("coverImage");
  if (imgFile instanceof File && imgFile.size > 0) {
    const r = await uploadFile(imgFile, "cover", ["image/jpeg", "image/png", "image/webp"], MAX_IMG_BYTES);
    if ("error" in r) return { ok: false as const, error: `Cover: ${r.error}` };
    updateData.coverImageUrl = r.url;
  }

  await db.update(hikingRoutes).set(updateData).where(eq(hikingRoutes.id, data.id));

  await db.insert(activityLog).values({
    who: me,
    what: `Wandertour bearbeitet: ${data.name}`,
  });

  revalidatePath("/m/wandertouren");
  revalidatePath("/wandertouren");
  revalidatePath(`/wandertouren`);
  return { ok: true as const };
}

export async function deleteHikingRoute(formData: FormData) {
  const me = await requireManager();
  const id = z.string().uuid().parse(formData.get("id"));
  const rows = await db.select().from(hikingRoutes).where(eq(hikingRoutes.id, id)).limit(1);
  if (!rows[0]) return { ok: false as const, error: "Nicht gefunden." };
  await db.delete(hikingRoutes).where(eq(hikingRoutes.id, id));
  await db.insert(activityLog).values({
    who: me,
    what: `Wandertour gelöscht: ${rows[0].name}`,
  });
  revalidatePath("/m/wandertouren");
  revalidatePath("/wandertouren");
  return { ok: true as const };
}
