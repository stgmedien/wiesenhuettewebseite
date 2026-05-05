"use server";

import { db } from "@/lib/db";
import { blogPosts, activityLog } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ensureUniqueSlug, toSlug } from "@/lib/blog/slug";
import { sanitizeAndRestrict } from "@/lib/blog/sanitize";
import { parseHtmlForImport } from "@/lib/blog/parse-html";

export type ImportResult = { ok: true; postId: string } | { ok: false; error: string };

const requireManager = async () => {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const role = (session.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Forbidden");
  return session;
};

const readMinutes = (html: string): number => {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
};

/**
 * Accept an uploaded HTML/MD file. Extract title/meta, sanitize body, create draft.
 */
export async function importHtmlFile(formData: FormData): Promise<ImportResult> {
  const session = await requireManager();
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Keine Datei." };
  if (!/(html|htm|md)$/i.test(file.name)) return { ok: false, error: "Nur .html, .htm oder .md erlaubt." };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "Datei zu groß (max 5 MB)." };

  const raw = await file.text();
  const parsed = parseHtmlForImport(raw);

  const title = parsed.title || file.name.replace(/\.[^.]+$/, "");
  const slugHint = parsed.whSlug || title;
  const cover = parsed.ogImage || parsed.whCover || null;
  const cleanHtml = sanitizeAndRestrict(parsed.bodyHtml);
  const reading = readMinutes(cleanHtml);
  const slug = await ensureUniqueSlug(toSlug(slugHint));

  const inserted = await db
    .insert(blogPosts)
    .values({
      title,
      slug,
      excerpt: parsed.description ?? null,
      contentHtml: cleanHtml,
      coverImageUrl: cover,
      authorId: (session.user as { id?: string } | undefined)?.id ?? null,
      status: "draft",
      readingMinutes: reading,
    })
    .returning({ id: blogPosts.id });

  await db.insert(activityLog).values({
    who: session.user?.name ?? session.user?.email ?? "Manager",
    what: `Blog-Beitrag aus HTML-Datei importiert: ${title}`,
  });

  revalidatePath("/m/blog");
  return { ok: true, postId: inserted[0].id };
}
