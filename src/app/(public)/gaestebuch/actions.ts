"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { communityEntries, activityLog } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import {
  uploadCommunityPhotos,
  COMMUNITY_RATE_WINDOW_MS,
  COMMUNITY_MAX_PER_WINDOW,
} from "@/lib/community";

const submitSchema = z.object({
  kind: z.enum(["guestbook", "schulprojekt"]),
  authorName: z.string().min(2, "Bitte Name angeben.").max(120),
  authorContext: z.string().max(200).optional().nullable(),
  authorEmail: z.string().email("Ungültige E-Mail.").max(255).optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  body: z.string().min(20, "Bitte mindestens 20 Zeichen schreiben.").max(4000),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  // Honey-Pot: dieses Feld ist im UI versteckt; wenn Bots es ausfüllen → abweisen
  website: z.string().optional().nullable(),
});

export type SubmitResult = { ok: true; pending: true } | { ok: false; error: string };

export async function submitCommunityEntry(formData: FormData): Promise<SubmitResult> {
  const raw = {
    kind: formData.get("kind"),
    authorName: (formData.get("authorName") || "").toString().trim(),
    authorContext:
      (formData.get("authorContext") || "").toString().trim() || null,
    authorEmail:
      (formData.get("authorEmail") || "").toString().trim().toLowerCase() || null,
    title: (formData.get("title") || "").toString().trim() || null,
    body: (formData.get("body") || "").toString().trim(),
    visitDate: (formData.get("visitDate") || "").toString().trim() || null,
    website: (formData.get("website") || "").toString().trim() || null,
  };

  const parsed = submitSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  const data = parsed.data;

  // Honeypot: Bots füllen typischerweise alle Felder aus
  if (data.website && data.website.length > 0) {
    // Pretend success — Bot soll nichts merken
    return { ok: true, pending: true };
  }

  // Rate-Limit über IP
  const reqHeaders = await headers();
  const ip =
    reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    reqHeaders.get("x-real-ip") ||
    null;

  if (ip) {
    const since = new Date(Date.now() - COMMUNITY_RATE_WINDOW_MS);
    const recent = await db
      .select({ id: communityEntries.id })
      .from(communityEntries)
      .where(
        and(
          eq(communityEntries.submittedIp, ip),
          gt(communityEntries.submittedAt, since)
        )
      )
      .limit(COMMUNITY_MAX_PER_WINDOW + 1);
    if (recent.length >= COMMUNITY_MAX_PER_WINDOW) {
      return {
        ok: false,
        error:
          "Du hast in der letzten Stunde schon mehrere Einträge geschickt. Bitte warte etwas, bevor Du den nächsten einreichst.",
      };
    }
  }

  // Photo-Upload (best-effort; bei Fehler Eintrag ohne Bilder annehmen)
  const upload = await uploadCommunityPhotos(formData, data.kind);
  if ("error" in upload) {
    return { ok: false, error: upload.error };
  }

  await db.insert(communityEntries).values({
    kind: data.kind,
    authorName: data.authorName,
    authorContext: data.authorContext,
    authorEmail: data.authorEmail,
    title: data.title,
    body: data.body,
    photoUrls: upload.urls,
    visitDate: data.visitDate,
    submittedIp: ip,
    status: "pending",
  });

  await db.insert(activityLog).values({
    who: data.authorEmail ?? "anonym",
    what: `${data.kind === "guestbook" ? "Gästebuch-Eintrag" : "Schulprojekt-Anekdote"} eingereicht von ${data.authorName} — wartet auf Moderation`,
  });

  // Manager-Seite revalidieren (Pending-Counter aktualisieren)
  revalidatePath("/m/community");
  revalidatePath("/m/dashboard");

  return { ok: true, pending: true };
}
