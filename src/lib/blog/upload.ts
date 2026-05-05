"use server";

import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Upload an image to Vercel Blob and return its public URL.
 * Manager auth required. Validates mime + size.
 *
 * Requires env var BLOB_READ_WRITE_TOKEN. In Vercel: Storage → Blob → connect.
 * Locally: copy from Vercel dashboard into .env.local.
 */
export async function uploadBlogImage(formData: FormData): Promise<UploadResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Unauthorized" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Keine Datei übergeben." };

  if (!ALLOWED_MIME.includes(file.type)) {
    return {
      ok: false,
      error: `Dateityp ${file.type} nicht erlaubt. Erlaubt: ${ALLOWED_MIME.join(", ")}.`,
    };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: `Datei zu groß (${Math.round(file.size / 1024 / 1024)} MB). Maximal 8 MB.` };
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      ok: false,
      error: "Vercel Blob ist nicht eingerichtet. BLOB_READ_WRITE_TOKEN fehlt.",
    };
  }

  const ts = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const path = `blog/${ts}-${safeName}`;

  try {
    const blob = await put(path, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    return { ok: true, url: blob.url };
  } catch (err) {
    console.error("[blob] upload failed", err);
    return { ok: false, error: "Upload fehlgeschlagen." };
  }
}
