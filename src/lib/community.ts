/**
 * Geteilte Helper für Community-Entries (Gäste-Buch + Schulprojekt-Anekdoten).
 *
 * Beide Flows nutzen die selbe Tabelle (kind-Discriminator), das selbe
 * Submit-Verfahren (Text + Photos via FormData → Vercel Blob), und die selbe
 * Moderations-UI im Manager-Backend.
 */

import { put } from "@vercel/blob";
import crypto from "crypto";

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_PHOTOS_PER_ENTRY = 6;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB pro Photo

export type UploadResult = { urls: string[] } | { error: string };

/**
 * Liest alle "photos"-File-Felder aus FormData, validiert MIME + Size, lädt
 * jeden zu Vercel Blob hoch. Best-effort: bei einzelnem Fehler bricht der
 * gesamte Upload ab (kein partieller State im DB-Eintrag).
 */
export async function uploadCommunityPhotos(
  formData: FormData,
  kind: "guestbook" | "schulprojekt"
): Promise<UploadResult> {
  const files = formData
    .getAll("photos")
    .filter((v): v is File => v instanceof File && v.size > 0);

  if (files.length === 0) return { urls: [] };
  if (files.length > MAX_PHOTOS_PER_ENTRY) {
    return { error: `Maximal ${MAX_PHOTOS_PER_ENTRY} Photos pro Eintrag.` };
  }

  for (const f of files) {
    if (!ALLOWED_IMAGE_MIME.has(f.type)) {
      return { error: `Dateiformat nicht unterstützt: ${f.type}` };
    }
    if (f.size > MAX_PHOTO_BYTES) {
      return { error: `Photo zu groß (max ${MAX_PHOTO_BYTES / 1024 / 1024} MB).` };
    }
  }

  const urls: string[] = [];
  for (const f of files) {
    const ext = f.name.split(".").pop()?.toLowerCase() || "jpg";
    const rand = crypto.randomBytes(8).toString("hex");
    const safe = `community/${kind}/${Date.now()}-${rand}.${ext}`;
    const arrayBuf = await f.arrayBuffer();
    const blob = await put(safe, Buffer.from(arrayBuf), {
      access: "public",
      addRandomSuffix: false,
      contentType: f.type,
    });
    urls.push(blob.url);
  }

  return { urls };
}

/**
 * Einfache Server-Side-Rate-Limit-Helper, der prüft ob in den letzten X min
 * eine Submission von dieser IP bzw. Email kam. Sehr lockeres Limit — wir
 * verlassen uns hauptsächlich auf Moderation.
 */
export const COMMUNITY_RATE_WINDOW_MS = 60 * 60_000; // 1 Stunde
export const COMMUNITY_MAX_PER_WINDOW = 3;
