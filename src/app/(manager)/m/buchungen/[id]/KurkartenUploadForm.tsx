"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, Check, ExternalLink, Trash2 } from "lucide-react";

type Props = {
  bookingId: string;
  currentUrl: string | null;
};

export function KurkartenUploadForm({ bookingId, currentUrl }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadPending, startUpload] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const router = useRouter();

  const upload = () => {
    if (!file) return;
    setError(null);
    startUpload(async () => {
      const form = new FormData();
      form.set("bookingId", bookingId);
      form.set("file", file);
      const res = await fetch("/api/m/kurkarten-upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload fehlgeschlagen.");
        return;
      }
      setFile(null);
      router.refresh();
    });
  };

  const remove = () => {
    if (!confirm("Kurkarten-PDF wirklich löschen?")) return;
    setError(null);
    startDelete(async () => {
      const res = await fetch("/api/m/kurkarten-upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
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
    <div className="mt-5 pt-5 border-t border-[var(--color-wh-winter-grey)]">
      <p className="text-sm font-medium mb-1">Kurkarten-PDF für Toni</p>
      <p className="text-xs text-[var(--color-wh-fg-muted)] mb-3">
        Sammel-PDF aus dem AVS-Portal hier hochladen — sie wird der T-7-Mail an Toni automatisch
        beigefügt, damit er sie vor Anreise ausdrucken kann.
      </p>

      {currentUrl ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-sm text-emerald-700 flex items-center gap-1.5 m-0">
            <Check size={14} />
            PDF hochgeladen —{" "}
            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-wh-deep-green)] inline-flex items-center gap-0.5"
            >
              ansehen <ExternalLink size={11} />
            </a>
          </p>
          <button
            type="button"
            onClick={remove}
            disabled={deletePending}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-btn)] border border-red-300 text-red-700 text-xs font-semibold cursor-pointer hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deletePending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            PDF löschen
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-[var(--color-wh-sunset)] font-medium mb-3">
            Noch keine PDF hochgeladen.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <button
              type="button"
              onClick={upload}
              disabled={uploadPending || !file}
              className="inline-flex shrink-0 items-center justify-center gap-2 h-11 px-5 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-deep-green-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadPending ? <Loader2 size={15} className="animate-spin" /> : <FileUp size={15} />}
              Hochladen
            </button>
          </div>
        </>
      )}

      {error && <p className="text-[13px] text-[#7a3a20] mt-2">{error}</p>}
    </div>
  );
}
