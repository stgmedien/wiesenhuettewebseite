"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogPosts, activityLog } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeAndRestrict } from "@/lib/blog/sanitize";
import { ensureUniqueSlug, toSlug } from "@/lib/blog/slug";
import readingTime from "reading-time";
import * as cheerio from "cheerio";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  slug: z.string().max(255).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  contentHtml: z.string().default(""),
  contentJson: z.unknown().optional(),
  coverImageUrl: z.string().url().optional().nullable(),
  coverImageAlt: z.string().max(500).optional().nullable(),
  metaTitle: z.string().max(255).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

const computeReadingMinutes = (html: string): number => {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const stats = readingTime(text);
  return Math.max(1, Math.round(stats.minutes));
};

const requireManager = async () => {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const role = (session.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Forbidden");
  return session;
};

export async function createBlogPost(): Promise<void> {
  const session = await requireManager();
  const slug = await ensureUniqueSlug(toSlug(`entwurf-${new Date().toISOString().slice(0, 10)}`));
  const inserted = await db
    .insert(blogPosts)
    .values({
      title: "Neuer Entwurf",
      slug,
      contentHtml: "",
      authorId: (session.user as { id?: string } | undefined)?.id ?? null,
      status: "draft",
    })
    .returning({ id: blogPosts.id });

  await db.insert(activityLog).values({
    who: session.user?.name ?? session.user?.email ?? "Manager",
    what: `Blog-Entwurf angelegt (${slug})`,
  });

  redirect(`/m/blog/${inserted[0].id}`);
}

export type SaveResult = { ok: true; slug: string } | { ok: false; error: string };

export async function saveBlogPost(raw: z.infer<typeof upsertSchema>): Promise<SaveResult> {
  const session = await requireManager();
  const parsed = upsertSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const data = parsed.data;
  if (!data.id) return { ok: false, error: "Post-ID fehlt." };

  const cleanHtml = sanitizeAndRestrict(data.contentHtml ?? "");
  const desiredSlug = data.slug?.trim() ? toSlug(data.slug.trim()) : toSlug(data.title);
  const slug = await ensureUniqueSlug(desiredSlug, data.id);
  const reading = computeReadingMinutes(cleanHtml);

  await db
    .update(blogPosts)
    .set({
      title: data.title.trim(),
      slug,
      excerpt: data.excerpt?.trim() || null,
      contentHtml: cleanHtml,
      contentJson: (data.contentJson ?? null) as never,
      coverImageUrl: data.coverImageUrl?.trim() || null,
      coverImageAlt: data.coverImageAlt?.trim() || null,
      metaTitle: data.metaTitle?.trim() || null,
      metaDescription: data.metaDescription?.trim() || null,
      readingMinutes: reading,
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, data.id));

  revalidatePath("/m/blog");
  revalidatePath(`/m/blog/${data.id}`);
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);

  return { ok: true, slug };
}

export async function publishBlogPost(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManager();
  const found = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  const post = found[0];
  if (!post) return { ok: false, error: "Beitrag nicht gefunden" };
  if (!post.title || !post.contentHtml) return { ok: false, error: "Titel und Inhalt sind Pflicht." };

  await db
    .update(blogPosts)
    .set({
      status: "published",
      publishedAt: post.publishedAt ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, id));

  await db.insert(activityLog).values({
    who: session.user?.name ?? session.user?.email ?? "Manager",
    what: `Blog-Beitrag veröffentlicht: ${post.title} (/${post.slug})`,
  });

  revalidatePath("/m/blog");
  revalidatePath(`/m/blog/${id}`);
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  return { ok: true };
}

export async function unpublishBlogPost(id: string): Promise<{ ok: boolean }> {
  await requireManager();
  await db
    .update(blogPosts)
    .set({ status: "draft", updatedAt: new Date() })
    .where(eq(blogPosts.id, id));
  revalidatePath("/m/blog");
  revalidatePath(`/m/blog/${id}`);
  revalidatePath("/blog");
  return { ok: true };
}

export async function deleteBlogPost(id: string): Promise<void> {
  const session = await requireManager();
  const found = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  if (found[0]) {
    await db.insert(activityLog).values({
      who: session.user?.name ?? session.user?.email ?? "Manager",
      what: `Blog-Beitrag gelöscht: ${found[0].title}`,
    });
  }
  revalidatePath("/m/blog");
  revalidatePath("/blog");
  redirect("/m/blog");
}

export type ImportResult = { ok: true; postId: string } | { ok: false; error: string };

/**
 * Accept an uploaded HTML file. Extract title/meta, sanitize body, create draft.
 */
export async function importHtmlFile(formData: FormData): Promise<ImportResult> {
  const session = await requireManager();
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Keine Datei." };
  if (!/(html|htm|md)$/i.test(file.name)) return { ok: false, error: "Nur .html, .htm oder .md erlaubt." };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "Datei zu groß (max 5 MB)." };

  const raw = await file.text();
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

  // Use body-only when full HTML doc was uploaded; otherwise the whole markup.
  const bodyHtml = $("body").length ? $("body").html() ?? "" : raw;
  const cleanHtml = sanitizeAndRestrict(bodyHtml);
  const reading = computeReadingMinutes(cleanHtml);
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
