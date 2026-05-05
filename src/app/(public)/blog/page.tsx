import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { blogPosts, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog · Wiesenhütte",
  description:
    "Geschichten, Tipps und News rund um die Wiesenhütte in Langewiese — Vereinsleben, Hochsauerland, Wandern, Skifahren.",
};

export default async function BlogIndex() {
  const posts = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      coverImageUrl: blogPosts.coverImageUrl,
      coverImageAlt: blogPosts.coverImageAlt,
      publishedAt: blogPosts.publishedAt,
      readingMinutes: blogPosts.readingMinutes,
      authorName: users.name,
    })
    .from(blogPosts)
    .leftJoin(users, eq(users.id, blogPosts.authorId))
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt));

  return (
    <div className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
      <div className="max-w-[1080px] mx-auto">
        <div className="eyebrow">Blog</div>
        <h1 className="text-[44px] sm:text-[64px] mt-4 mb-4">Aus der Hütte.</h1>
        <p className="text-base sm:text-[18px] leading-relaxed text-[var(--color-wh-fg-muted)] max-w-2xl">
          Geschichten von der Wiesenhütte — vom Verein, von Klassenfahrten, vom Hochsauerland.
          Tipps für Eure Buchung und Eindrücke aus den Saisons.
        </p>

        {posts.length === 0 ? (
          <div className="mt-16 bg-[var(--color-wh-beige)] rounded-[var(--radius-card)] p-10 text-center text-[var(--color-wh-fg-muted)]">
            Noch keine Beiträge veröffentlicht.
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {posts.map((p) => (
              <article
                key={p.id}
                className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] overflow-hidden hover:shadow-[var(--shadow-float)] transition-shadow"
              >
                <Link href={`/blog/${p.slug}`} className="no-underline text-[var(--color-wh-black)] block">
                  {p.coverImageUrl ? (
                    <div className="relative aspect-[16/10] bg-[var(--color-wh-beige)]">
                      <Image
                        src={p.coverImageUrl}
                        alt={p.coverImageAlt ?? p.title}
                        fill
                        className="object-cover"
                        sizes="(min-width: 768px) 540px, 100vw"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] bg-gradient-to-br from-[var(--color-wh-green-soft)] to-[var(--color-wh-beige)]" />
                  )}
                  <div className="p-6">
                    <h2 className="text-[22px] sm:text-[26px] m-0 mb-2">{p.title}</h2>
                    {p.excerpt && (
                      <p className="text-[var(--color-wh-fg-muted)] m-0 leading-relaxed text-[15px]">
                        {p.excerpt}
                      </p>
                    )}
                    <div className="mt-4 text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)]">
                      {p.publishedAt
                        ? new Date(p.publishedAt).toLocaleDateString("de-DE", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Entwurf"}
                      {" · "}
                      {p.readingMinutes} Min. Lesezeit
                      {p.authorName ? ` · von ${p.authorName}` : ""}
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
