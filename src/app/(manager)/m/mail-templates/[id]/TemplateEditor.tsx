"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { diffLines } from "diff";
import { saveTemplateVersion } from "../actions";
import {
  mdToHtml,
  substituteVars,
  wrapEmailHtml,
  SAMPLE_VARIABLE_VALUES,
  type MailVariable,
} from "@/lib/mail-render";

type Props = {
  templateId: string;
  templateName: string;
  initialSubject: string;
  initialBody: string;
  previousBody: string | null;
  variables: MailVariable[];
};

const SAMPLE_VALUES = SAMPLE_VARIABLE_VALUES;

export function TemplateEditor({
  templateId,
  templateName,
  initialSubject,
  initialBody,
  previousBody,
  variables,
}: Props) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [view, setView] = useState<"editor" | "diff">("editor");
  const [previewMode, setPreviewMode] = useState<"with-vars" | "raw">("with-vars");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [draggedVar, setDraggedVar] = useState<string | null>(null);
  const [setActive, setSetActive] = useState(true);
  const [changeNote, setChangeNote] = useState("");

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const lastFocused = useRef<"subject" | "body">("body");

  const dirty = subject !== initialSubject || body !== initialBody;

  // Live-Preview HTML
  const renderedSubject = useMemo(
    () => (previewMode === "with-vars" ? substituteVars(subject, SAMPLE_VALUES) : subject),
    [subject, previewMode]
  );
  const renderedBodyHtml = useMemo(() => {
    const md = previewMode === "with-vars" ? substituteVars(body, SAMPLE_VALUES) : body;
    return wrapEmailHtml(mdToHtml(md), renderedSubject);
  }, [body, previewMode, renderedSubject]);

  // Diff
  const diffParts =
    view === "diff" ? diffLines(previousBody ?? initialBody, body) : [];

  // Insert at cursor (oder am Ende, wenn keine Selection)
  const insertAtCursor = (text: string) => {
    const target = lastFocused.current === "subject" ? subjectRef.current : bodyRef.current;
    if (!target) return;
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    const before = target.value.substring(0, start);
    const after = target.value.substring(end);
    const newVal = before + text + after;

    if (lastFocused.current === "subject") {
      setSubject(newVal);
      requestAnimationFrame(() => {
        target.focus();
        const pos = start + text.length;
        target.setSelectionRange(pos, pos);
      });
    } else {
      setBody(newVal);
      requestAnimationFrame(() => {
        target.focus();
        const pos = start + text.length;
        target.setSelectionRange(pos, pos);
      });
    }
  };

  const wrapSelection = (before: string, after: string = before) => {
    const target = bodyRef.current;
    if (!target) return;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    const selected = target.value.substring(start, end);
    const replaced = before + (selected || "Text") + after;
    const newVal = target.value.substring(0, start) + replaced + target.value.substring(end);
    setBody(newVal);
    requestAnimationFrame(() => {
      target.focus();
      const newStart = start + before.length;
      const newEnd = newStart + (selected || "Text").length;
      target.setSelectionRange(newStart, newEnd);
    });
  };

  const insertLinePrefix = (prefix: string) => {
    const target = bodyRef.current;
    if (!target) return;
    const start = target.selectionStart ?? 0;
    const before = target.value.substring(0, start);
    const lineStart = before.lastIndexOf("\n") + 1;
    const head = target.value.substring(0, lineStart);
    const rest = target.value.substring(lineStart);
    const newVal = head + prefix + rest;
    setBody(newVal);
    requestAnimationFrame(() => {
      target.focus();
      const pos = start + prefix.length;
      target.setSelectionRange(pos, pos);
    });
  };

  // Drag-Drop ist nativ vom Textarea unterstuetzt: wir setzen text/plain,
  // der Browser inserted automatisch an der Drop-Position.
  const onVarDragStart =
    (name: string) => (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", `{{${name}}}`);
      e.dataTransfer.effectAllowed = "copyMove";
      setDraggedVar(name);
    };
  const onVarDragEnd = () => setDraggedVar(null);

  // Synchronisiere body mit Textarea-Wert nach nativem Drop (controlled-Input
  // verschluckt sonst den Browser-Insert)
  const onTextareaDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    const data = e.dataTransfer.getData("text/plain");
    if (!data) return;
    e.preventDefault();
    const target = e.currentTarget;
    // Drop-Position aus dem Event ermitteln
    let pos = target.selectionStart ?? target.value.length;
    // Try: caretPositionFromPoint (Firefox) / caretRangeFromPoint (Chrome)
    const doc = document as Document & {
      caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
      caretRangeFromPoint?: (x: number, y: number) => Range | null;
    };
    const cp = doc.caretPositionFromPoint?.(e.clientX, e.clientY);
    if (cp) pos = cp.offset;
    else {
      const range = doc.caretRangeFromPoint?.(e.clientX, e.clientY);
      if (range) pos = range.startOffset;
    }
    const newVal = target.value.substring(0, pos) + data + target.value.substring(pos);
    setBody(newVal);
    requestAnimationFrame(() => {
      target.focus();
      const newPos = pos + data.length;
      target.setSelectionRange(newPos, newPos);
    });
  };

  const onSubjectDrop = (e: React.DragEvent<HTMLInputElement>) => {
    const data = e.dataTransfer.getData("text/plain");
    if (!data) return;
    e.preventDefault();
    const target = e.currentTarget;
    const pos = target.selectionStart ?? target.value.length;
    const newVal = target.value.substring(0, pos) + data + target.value.substring(pos);
    setSubject(newVal);
    requestAnimationFrame(() => {
      target.focus();
      const newPos = pos + data.length;
      target.setSelectionRange(newPos, newPos);
    });
  };

  // Save
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    const fd = new FormData();
    fd.set("templateId", templateId);
    fd.set("subject", subject);
    fd.set("bodyMd", body);
    fd.set("changeNote", changeNote);
    if (setActive) fd.set("setActive", "on");
    startTransition(async () => {
      const r = await saveTemplateVersion(fd);
      if (r.ok) {
        setMsg(`Version ${r.version} gespeichert.`);
        setChangeNote("");
      } else {
        setErr(r.error ?? "Fehler beim Speichern");
      }
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (document.activeElement !== bodyRef.current) return;
      if (e.key === "b") {
        e.preventDefault();
        wrapSelection("**");
      } else if (e.key === "i") {
        e.preventDefault();
        wrapSelection("*");
      } else if (e.key === "k") {
        e.preventDefault();
        wrapSelection("[", "](https://www.wiesenhütte.com)");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white border border-[var(--color-wh-winter-grey)] rounded-2xl px-4 py-2">
        <div className="flex gap-1">
          <ViewBtn active={view === "editor"} onClick={() => setView("editor")}>
            Editor
          </ViewBtn>
          <ViewBtn active={view === "diff"} onClick={() => setView("diff")}>
            Diff zur Vorgänger-Version
          </ViewBtn>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--color-wh-fg-muted)]">Vorschau:</span>
          <ViewBtn
            small
            active={previewMode === "with-vars"}
            onClick={() => setPreviewMode("with-vars")}
          >
            Mit Beispielwerten
          </ViewBtn>
          <ViewBtn
            small
            active={previewMode === "raw"}
            onClick={() => setPreviewMode("raw")}
          >
            Roh
          </ViewBtn>
        </div>
      </div>

      {view === "editor" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_minmax(0,1fr)] gap-4">
          {/* === LEFT: Variables-Palette + Toolbar === */}
          <aside className="bg-white border border-[var(--color-wh-winter-grey)] rounded-2xl p-4 space-y-5 lg:sticky lg:top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] font-semibold mb-2">
                Variablen
              </p>
              <div className="space-y-3">
                {(["Kunde", "Buchung", "Zahlung", "Sonstiges"] as const).map((group) => {
                  const inGroup = variables.filter((v) => v.group === group);
                  if (inGroup.length === 0) return null;
                  return (
                    <div key={group}>
                      <p className="text-[10px] text-[var(--color-wh-fg-muted)] mb-1 font-semibold">
                        {group}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {inGroup.map((v) => (
                          <button
                            key={v.name}
                            type="button"
                            draggable
                            onDragStart={onVarDragStart(v.name)}
                            onDragEnd={onVarDragEnd}
                            onClick={() => insertAtCursor(`{{${v.name}}}`)}
                            title={`${v.description}\nBeispiel: ${v.example}\n\nKlicken zum Einfügen oder ins Feld ziehen`}
                            className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md border transition cursor-grab active:cursor-grabbing select-none ${
                              draggedVar === v.name
                                ? "bg-[var(--color-wh-deep-green)] text-white border-[var(--color-wh-deep-green)] scale-95"
                                : "bg-[var(--color-wh-beige)] border-[var(--color-wh-winter-grey)]/60 hover:bg-[var(--color-wh-beige-hover)] hover:border-[var(--color-wh-deep-green)]"
                            }`}
                          >
                            {`{{${v.name}}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] font-semibold mb-2">
                Format (Body)
              </p>
              <div className="grid grid-cols-3 gap-1">
                <ToolBtn label="H1" onClick={() => insertLinePrefix("# ")} />
                <ToolBtn label="H2" onClick={() => insertLinePrefix("## ")} />
                <ToolBtn label="H3" onClick={() => insertLinePrefix("### ")} />
                <ToolBtn label="Bold" hint="⌘B" onClick={() => wrapSelection("**")} />
                <ToolBtn label="Italic" hint="⌘I" onClick={() => wrapSelection("*")} />
                <ToolBtn label="Code" onClick={() => wrapSelection("`")} />
                <ToolBtn
                  label="Link"
                  hint="⌘K"
                  onClick={() => wrapSelection("[", "](https://...)")}
                />
                <ToolBtn label="• Liste" onClick={() => insertLinePrefix("- ")} />
                <ToolBtn label="Zitat" onClick={() => insertLinePrefix("> ")} />
              </div>
            </div>

            <div className="text-[10px] text-[var(--color-wh-fg-muted)] pt-3 border-t border-[var(--color-wh-winter-grey)]/40">
              <p className="m-0 mb-1">
                <strong>Drag &amp; Drop:</strong> Variablen-Pille ins Subject- oder Body-Feld
                ziehen.
              </p>
              <p className="m-0">
                <strong>Klick:</strong> fügt an Cursor-Position ein.
              </p>
            </div>
          </aside>

          {/* === MIDDLE: Editor === */}
          <form onSubmit={handleSubmit} className="bg-white border border-[var(--color-wh-winter-grey)] rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] font-semibold mb-1">
                Subject
              </label>
              <input
                ref={subjectRef}
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onFocus={() => (lastFocused.current = "subject")}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onSubjectDrop}
                required
                className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2.5 text-base font-medium focus:border-[var(--color-wh-deep-green)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] font-semibold mb-1">
                Body (Markdown)
              </label>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onFocus={() => (lastFocused.current = "body")}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onTextareaDrop}
                required
                rows={22}
                placeholder={`# Hallo {{firstName}},\n\nDeine Buchung **{{bookingNumber}}** ist bestätigt.\n\n- Anreise: {{arrival}}\n- Abreise: {{departure}}\n\nViele Grüße`}
                className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-3 text-sm font-mono leading-relaxed focus:border-[var(--color-wh-deep-green)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] font-semibold mb-1">
                Änderungs-Notiz (optional)
              </label>
              <input
                type="text"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="Was hast Du geändert?"
                className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-[var(--color-wh-winter-grey)]/40">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={setActive}
                  onChange={(e) => setSetActive(e.target.checked)}
                />
                Direkt aktivieren
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
            {msg && (
              <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 m-0">
                {msg}
              </p>
            )}
            {err && (
              <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2 m-0">{err}</p>
            )}
          </form>

          {/* === RIGHT: Live-Preview === */}
          <aside className="bg-[var(--color-wh-snow)] border border-[var(--color-wh-winter-grey)] rounded-2xl p-4 lg:sticky lg:top-4 self-start">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] font-semibold mb-2">
              Live-Vorschau
            </p>
            <div className="bg-white border border-[var(--color-wh-winter-grey)]/40 rounded-lg overflow-hidden mb-3">
              <div className="px-4 py-2 bg-[var(--color-wh-beige)] border-b border-[var(--color-wh-winter-grey)]/60 text-xs">
                <p className="m-0 text-[var(--color-wh-fg-muted)]">Subject:</p>
                <p className="m-0 font-semibold text-[var(--color-wh-black)] truncate">
                  {renderedSubject || (
                    <span className="italic text-[var(--color-wh-fg-muted)]">
                      (Subject leer)
                    </span>
                  )}
                </p>
              </div>
              <iframe
                title="Mail-Vorschau"
                srcDoc={renderedBodyHtml}
                className="w-full bg-white"
                style={{ height: "min(640px, calc(100vh - 280px))" }}
              />
            </div>
            <p className="text-[10px] text-[var(--color-wh-fg-muted)] m-0">
              {previewMode === "with-vars"
                ? `Vorschau mit Beispielwerten (${SAMPLE_VALUES.firstName}, ${SAMPLE_VALUES.bookingNumber}, …)`
                : "Variablen werden als Pills hervorgehoben."}{" "}
              Tatsächlicher Versand verwendet echte Buchungsdaten.
            </p>
          </aside>
        </div>
      ) : (
        <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] font-semibold mb-2">
            Diff: vorherige Version → aktuelle Bearbeitung
          </p>
          <div className="text-sm font-mono whitespace-pre-wrap rounded-lg border border-[var(--color-wh-winter-grey)] p-4 bg-[var(--color-wh-snow)] max-h-[640px] overflow-auto">
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
                      className="bg-emerald-100 text-emerald-900 block border-l-2 border-emerald-500 pl-2"
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
                      className="bg-red-100 text-red-900 line-through block border-l-2 border-red-500 pl-2"
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
        </div>
      )}
    </div>
  );
}

const ViewBtn = ({
  active,
  onClick,
  children,
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`${small ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-sm"} rounded-full font-medium transition ${
      active
        ? "bg-[var(--color-wh-deep-green)] text-white"
        : "text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-beige)]"
    }`}
  >
    {children}
  </button>
);

const ToolBtn = ({
  label,
  hint,
  onClick,
}: {
  label: string;
  hint?: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={hint ? `${label} (${hint})` : label}
    className="text-[11px] px-1.5 py-1.5 rounded-md border border-[var(--color-wh-winter-grey)] bg-white hover:bg-[var(--color-wh-beige)] hover:border-[var(--color-wh-deep-green)] transition text-[var(--color-wh-deep-green)] font-medium"
  >
    {label}
  </button>
);
