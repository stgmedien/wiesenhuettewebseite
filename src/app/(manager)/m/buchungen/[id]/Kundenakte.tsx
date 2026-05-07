"use client";

import { useState, useTransition } from "react";
import { addNote, deleteNote, updateCustomerTags } from "./notes-actions";

type Note = {
  id: string;
  body: string;
  pinned: boolean;
  internal: boolean;
  by: string | null;
  createdAt: Date;
  scope: string;
};

type Props = {
  bookingId: string;
  customerId: string | null;
  customerTags: string[];
  notes: Note[];
};

export function Kundenakte({ bookingId, customerId, customerTags, notes }: Props) {
  const [pending, startTransition] = useTransition();
  const [tagInput, setTagInput] = useState(customerTags.join(", "));
  const [tagsMsg, setTagsMsg] = useState<string | null>(null);
  const [noteMsg, setNoteMsg] = useState<string | null>(null);

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 mt-6">
      <h3 className="text-[20px] m-0 mb-1">Kundenakte</h3>
      <p className="text-xs text-[var(--color-wh-fg-muted)] m-0 mb-5">
        Notizen und Tags zur Buchung und zum Kunden — intern (für das Team) oder
        kundenseitig sichtbar (Hinweis: kundensichtbar nur wenn explizit so markiert).
      </p>

      {/* Tags */}
      {customerId && (
        <div className="mb-6 pb-6 border-b border-[var(--color-wh-winter-grey)]/40">
          <p className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)] font-semibold mb-2">
            Kunden-Tags
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {customerTags.length === 0 ? (
              <span className="text-sm text-[var(--color-wh-fg-muted)] italic">
                Keine Tags
              </span>
            ) : (
              customerTags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-1 rounded-full bg-[var(--color-wh-beige)] border border-[var(--color-wh-winter-grey)]/50 text-xs"
                >
                  {t}
                </span>
              ))
            )}
          </div>
          <form
            action={(fd) =>
              startTransition(async () => {
                fd.set("customerId", customerId);
                const r = await updateCustomerTags(fd);
                setTagsMsg(r.ok ? "Tags aktualisiert." : r.error ?? "Fehler");
              })
            }
            className="flex gap-2"
          >
            <input
              type="text"
              name="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="VIP, Stammgast, Schulklasse, Allergiker, …"
              className="flex-1 rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Speichern
            </button>
          </form>
          {tagsMsg && <p className="text-xs mt-2 text-emerald-700">{tagsMsg}</p>}
          <p className="text-[10px] text-[var(--color-wh-fg-muted)] mt-1">
            Komma-getrennt, max. 20 Tags.
          </p>
        </div>
      )}

      {/* Notiz hinzufuegen */}
      <form
        action={(fd) =>
          startTransition(async () => {
            fd.set("scope", "booking");
            fd.set("refId", bookingId);
            const r = await addNote(fd);
            if (r.ok) {
              setNoteMsg("Notiz gespeichert.");
              const form = document.getElementById("note-form") as HTMLFormElement;
              form?.reset();
            } else setNoteMsg(r.error ?? "Fehler");
          })
        }
        id="note-form"
        className="mb-6"
      >
        <p className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)] font-semibold mb-2">
          Neue Notiz
        </p>
        <textarea
          name="body"
          rows={3}
          required
          placeholder="Internes Memo, Kundengespräch, Sonderwunsch …"
          className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" name="internal" defaultChecked />
            Intern (nicht an Kunde zeigen)
          </label>
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" name="pinned" />
            Anpinnen
          </label>
          <button
            type="submit"
            disabled={pending}
            className="ml-auto rounded-full bg-[var(--color-wh-deep-green)] text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {pending ? "Speichere …" : "Notiz speichern"}
          </button>
        </div>
        {noteMsg && <p className="text-xs mt-2 text-emerald-700">{noteMsg}</p>}
      </form>

      {/* Notizen-Liste */}
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)] font-semibold mb-3">
          Verlauf ({sortedNotes.length})
        </p>
        {sortedNotes.length === 0 ? (
          <p className="text-sm text-[var(--color-wh-fg-muted)] italic">
            Keine Notizen.
          </p>
        ) : (
          <ul className="space-y-2">
            {sortedNotes.map((n) => (
              <li
                key={n.id}
                className={`rounded-lg border p-3 text-sm ${
                  n.pinned
                    ? "bg-amber-50 border-amber-200"
                    : n.internal
                      ? "bg-[var(--color-wh-beige)]/60 border-[var(--color-wh-winter-grey)]/50"
                      : "bg-emerald-50 border-emerald-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="m-0 whitespace-pre-wrap flex-1">{n.body}</p>
                  <form
                    action={(fd) =>
                      startTransition(async () => {
                        fd.set("id", n.id);
                        fd.set("refId", bookingId);
                        await deleteNote(fd);
                      })
                    }
                  >
                    <button
                      type="submit"
                      className="text-xs text-[var(--color-wh-fg-muted)] hover:text-red-700"
                      title="Löschen"
                    >
                      ✕
                    </button>
                  </form>
                </div>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--color-wh-fg-muted)]">
                  {n.pinned && <span>📌 angepinnt</span>}
                  <span>{n.internal ? "🔒 intern" : "👁️ kundensichtbar"}</span>
                  <span>· {n.by ?? "—"}</span>
                  <span>· {new Date(n.createdAt).toLocaleString("de-DE")}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
