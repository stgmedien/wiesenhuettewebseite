"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FileUp,
  Loader2,
  Check,
  ExternalLink,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react";
import { generateFeuerwehrListe } from "./actions";

type Props = {
  bookingId: string;
  currentUrl: string | null;
  initialFeuerwehrNames: string[];
  initialFeuerwehrListeUrl: string | null;
};

export function KurkartenUploadForm({
  bookingId,
  currentUrl,
  initialFeuerwehrNames,
  initialFeuerwehrListeUrl,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadPending, startUpload] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const router = useRouter();

  const [kurkartenUrl, setKurkartenUrl] = useState(currentUrl);
  const [names, setNames] = useState<string[]>(
    initialFeuerwehrNames.length > 0 ? initialFeuerwehrNames : [""]
  );
  const [feuerwehrListeUrl, setFeuerwehrListeUrl] = useState(initialFeuerwehrListeUrl);
  const [editingNames, setEditingNames] = useState(false);
  const [generatePending, startGenerate] = useTransition();
  const [generateError, setGenerateError] = useState<string | null>(null);

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
      setKurkartenUrl(data.url);
      setNames(data.suggestedNames?.length > 0 ? data.suggestedNames : [""]);
      setFeuerwehrListeUrl(data.feuerwehrListeUrl ?? null);
      setEditingNames(false);
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
      setKurkartenUrl(null);
      router.refresh();
    });
  };

  const setName = (i: number, v: string) =>
    setNames((s) => s.map((n, idx) => (idx === i ? v : n)));
  const addRow = () => setNames((s) => [...s, ""]);
  const removeRow = (i: number) => setNames((s) => s.filter((_, idx) => idx !== i));

  const regenerate = () => {
    setGenerateError(null);
    startGenerate(async () => {
      const r = await generateFeuerwehrListe(bookingId, names);
      if (r.ok) {
        setFeuerwehrListeUrl(r.url);
        setEditingNames(false);
        router.refresh();
      } else {
        setGenerateError(r.error);
      }
    });
  };

  const namesCount = names.filter((n) => n.trim()).length;

  return (
    <div className="mt-5 pt-5 border-t border-[var(--color-wh-winter-grey)]">
      <p className="text-sm font-medium mb-1">Kurkarten-PDF für Toni</p>
      <p className="text-xs text-[var(--color-wh-fg-muted)] mb-3">
        Sammel-PDF aus dem AVS-Portal hier hochladen — sie wird der T-7-Mail an Toni automatisch
        beigefügt. Die Feuerwehr-Meldeliste wird dabei automatisch aus den Namen erzeugt.
      </p>

      {kurkartenUrl ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-sm text-emerald-700 flex items-center gap-1.5 m-0">
            <Check size={14} />
            PDF hochgeladen —{" "}
            <a
              href={kurkartenUrl}
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

      {kurkartenUrl && (
        <div className="mt-4 pt-4 border-t border-dashed border-[var(--color-wh-winter-grey)]">
          {feuerwehrListeUrl ? (
            <p className="text-sm text-emerald-700 flex items-center gap-1.5 m-0">
              <Check size={14} />
              Feuerwehr-Meldeliste automatisch erzeugt ({namesCount} Namen) —{" "}
              <a
                href={feuerwehrListeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-wh-deep-green)] inline-flex items-center gap-0.5"
              >
                ansehen <ExternalLink size={11} />
              </a>
            </p>
          ) : (
            <p className="text-sm text-[var(--color-wh-sunset)] font-medium m-0">
              Noch keine Feuerwehr-Meldeliste erzeugt — Namen konnten nicht automatisch erkannt
              werden, bitte unten nachtragen.
            </p>
          )}

          <button
            type="button"
            onClick={() => setEditingNames((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--color-wh-fg-muted)] underline cursor-pointer"
          >
            {editingNames ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Namen korrigieren
          </button>

          {editingNames && (
            <div className="mt-3">
              <div className="space-y-2 mb-3">
                {names.map((n, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={n}
                      onChange={(e) => setName(i, e.target.value)}
                      placeholder="Vorname Nachname"
                      className="flex-1 rounded-lg border border-[var(--color-wh-winter-grey)] bg-white px-3 py-1.5 text-sm focus:border-[var(--color-wh-deep-green)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-wh-fg-muted)] hover:text-red-700 hover:bg-red-50 cursor-pointer"
                      title="Zeile entfernen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addRow}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[var(--radius-btn)] border border-[var(--color-wh-winter-grey)] text-sm cursor-pointer hover:bg-[var(--color-wh-snow)]"
                >
                  <Plus size={14} /> Name hinzufügen
                </button>
                <button
                  type="button"
                  onClick={regenerate}
                  disabled={generatePending || names.every((n) => !n.trim())}
                  className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-deep-green-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatePending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <FileUp size={14} />
                  )}
                  {feuerwehrListeUrl ? "Liste neu erzeugen" : "Liste erzeugen"}
                </button>
              </div>
              {generateError && <p className="text-[13px] text-[#7a3a20] mt-2">{generateError}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
