import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import EditorClient from "./EditorClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditPage({ params }: Props) {
  const { id } = await params;
  const found = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  const post = found[0];
  if (!post) notFound();

  return (
    <EditorClient
      post={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        contentHtml: post.contentHtml,
        coverImageUrl: post.coverImageUrl ?? "",
        coverImageAlt: post.coverImageAlt ?? "",
        metaTitle: post.metaTitle ?? "",
        metaDescription: post.metaDescription ?? "",
        status: post.status,
      }}
    />
  );
}
