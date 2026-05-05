import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { blogPosts, users } from "@/lib/db/schema";
import { eq, and, desc, ne } from "drizzle-orm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
    .limit(1);
  const p = found[0];
  if (!p) return { title: "Beitrag nicht gefunden" };
  return {
    title: `${p.metaTitle ?? p.title} · Wiesenhütte Blog`,
    description: p.metaDescription ?? p.excerpt ?? undefined,
    openGraph: {
      title: p.metaTitle ?? p.title,
      description: p.metaDescription ?? p.excerpt ?? undefined,
      type: "article",
      images: p.coverImageUrl ? [p.coverImageUrl] : undefined,
      publishedTime: p.publishedAt?.toISOString(),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const found = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      contentHtml: blogPosts.contentHtml,
      coverImageUrl: blogPosts.coverImageUrl,
      coverImageAlt: blogPosts.coverImageAlt,
      publishedAt: blogPosts.publishedAt,
      readingMinutes: blogPosts.readingMinutes,
      authorName: users.name,
    })
    .from(blogPosts)
    .leftJoin(users, eq(users.id, blogPosts.authorId))
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
    .limit(1);
  const post = found[0];
  if (!post) notFound();

  const related = await db
    .select({
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      coverImageUrl: blogPosts.coverImageUrl,
    })
    .from(blogPosts)
    .where(and(eq(blogPosts.status, "published"), ne(blogPosts.slug, slug)))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(3);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.vercel.app";

  return (
    <article className="bg-[var(--color-wh-snow)]">
      <header className="px-6 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div className="max-w-[760px] mx-auto">
          <Link href="/blog" className="text-sm text-[var(--color-wh-fg-muted)] no-underline">
            ← Alle Beiträge
          </Link>
          <h1 className="text-[36px] sm:text-[52px] mt-4 mb-3 leading-tight">{post.title}</h1>
          <div className="text-sm text-[var(--color-wh-fg-muted)] uppercase tracking-wider">
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString("de-DE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : ""}
            {" · "}
            {post.readingMinutes} Min. Lesezeit
            {post.authorName ? ` · von ${post.authorName}` : ""}
          </div>
          {post.excerpt && (
            <p className="text-[var(--color-wh-fg-muted)] mt-5 text-lg leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </div>
      </header>

      {post.coverImageUrl && (
        <div className="px-6 sm:px-8 mb-10 sm:mb-12">
          <div className="max-w-[1080px] mx-auto relative aspect-[16/9] rounded-[var(--radius-card)] overflow-hidden">
            <Image
              src={post.coverImageUrl}
              alt={post.coverImageAlt ?? post.title}
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1080px) 1080px, 100vw"
            />
          </div>
        </div>
      )}

      <div className="px-6 sm:px-8 pb-20">
        <div
          className="prose-blog max-w-[760px] mx-auto"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </div>

      {related.length > 0 && (
        <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-20">
          <div className="max-w-[1080px] mx-auto">
            <div className="eyebrow">Weiterlesen</div>
            <h2 className="text-[28px] sm:text-[34px] mt-3 mb-8">Andere Beiträge.</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] overflow-hidden hover:shadow-[var(--shadow-float)] transition-shadow no-underline text-[var(--color-wh-black)]"
                >
                  {r.coverImageUrl ? (
                    <div className="relative aspect-[16/10] bg-[var(--color-wh-beige)]">
                      <Image
                        src={r.coverImageUrl}
                        alt={r.title}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1080px) 360px, 100vw"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] bg-gradient-to-br from-[var(--color-wh-green-soft)] to-[var(--color-wh-beige)]" />
                  )}
                  <div className="p-5">
                    <h3 className="text-[18px] sm:text-[20px] m-0 mb-2 leading-snug">{r.title}</h3>
                    {r.excerpt && (
                      <p className="text-sm text-[var(--color-wh-fg-muted)] m-0 leading-relaxed">
                        {r.excerpt.slice(0, 120)}
                        {r.excerpt.length > 120 ? "…" : ""}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt ?? undefined,
            image: post.coverImageUrl ?? undefined,
            datePublished: post.publishedAt?.toISOString(),
            author: post.authorName ? { "@type": "Person", name: post.authorName } : undefined,
            publisher: {
              "@type": "Organization",
              name: "Skifreunde Gütersloh e.V.",
              logo: { "@type": "ImageObject", url: `${baseUrl}/media/logos/skifreunde-badge.png` },
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": `${baseUrl}/blog/${post.slug}` },
          }),
        }}
      />
    </article>
  );
}
