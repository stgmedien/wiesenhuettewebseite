"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileUp, Loader2, Trash2 } from "lucide-react";

type Item = { url: string; name: string; uploadedAt: string; deleteAfter: string | null };

type Props = {
  bookingId: string;
  items: Item[];
};

const deDate = (iso: string) => iso.slice(0, 10).split("-").reverse().join(".");

/**
 * Foto des unterschriebenen Meldescheins (ausländische Gäste, § 29 BMG).
 * Toni schickt das Foto, Johannes lädt es hier hoch; es wird 1 Jahr nach
 * Abreise automatisch gelöscht (täglicher Cron).
 */
export function SignedMeldescheinUpload({ bookingId, items }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const upload = () => {
    if (!file) return;
    setError(null);
    start(async () => {
      const form = new FormData();
      form.set("bookingId", bookingId);
      form.set("file", file);
      const res = await fetch("/api/m/meldeschein-signiert", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Upload fehlgeschlagen.");
        return;
      }
      setFile(null);
      router.refresh();
    });
  };

  const remove = (url: string) => {
    if (!confirm("Foto des Meldescheins wirklich jetzt löschen?")) return;
    setError(null);
    start(async () => {
      const res = await fetch("/api/m/meldeschein-signiert", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, url }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Löschen fehlgeschlagen.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="mt-6 pt-4 border-t border-[var(--color-wh-winter-grey)]">
      <div className="text-sm font-semibold text-[var(--color-wh-deep-green)] mb-1">
        Unterschriebener Meldeschein (ausländische Gäste)
      </div>
      <p className="text-xs text-[var(--color-wh-fg-muted)] mb-3">
        Foto vom Hüttenwart hier hochladen. Es wird 1 Jahr nach Abreise automatisch gelöscht.
      </p>

      {items.length > 0 && (
        <ul className="space-y-1 mb-3">
          {items.map((it) => (
            <li key={it.url} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <a
                href={it.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[var(--color-wh-deep-green)] underline underline-offset-2"
              >
                Foto ansehen <ExternalLink size={11} />
              </a>
              <span className="text-xs text-[var(--color-wh-fg-muted)]">
                hochgeladen {deDate(it.uploadedAt)}
                {it.deleteAfter ? ` · wird am ${deDate(it.deleteAfter)} gelöscht` : ""}
              </span>
              <button
                type="button"
                onClick={() => remove(it.url)}
                disabled={pending}
                className="inline-flex items-center gap-1 text-xs text-red-700 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={11} /> löschen
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <button
          type="button"
          onClick={upload}
          disabled={pending || !file}
          className="inline-flex shrink-0 items-center justify-center gap-2 h-10 px-4 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-deep-green-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
          Foto hochladen
        </button>
      </div>
      {error && <p className="text-[13px] text-[#7a3a20] mt-2">{error}</p>}
    </div>
  );
}
