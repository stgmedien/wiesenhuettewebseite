"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Check, ExternalLink, FileUp } from "lucide-react";
import { generateFeuerwehrListe } from "./actions";

type Props = {
  bookingId: string;
  suggestedNames: string[];
  currentUrl: string | null;
};

export function FeuerwehrListeForm({ bookingId, suggestedNames, currentUrl }: Props) {
  const [names, setNames] = useState<string[]>(
    suggestedNames.length > 0 ? suggestedNames : [""]
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const setName = (i: number, v: string) =>
    setNames((s) => s.map((n, idx) => (idx === i ? v : n)));
  const addRow = () => setNames((s) => [...s, ""]);
  const removeRow = (i: number) => setNames((s) => s.filter((_, idx) => idx !== i));

  const generate = () => {
    setError(null);
    start(async () => {
      const r = await generateFeuerwehrListe(bookingId, names);
      if (r.ok) {
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  };

  return (
    <div className="mt-5 pt-5 border-t border-[var(--color-wh-winter-grey)]">
      <p className="text-sm font-medium mb-1">Feuerwehr-Meldeliste</p>
      <p className="text-xs text-[var(--color-wh-fg-muted)] mb-3">
        Namen wurden aus der Kurkarten-PDF vorgeschlagen — bitte prüfen/korrigieren, bevor Ihr die
        Liste erzeugt. Sie wird T-7 zusammen mit der Kurkarten-PDF an Toni und den Gast verschickt.
      </p>

      {currentUrl && (
        <p className="text-sm text-emerald-700 flex items-center gap-1.5 mb-3">
          <Check size={14} />
          Liste erzeugt —{" "}
          <a
            href={currentUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--color-wh-deep-green)] inline-flex items-center gap-0.5"
          >
            ansehen <ExternalLink size={11} />
          </a>
        </p>
      )}

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
          onClick={generate}
          disabled={pending || names.every((n) => !n.trim())}
          className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-deep-green-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
          {currentUrl ? "Liste neu erzeugen" : "Liste erzeugen"}
        </button>
      </div>

      {error && <p className="text-[13px] text-[#7a3a20] mt-2">{error}</p>}
    </div>
  );
}
