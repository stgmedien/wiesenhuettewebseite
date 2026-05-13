"use client";

import { useState, useTransition, useRef } from "react";
import { previewImport, commitImport, type ParsedRow } from "./actions";

type State =
  | { phase: "idle" }
  | { phase: "previewing" }
  | { phase: "preview"; rows: ParsedRow[]; counts: { new: number; update: number; conflict: number }; fileName: string }
  | { phase: "committing" }
  | { phase: "done"; created: number; updated: number; skipped: number }
  | { phase: "error"; error: string };

const STATUS_BADGE: Record<ParsedRow["status"], string> = {
  new: "bg-emerald-100 text-emerald-800",
  update: "bg-amber-100 text-amber-900",
  conflict: "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<ParsedRow["status"], string> = {
  new: "Neu",
  update: "Update",
  conflict: "Konflikt",
};

export function ImportClient() {
  const [state, setState] = useState<State>({ phase: "idle" });
  const [pending, startTransition] = useTransition();
  const [storedFile, setStoredFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPreview = (formData: FormData) => {
    startTransition(async () => {
      setState({ phase: "previewing" });
      const file = formData.get("csv") as File;
      setStoredFile(file);
      const res = await previewImport(formData);
      if (res.ok) {
        setState({ phase: "preview", rows: res.rows, counts: res.counts, fileName: file?.name ?? "import.csv" });
      } else {
        setState({ phase: "error", error: res.error });
      }
    });
  };

  const onCommit = () => {
    if (!storedFile) return;
    const fd = new FormData();
    fd.set("csv", storedFile);
    startTransition(async () => {
      setState({ phase: "committing" });
      const res = await commitImport(fd);
      if (res.ok) {
        setState({ phase: "done", created: res.created, updated: res.updated, skipped: res.skipped });
      } else {
        setState({ phase: "error", error: res.error ?? "Unbekannter Fehler" });
      }
    });
  };

  if (state.phase === "done") {
    return (
      <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-8 text-center">
        <div className="text-[48px] mb-3">✓</div>
        <h2 className="text-[24px] font-display font-bold text-[var(--color-wh-deep-green)] m-0 mb-2">
          Import abgeschlossen
        </h2>
        <p className="text-[15px] text-[var(--color-wh-fg-muted)] m-0 mb-6">
          <strong className="text-emerald-700">{state.created}</strong> neu angelegt
          {" · "}
          <strong className="text-amber-700">{state.updated}</strong> verifiziert
          {state.skipped > 0 && (
            <>
              {" · "}
              <strong className="text-red-700">{state.skipped}</strong> übersprungen
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => setState({ phase: "idle" })}
          className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2.5 text-sm font-semibold"
        >
          Weiteren Import starten
        </button>
        <a
          href="/m/mitgliedschaften"
          className="ml-2 rounded-full border border-[var(--color-wh-winter-grey)] px-5 py-2.5 text-sm no-underline"
        >
          Zur Mitgliederliste
        </a>
      </div>
    );
  }

  return (
    <>
      {state.phase === "idle" || state.phase === "error" ? (
        <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 sm:p-8">
          <h2 className="text-[20px] font-display font-bold m-0 mb-3 text-[var(--color-wh-deep-green)]">
            CSV-Datei hochladen
          </h2>
          <p className="text-[14px] text-[var(--color-wh-fg-muted)] m-0 mb-5">
            Mindest-Spalten: <code className="font-mono">email, firstName, lastName</code>. Optional:{" "}
            <code className="font-mono">memberId, phone, joinedAt</code>. Erste Zeile = Header.
          </p>
          <form
            action={onPreview}
            encType="multipart/form-data"
            className="space-y-3"
          >
            <input
              ref={fileRef}
              type="file"
              name="csv"
              accept=".csv,text/csv,application/vnd.ms-excel"
              required
              className="block text-sm w-full file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-wh-beige)] file:text-[var(--color-wh-deep-green)] hover:file:bg-[var(--color-wh-winter-grey)]/30"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {pending ? "Lese CSV …" : "Vorschau anzeigen"}
            </button>
          </form>
          {state.phase === "error" && (
            <p className="text-[14px] text-red-700 mt-3 m-0">{state.error}</p>
          )}

          <details className="mt-6 text-[12px] text-[var(--color-wh-fg-muted)]">
            <summary className="cursor-pointer font-semibold text-[var(--color-wh-deep-green)]">
              Beispiel-CSV (klicken für Format)
            </summary>
            <pre className="mt-3 p-3 bg-[var(--color-wh-beige)]/40 rounded text-[11px] font-mono whitespace-pre overflow-x-auto">
              {`email,firstName,lastName,memberId,phone,joinedAt
mueller@example.com,Max,Müller,0123,+49 123 456,2010-03-15
schmidt@example.com,Lisa,Schmidt,0124,,2015-09-01
weber@example.com,Tom,Weber,,,`}
            </pre>
          </details>
        </div>
      ) : null}

      {state.phase === "preview" && (
        <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
          <div className="flex items-start justify-between gap-4 mb-5 pb-5 border-b border-[var(--color-wh-winter-grey)]/40">
            <div>
              <h2 className="text-[20px] font-display font-bold m-0 mb-1 text-[var(--color-wh-deep-green)]">
                Vorschau · {state.fileName}
              </h2>
              <p className="text-[13px] text-[var(--color-wh-fg-muted)] m-0">
                <strong className="text-emerald-700">{state.counts.new}</strong> neu
                {" · "}
                <strong className="text-amber-700">{state.counts.update}</strong> Update
                {" · "}
                <strong className="text-red-700">{state.counts.conflict}</strong> Konflikt
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setState({ phase: "idle" });
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="text-[13px] text-[var(--color-wh-fg-muted)] hover:underline"
            >
              ✕ andere Datei
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-wh-winter-grey)]">
                  <th className="text-left py-2 font-semibold text-xs uppercase tracking-wider w-12">Zeile</th>
                  <th className="text-left py-2 font-semibold text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left py-2 font-semibold text-xs uppercase tracking-wider">Name</th>
                  <th className="text-left py-2 font-semibold text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left py-2 font-semibold text-xs uppercase tracking-wider">Mitgl.-Nr.</th>
                  <th className="text-left py-2 font-semibold text-xs uppercase tracking-wider">Notiz</th>
                </tr>
              </thead>
              <tbody>
                {state.rows.map((r) => (
                  <tr key={r.rowIndex} className="border-b border-[var(--color-wh-winter-grey)]/30">
                    <td className="py-2 font-mono text-[12px] text-[var(--color-wh-fg-muted)]">{r.rowIndex}</td>
                    <td className="py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${STATUS_BADGE[r.status]}`}
                      >
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="py-2">
                      {r.firstName} {r.lastName}
                    </td>
                    <td className="py-2 font-mono text-[12px]">{r.email}</td>
                    <td className="py-2 font-mono text-[12px]">{r.memberId ?? "—"}</td>
                    <td className="py-2 text-[12px] text-[var(--color-wh-fg-muted)]">
                      {r.conflictReason ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 pt-5 border-t border-[var(--color-wh-winter-grey)]/40 flex items-center justify-between gap-3">
            <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0">
              Konflikte werden automatisch übersprungen. Beim Commit werden{" "}
              <strong>{state.counts.new + state.counts.update}</strong> Datensätze verarbeitet.
            </p>
            <button
              type="button"
              onClick={onCommit}
              disabled={pending || state.counts.new + state.counts.update === 0}
              className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {pending ? "Importiere …" : `Import durchführen (${state.counts.new + state.counts.update})`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
