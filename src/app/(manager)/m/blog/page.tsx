import Link from "next/link";
import { db } from "@/lib/db";
import { blogPosts, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ImportButton, NewPostButton } from "./Buttons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Blog · Wiesenhütte Manager" };

export default async function BlogListPage() {
  const rows = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      status: blogPosts.status,
      publishedAt: blogPosts.publishedAt,
      updatedAt: blogPosts.updatedAt,
      readingMinutes: blogPosts.readingMinutes,
      authorName: users.name,
    })
    .from(blogPosts)
    .leftJoin(users, eq(users.id, blogPosts.authorId))
    .orderBy(desc(blogPosts.updatedAt));

  const drafts = rows.filter((r) => r.status === "draft");
  const published = rows.filter((r) => r.status === "published");
  const archived = rows.filter((r) => r.status === "archived");

  return (
    <div className="px-8 py-10 max-w-[1280px]">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="eyebrow">Blog</div>
          <h1 className="text-[40px] mt-2 mb-0">Beiträge</h1>
          <p className="text-[var(--color-wh-fg-muted)] m-0 mt-2">
            {published.length} veröffentlicht · {drafts.length} Entwürfe · {archived.length} archiviert
          </p>
        </div>
        <div className="flex gap-2">
          <ImportButton />
          <NewPostButton />
        </div>
      </div>

      <div className="mt-10 space-y-12">
        {drafts.length > 0 && (
          <Section title="Entwürfe">
            <PostsTable rows={drafts} />
          </Section>
        )}
        <Section title="Veröffentlicht">
          {published.length === 0 ? (
            <Empty text="Noch keine veröffentlichten Beiträge." />
          ) : (
            <PostsTable rows={published} />
          )}
        </Section>
        {archived.length > 0 && (
          <Section title="Archiviert">
            <PostsTable rows={archived} />
          </Section>
        )}
      </div>
    </div>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="text-[24px] mb-4">{title}</h2>
    {children}
  </section>
);

const Empty = ({ text }: { text: string }) => (
  <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-8 text-center text-[var(--color-wh-fg-muted)]">
    {text}
  </div>
);

type Row = {
  id: string;
  slug: string;
  title: string;
  status: string;
  publishedAt: Date | null;
  updatedAt: Date;
  readingMinutes: number;
  authorName: string | null;
};

const PostsTable = ({ rows }: { rows: Row[] }) => (
  <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-[var(--color-wh-snow)] border-b border-[var(--color-wh-winter-grey)] text-left">
        <tr>
          <Th>Titel</Th>
          <Th>Slug</Th>
          <Th>Autor</Th>
          <Th>Status</Th>
          <Th>Lesezeit</Th>
          <Th>Aktualisiert</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.id}
            className="border-b border-[var(--color-wh-winter-grey)] last:border-b-0 hover:bg-[var(--color-wh-green-soft)]/30 transition-colors"
          >
            <Td>
              <Link
                href={`/m/blog/${r.id}`}
                className="font-semibold text-[var(--color-wh-deep-green)] no-underline"
              >
                {r.title || "(kein Titel)"}
              </Link>
            </Td>
            <Td>
              <code className="text-xs text-[var(--color-wh-fg-muted)]">/{r.slug}</code>
            </Td>
            <Td>{r.authorName ?? "—"}</Td>
            <Td>
              <span
                className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full"
                style={
                  r.status === "published"
                    ? { background: "#6FA05F", color: "#F7F7F2" }
                    : r.status === "draft"
                    ? { background: "#EFE6D8", color: "#8A5A38" }
                    : { background: "#C8CEC4", color: "#2F4A35" }
                }
              >
                {r.status}
              </span>
            </Td>
            <Td>{r.readingMinutes} Min.</Td>
            <Td>{new Date(r.updatedAt).toLocaleDateString("de-DE")}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)]">
    {children}
  </th>
);
const Td = ({ children }: { children: React.ReactNode }) => (
  <td className="px-4 py-3 align-middle">{children}</td>
);
