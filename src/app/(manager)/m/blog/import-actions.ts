"use server";

import { db } from "@/lib/db";
import { blogPosts, activityLog } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ensureUniqueSlug, toSlug } from "@/lib/blog/slug";

export type ImportResult = { ok: true; postId: string } | { ok: false; error: string };

const requireManager = async () => {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const role = (session.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Forbidden");
  return session;
};

const readMinutes = async (html: string) => {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const readingTime = (await import("reading-time")).default;
  return Math.max(1, Math.round(readingTime(text).minutes));
};

/**
 * Accept an uploaded HTML/MD file. Extract title/meta, sanitize body, create draft.
 * Heavy parsers (cheerio, dompurify) are loaded dynamically so they only enter
 * the bundle when this action is actually invoked.
 */
export async function importHtmlFile(formData: FormData): Promise<ImportResult> {
  const session = await requireManager();
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Keine Datei." };
  if (!/(html|htm|md)$/i.test(file.name)) return { ok: false, error: "Nur .html, .htm oder .md erlaubt." };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "Datei zu groß (max 5 MB)." };

  const raw = await file.text();
  const cheerio = await import("cheerio");
  const { sanitizeAndRestrict } = await import("@/lib/blog/sanitize");

  const $ = cheerio.load(raw);

  const title =
    $("title").first().text().trim() ||
    $("h1").first().text().trim() ||
    $('meta[name="wh:title"]').attr("content")?.trim() ||
    file.name.replace(/\.[^.]+$/, "");

  const excerpt =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    $('meta[name="wh:excerpt"]').attr("content")?.trim() ||
    null;

  const cover =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="wh:cover"]').attr("content") ||
    null;

  const slugHint =
    $('meta[name="wh:slug"]').attr("content")?.trim() ||
    title;

  const bodyHtml = $("body").length ? $("body").html() ?? "" : raw;
  const cleanHtml = sanitizeAndRestrict(bodyHtml);
  const reading = await readMinutes(cleanHtml);
  const slug = await ensureUniqueSlug(toSlug(slugHint));

  const inserted = await db
    .insert(blogPosts)
    .values({
      title,
      slug,
      excerpt: excerpt ?? null,
      contentHtml: cleanHtml,
      coverImageUrl: cover ?? null,
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
