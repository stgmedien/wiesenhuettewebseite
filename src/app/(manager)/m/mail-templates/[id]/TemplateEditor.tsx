"use client";

import { useState, useTransition } from "react";
import { diffLines } from "diff";
import { saveTemplateVersion } from "../actions";

type Props = {
  templateId: string;
  initialSubject: string;
  initialBody: string;
  previousBody: string | null;
};

export function TemplateEditor({
  templateId,
  initialSubject,
  initialBody,
  previousBody,
}: Props) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [view, setView] = useState<"edit" | "diff">("edit");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const dirty = subject !== initialSubject || body !== initialBody;

  // Diff zwischen "previousBody → body" wenn previous existiert,
  // sonst "initialBody → body" (aktuelle vs Bearbeitung)
  const diffSrc = view === "diff" ? (previousBody ?? initialBody) : "";
  const diffTarget = view === "diff" ? body : "";
  const diffParts = view === "diff" ? diffLines(diffSrc, diffTarget) : [];

  const onSubmit = (formData: FormData) => {
    setErr(null);
    setMsg(null);
    formData.set("templateId", templateId);
    formData.set("subject", subject);
    formData.set("bodyMd", body);
    startTransition(async () => {
      const r = await saveTemplateVersion(formData);
      if (r.ok) {
        setMsg(`Version ${r.version} gespeichert.`);
        // Page reloadet sich naturally durch revalidatePath, aber
        // wir koennten noch ein router.refresh() machen.
      } else {
        setErr(r.error ?? "Fehler beim Speichern");
      }
    });
  };

  return (
    <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[20px] m-0">Editor</h2>
        <div className="flex gap-1 text-xs">
          <button
            type="button"
            onClick={() => setView("edit")}
            className={`px-3 py-1.5 rounded-full ${
              view === "edit"
                ? "bg-[var(--color-wh-deep-green)] text-white"
                : "border border-[var(--color-wh-winter-grey)]"
            }`}
          >
            Bearbeiten
          </button>
          <button
            type="button"
            onClick={() => setView("diff")}
            className={`px-3 py-1.5 rounded-full ${
              view === "diff"
                ? "bg-[var(--color-wh-deep-green)] text-white"
                : "border border-[var(--color-wh-winter-grey)]"
            }`}
          >
            Diff vs. {previousBody ? "letzte Version" : "aktuell aktiv"}
          </button>
        </div>
      </div>

      {view === "edit" ? (
        <form
          action={onSubmit}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs uppercase text-[var(--color-wh-fg-muted)] mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-[var(--color-wh-fg-muted)] mb-1">
              Body (Markdown, mit{" "}
              <code className="text-xs">{`{{variable}}`}</code>-Substitution)
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={18}
              className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-3 text-sm font-mono"
              placeholder={`# Hallo {{firstName}},\n\nDeine Buchung **{{bookingNumber}}** ist bestätigt.\n\n- Anreise: {{arrival}}\n- Abreise: {{departure}}\n\nViele Grüße,\nWiesenhütte\n`}
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-[var(--color-wh-fg-muted)] mb-1">
              Änderungs-Notiz (optional, für die Audit-Spur)
            </label>
            <input
              type="text"
              name="changeNote"
              placeholder="z.B. „Stornierungsbedingungen aktualisiert"
              className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="setActive" defaultChecked />
              Direkt als aktive Version setzen
            </label>
            <button
              type="submit"
              disabled={pending || !dirty}
              className="ml-auto rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {pending
                ? "Speichere …"
                : dirty
                  ? "Neue Version speichern"
                  : "Keine Änderungen"}
            </button>
          </div>
          {msg && <p className="text-sm text-emerald-700">{msg}</p>}
          {err && <p className="text-sm text-red-700">{err}</p>}
        </form>
      ) : (
        <div className="text-sm font-mono whitespace-pre-wrap rounded-lg border border-[var(--color-wh-winter-grey)] p-4 bg-[var(--color-wh-snow)] max-h-[600px] overflow-auto">
          {diffParts.length === 0 ? (
            <p className="text-[var(--color-wh-fg-muted)] italic m-0">
              Kein Diff verfügbar.
            </p>
          ) : (
            diffParts.map((part, i) => {
              if (part.added) {
                return (
                  <span
                    key={i}
                    className="bg-emerald-100 text-emerald-900 block"
                  >
                    {part.value
                      .split("\n")
                      .map((l, j, arr) =>
                        j < arr.length - 1 ? `+ ${l}\n` : l ? `+ ${l}` : ""
                      )
                      .join("")}
                  </span>
                );
              }
              if (part.removed) {
                return (
                  <span
                    key={i}
                    className="bg-red-100 text-red-900 line-through block"
                  >
                    {part.value
                      .split("\n")
                      .map((l, j, arr) =>
                        j < arr.length - 1 ? `- ${l}\n` : l ? `- ${l}` : ""
                      )
                      .join("")}
                  </span>
                );
              }
              return (
                <span key={i} className="text-[var(--color-wh-fg-muted)]">
                  {part.value}
                </span>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
