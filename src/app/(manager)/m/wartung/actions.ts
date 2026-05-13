"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { maintenanceTickets, activityLog } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
  return session!.user!.email!;
}

const ALLOWED_PHOTO_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_PHOTOS = 6;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

async function uploadTicketPhotos(formData: FormData): Promise<string[]> {
  const files = formData
    .getAll("photos")
    .filter((v): v is File => v instanceof File && v.size > 0);
  if (files.length === 0) return [];
  if (files.length > MAX_PHOTOS) throw new Error(`Maximal ${MAX_PHOTOS} Photos pro Ticket.`);
  for (const f of files) {
    if (!ALLOWED_PHOTO_MIME.has(f.type)) throw new Error(`Dateiformat ${f.type} nicht unterstützt.`);
    if (f.size > MAX_PHOTO_BYTES) throw new Error(`Photo zu groß (max 5 MB).`);
  }
  const urls: string[] = [];
  for (const f of files) {
    const rand = crypto.randomBytes(6).toString("hex");
    const ext = f.name.split(".").pop()?.toLowerCase() || "jpg";
    const blob = await put(`maintenance/${Date.now()}-${rand}.${ext}`, Buffer.from(await f.arrayBuffer()), {
      access: "public",
      addRandomSuffix: false,
      contentType: f.type,
    });
    urls.push(blob.url);
  }
  return urls;
}

const SEVERITIES = ["low", "medium", "high", "urgent"] as const;
const STATUSES = ["open", "in_progress", "resolved"] as const;

const createSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  severity: z.enum(SEVERITIES).default("medium"),
  bookingId: z.string().uuid().optional().nullable(),
});

export async function createTicket(formData: FormData) {
  const me = await requireManager();
  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    description: (formData.get("description") || "").toString().trim() || null,
    location: (formData.get("location") || "").toString().trim() || null,
    severity: formData.get("severity") || "medium",
    bookingId: (formData.get("bookingId") || "").toString().trim() || null,
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  const data = parsed.data;

  let photoUrls: string[] = [];
  try {
    photoUrls = await uploadTicketPhotos(formData);
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Upload-Fehler" };
  }

  const inserted = await db
    .insert(maintenanceTickets)
    .values({
      title: data.title,
      description: data.description,
      location: data.location,
      severity: data.severity,
      status: "open",
      photoUrls,
      createdBy: me,
      bookingId: data.bookingId,
    })
    .returning({ id: maintenanceTickets.id });

  await db.insert(activityLog).values({
    who: me,
    what: `Wartungs-Ticket angelegt: "${data.title}" (${data.severity})`,
    bookingId: data.bookingId,
  });

  revalidatePath("/m/wartung");
  return { ok: true as const, id: inserted[0].id };
}

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  severity: z.enum(SEVERITIES),
  status: z.enum(STATUSES),
  assignedTo: z.string().max(255).optional().nullable(),
  resolutionNote: z.string().max(5000).optional().nullable(),
});

export async function updateTicket(formData: FormData) {
  const me = await requireManager();
  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: (formData.get("description") || "").toString().trim() || null,
    location: (formData.get("location") || "").toString().trim() || null,
    severity: formData.get("severity"),
    status: formData.get("status"),
    assignedTo: (formData.get("assignedTo") || "").toString().trim() || null,
    resolutionNote: (formData.get("resolutionNote") || "").toString().trim() || null,
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  const data = parsed.data;

  const existing = (
    await db.select().from(maintenanceTickets).where(eq(maintenanceTickets.id, data.id)).limit(1)
  )[0];
  if (!existing) return { ok: false as const, error: "Ticket nicht gefunden." };

  const willResolve = data.status === "resolved" && existing.status !== "resolved";
  if (willResolve && (!data.resolutionNote || data.resolutionNote.length < 3)) {
    return { ok: false as const, error: "Beim Schliessen bitte kurz beschreiben, wie es gelöst wurde." };
  }

  // Optional: neue Photos zusätzlich hochladen (existing + new mergen)
  let photoUrls = existing.photoUrls;
  const newFiles = formData.getAll("photos").filter((v): v is File => v instanceof File && v.size > 0);
  if (newFiles.length > 0) {
    try {
      const newUrls = await uploadTicketPhotos(formData);
      photoUrls = [...photoUrls, ...newUrls];
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "Upload-Fehler" };
    }
  }

  await db
    .update(maintenanceTickets)
    .set({
      title: data.title,
      description: data.description,
      location: data.location,
      severity: data.severity,
      status: data.status,
      assignedTo: data.assignedTo,
      resolutionNote: data.resolutionNote,
      photoUrls,
      resolvedAt: willResolve ? new Date() : existing.resolvedAt,
      updatedAt: new Date(),
    })
    .where(eq(maintenanceTickets.id, data.id));

  await db.insert(activityLog).values({
    who: me,
    what: willResolve
      ? `Wartungs-Ticket erledigt: "${data.title}"`
      : `Wartungs-Ticket aktualisiert: "${data.title}" (status=${data.status}, severity=${data.severity})`,
    bookingId: existing.bookingId,
  });

  revalidatePath("/m/wartung");
  revalidatePath(`/m/wartung/${data.id}`);
  return { ok: true as const };
}

export async function deleteTicket(formData: FormData) {
  const me = await requireManager();
  const id = z.string().uuid().parse(formData.get("id"));
  const rows = await db.select().from(maintenanceTickets).where(eq(maintenanceTickets.id, id)).limit(1);
  if (!rows[0]) return { ok: false as const, error: "Nicht gefunden." };
  await db.delete(maintenanceTickets).where(eq(maintenanceTickets.id, id));
  await db.insert(activityLog).values({
    who: me,
    what: `Wartungs-Ticket gelöscht: "${rows[0].title}"`,
  });
  revalidatePath("/m/wartung");
  return { ok: true as const };
}
