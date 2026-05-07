import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.vercel.app";
  const now = new Date();

  const staticPaths: MetadataRoute.Sitemap = [
    "",
    "/huette",
    "/verein",
    "/schulprojekt",
    "/lage",
    "/kontakt",
    "/buchen",
    "/hausordnung",
    "/blog",
    "/agb",
    "/datenschutz",
    "/impressum",
  ].map((p) => ({
    url: `${baseUrl}${p}`,
    lastModified: now,
    changeFrequency: p === "" || p === "/buchen" || p === "/blog" ? "weekly" : "monthly",
    priority: p === "" ? 1 : p === "/buchen" ? 0.9 : 0.7,
  }));

  let posts: Array<{ slug: string; updatedAt: Date }> = [];
  try {
    posts = await db
      .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"));
  } catch {
    // DB not reachable at build time — fall back to static-only
  }

  const blogPaths: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPaths, ...blogPaths];
}
