"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { handovers, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
  return session!.user!.email!;
}

const completeSchema = z.object({
  bookingId: z.string().uuid(),
  kind: z.enum(["checkin", "checkout"]),
  guestName: z.string().min(1).max(255),
  notes: z.string().max(8000).optional().nullable(),
  // JSON-stringified Arrays von der Tablet-UI
  checklist: z.string(),
  photoUrls: z.string(),
  signatureGuestDataUrl: z.string().optional().nullable(),
  signatureManagerDataUrl: z.string().optional().nullable(),
});

const dataUrlToBlob = async (
  dataUrl: string,
  filename: string
): Promise<string> => {
  const m = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!m) throw new Error("Ungültiges Signatur-Format");
  const mime = m[1];
  const buf = Buffer.from(m[2], "base64");
  const ext = mime.split("/")[1] ?? "png";
  const blob = await put(`${filename}.${ext}`, buf, {
    access: "public",
    addRandomSuffix: false,
    contentType: mime,
  });
  return blob.url;
};

export async function completeHandover(formData: FormData) {
  const me = await requireManager();
  const parsed = completeSchema.safeParse({
    bookingId: formData.get("bookingId"),
    kind: formData.get("kind"),
    guestName: formData.get("guestName"),
    notes: formData.get("notes") || null,
    checklist: formData.get("checklist") || "[]",
    photoUrls: formData.get("photoUrls") || "[]",
    signatureGuestDataUrl: formData.get("signatureGuestDataUrl") || null,
    signatureManagerDataUrl: formData.get("signatureManagerDataUrl") || null,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  let checklist: { key: string; label: string; ok: boolean; comment?: string }[];
  let photoUrls: string[];
  try {
    checklist = JSON.parse(parsed.data.checklist);
    photoUrls = JSON.parse(parsed.data.photoUrls);
  } catch {
    return { ok: false, error: "Checklist/Fotos-Parser-Fehler." };
  }

  // Signaturen als Blob hochladen
  let signatureGuestUrl: string | null = null;
  let signatureManagerUrl: string | null = null;
  if (parsed.data.signatureGuestDataUrl) {
    try {
      signatureGuestUrl = await dataUrlToBlob(
        parsed.data.signatureGuestDataUrl,
        `handover/${parsed.data.bookingId}/${parsed.data.kind}-guest-${Date.now()}`
      );
    } catch (err) {
      console.error("[handover] guest signature upload failed:", err);
    }
  }
  if (parsed.data.signatureManagerDataUrl) {
    try {
      signatureManagerUrl = await dataUrlToBlob(
        parsed.data.signatureManagerDataUrl,
        `handover/${parsed.data.bookingId}/${parsed.data.kind}-manager-${Date.now()}`
      );
    } catch (err) {
      console.error("[handover] manager signature upload failed:", err);
    }
  }

  const inserted = await db
    .insert(handovers)
    .values({
      bookingId: parsed.data.bookingId,
      kind: parsed.data.kind,
      by: me,
      guestName: parsed.data.guestName,
      notes: parsed.data.notes,
      checklist,
      photoUrls,
      signatureGuestUrl,
      signatureManagerUrl,
      completedAt: new Date(),
    })
    .returning({ id: handovers.id });

  await db.insert(activityLog).values({
    who: me,
    what: `${parsed.data.kind === "checkin" ? "Anreise" : "Abreise"}-Übergabe abgeschlossen — ${parsed.data.guestName} (${checklist.filter((c) => c.ok).length}/${checklist.length} OK, ${photoUrls.length} Fotos)`,
    bookingId: parsed.data.bookingId,
  });

  revalidatePath(`/m/buchungen/${parsed.data.bookingId}`);
  return { ok: true as const, handoverId: inserted[0].id };
}
