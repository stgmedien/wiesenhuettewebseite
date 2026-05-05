import slugify from "slugify";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { eq, ne, and } from "drizzle-orm";

export const toSlug = (input: string): string => {
  const base = slugify(input, {
    lower: true,
    strict: true,
    locale: "de",
    trim: true,
  });
  return base || `post-${Date.now().toString(36)}`;
};

/**
 * Returns a unique slug for blog_posts. If `base` is already taken,
 * appends -2, -3, ... until we find a free one. Excludes a given post
 * id when editing.
 */
export const ensureUniqueSlug = async (
  base: string,
  excludeId?: string
): Promise<string> => {
  const candidates = [base, ...Array.from({ length: 50 }, (_, i) => `${base}-${i + 2}`)];
  for (const candidate of candidates) {
    const where = excludeId
      ? and(eq(blogPosts.slug, candidate), ne(blogPosts.id, excludeId))
      : eq(blogPosts.slug, candidate);
    const existing = await db.select({ id: blogPosts.id }).from(blogPosts).where(where).limit(1);
    if (existing.length === 0) return candidate;
  }
  return `${base}-${Math.floor(Math.random() * 100000)}`;
};
