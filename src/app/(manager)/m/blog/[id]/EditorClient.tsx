"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, Save, ExternalLink, Trash2, Upload, ImageIcon } from "lucide-react";
import { Editor } from "@/components/blog/Editor";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  saveBlogPost,
  publishBlogPost,
  unpublishBlogPost,
  deleteBlogPost,
} from "../actions";
import { uploadBlogImage } from "@/lib/blog/upload";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  coverImageUrl: string;
  coverImageAlt: string;
  metaTitle: string;
  metaDescription: string;
  status: string;
};

export default function EditorClient({ post }: { post: Post }) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [contentHtml, setContentHtml] = useState(post.contentHtml);
  const [contentJson, setContentJson] = useState<object | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState(post.coverImageUrl);
  const [coverImageAlt, setCoverImageAlt] = useState(post.coverImageAlt);
  const [metaTitle, setMetaTitle] = useState(post.metaTitle);
  const [metaDescription, setMetaDescription] = useState(post.metaDescription);
  const [status, setStatus] = useState(post.status);
  const [coverUploading, setCoverUploading] = useState(false);

  const [savePending, startSave] = useTransition();
  const [pubPending, startPub] = useTransition();
  const [delPending, startDel] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadBlogImage(fd);
    if (!res.ok) throw new Error(res.error);
    return res.url;
  };

  const onPickCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCoverUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setCoverImageUrl(url);
      if (!coverImageAlt) setCoverImageAlt(file.name.replace(/\.[^.]+$/, ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setCoverUploading(false);
    }
  };

  const save = (after?: () => void) => {
    setError(null);
    startSave(async () => {
      const res = await saveBlogPost({
        id: post.id,
        title: title.trim() || "(ohne Titel)",
        slug: slug.trim() || undefined,
        excerpt: excerpt.trim() || null,
        contentHtml,
        contentJson: contentJson ?? undefined,
        coverImageUrl: coverImageUrl.trim() || null,
        coverImageAlt: coverImageAlt.trim() || null,
        metaTitle: metaTitle.trim() || null,
        metaDescription: metaDescription.trim() || null,
        status: status as "draft" | "published" | "archived",
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.slug !== slug) setSlug(res.slug);
      setSavedAt(new Date());
      after?.();
    });
  };

  const togglePublish = () => {
    save(() => {
      startPub(async () => {
        if (status === "published") {
          await unpublishBlogPost(post.id);
          setStatus("draft");
        } else {
          const res = await publishBlogPost(post.id);
          if (!res.ok) {
            setError(res.error ?? "Fehler beim Veröffentlichen");
            return;
          }
          setStatus("published");
        }
        router.refresh();
      });
    });
  };

  const onDelete = () => {
    if (!confirm("Beitrag wirklich löschen? Das kann nicht rückgängig gemacht werden.")) return;
    startDel(async () => {
      await deleteBlogPost(post.id);
    });
  };

  return (
    <div className="px-6 sm:px-8 py-8 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link href="/m/blog" className="text-sm text-[var(--color-wh-fg-muted)] no-underline">
            ← Alle Beiträge
          </Link>
          <div className="eyebrow mt-2">Beitrag bearbeiten</div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {savedAt && (
            <span className="text-xs text-[var(--color-wh-fg-muted)]">
              Gespeichert {savedAt.toLocaleTimeString("de-DE")}
            </span>
          )}
          <Link
            href={`/blog/${slug}`}
            target="_blank"
            className="inline-flex h-10 px-4 items-center gap-1.5 rounded-[var(--radius-btn)] border border-[var(--color-wh-winter-grey)] text-sm font-semibold text-[var(--color-wh-deep-green)] no-underline hover:bg-[var(--color-wh-green-soft)]"
          >
            <Eye size={16} /> Vorschau <ExternalLink size={12} />
          </Link>
          <Button
            type="button"
            variant="secondary"
            disabled={savePending}
            onClick={() => save()}
            iconLeft={savePending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          >
            Speichern
          </Button>
          <Button
            type="button"
            disabled={pubPending || savePending}
            onClick={togglePublish}
          >
            {pubPending ? "..." : status === "published" ? "Zurückziehen" : "Veröffentlichen"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-[var(--color-wh-sunset)]/10 text-[var(--color-wh-sunset)] rounded-md px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid gap-8 mt-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Input
            id="title"
            label="Titel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z. B. 6 Wandertouren direkt ab der Wiesenhütte"
            required
          />
          <Input
            id="slug"
            label="URL-Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            hint="Leerlassen = automatisch aus Titel"
          />
          <Textarea
            id="excerpt"
            label="Teaser (optional, ~150 Zeichen)"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            hint="Wird im Feed und als Meta-Description verwendet"
            rows={3}
          />

          <div>
            <span className="text-sm font-medium text-[var(--color-wh-deep-green)] mb-1.5 block">Inhalt</span>
            <Editor
              initialHtml={contentHtml}
              onChange={(html, json) => {
                setContentHtml(html);
                setContentJson(json);
              }}
              onUploadImage={uploadImage}
            />
          </div>
        </div>

        <aside className="space-y-5">
          <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5">
            <h3 className="m-0 mb-3 text-[18px]">Cover-Bild</h3>
            {coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImageUrl}
                alt={coverImageAlt}
                className="w-full aspect-[16/10] object-cover rounded-md mb-3"
              />
            ) : (
              <div className="w-full aspect-[16/10] bg-[var(--color-wh-snow)] rounded-md flex items-center justify-center mb-3 text-[var(--color-wh-fg-muted)]">
                <ImageIcon size={32} strokeWidth={1.4} />
              </div>
            )}
            <label className="inline-flex h-10 px-4 items-center gap-2 rounded-md bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-deep-green-hover)] transition-colors w-full justify-center">
              {coverUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {coverUploading ? "Hochladen..." : "Bild hochladen"}
              <input type="file" accept="image/*" className="hidden" onChange={onPickCover} disabled={coverUploading} />
            </label>
            {coverImageUrl && (
              <Input
                id="coverAlt"
                label="Alt-Text (Pflicht für SEO)"
                value={coverImageAlt}
                onChange={(e) => setCoverImageAlt(e.target.value)}
                className="mt-3"
              />
            )}
          </section>

          <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5">
            <h3 className="m-0 mb-3 text-[18px]">SEO</h3>
            <Input
              id="metaTitle"
              label="Meta-Titel"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              hint="Leer = Titel verwenden"
            />
            <Textarea
              id="metaDescription"
              label="Meta-Beschreibung"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              hint="Leer = Teaser verwenden"
              rows={3}
              className="mt-3"
            />
          </section>

          <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5">
            <h3 className="m-0 mb-3 text-[18px]">Status</h3>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-11 px-4 rounded-md border border-[var(--color-wh-winter-grey)] bg-white"
            >
              <option value="draft">Entwurf</option>
              <option value="published">Veröffentlicht</option>
              <option value="archived">Archiviert</option>
            </select>
            <p className="text-xs text-[var(--color-wh-fg-muted)] mt-2 m-0">
              Status nimmt der Veröffentlichen-Button automatisch — hier nur falls Du archivieren willst.
            </p>
          </section>

          <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5">
            <h3 className="m-0 mb-3 text-[18px] text-[var(--color-wh-sunset)]">Gefährliche Zone</h3>
            <button
              type="button"
              disabled={delPending}
              onClick={onDelete}
              className="inline-flex h-10 px-4 items-center gap-2 rounded-md bg-[var(--color-wh-sunset)] text-[var(--color-wh-snow)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-sunset-hover)] transition-colors disabled:opacity-60"
            >
              {delPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Beitrag löschen
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
