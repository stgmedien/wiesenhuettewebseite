"use client";

import { useState, useTransition, useRef } from "react";
import { submitCommunityEntry } from "@/app/(public)/schulprojekt/actions";

type Props = {
  /**
   * Aktuell nur noch "schulprojekt" — das ehemalige öffentliche Gäste-Buch
   * wurde durch das interne Feedback-System (/feedback/[token]) ersetzt.
   * Prop bleibt für ggf. spätere Erweiterung erhalten.
   */
  kind: "schulprojekt";
  /** Beispiel: "Klasse 9b, ESG Gütersloh" */
  contextPlaceholder?: string;
  /** Eyebrow + Heading */
  title?: string;
  description?: string;
};

const inputBase =
  "w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 bg-white focus:border-[var(--color-wh-deep-green)] focus:outline-none text-[15px]";

export function CommunitySubmitForm({
  kind,
  contextPlaceholder,
  title,
  description,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  const headline = title ?? "Anekdote einreichen";
  const desc =
    description ??
    "Schreib eine Erinnerung von Deiner Projektfahrt. Klasse und Schule darfst Du dabei nennen — wir prüfen jeden Beitrag, bevor er erscheint.";

  return (
    <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 sm:p-8">
      <div className="eyebrow mb-2">Schulprojekt</div>
      <h3 className="text-[22px] sm:text-[26px] font-display font-bold m-0 mb-2 text-[var(--color-wh-deep-green)]">
        {headline}
      </h3>
      <p className="text-[14px] text-[var(--color-wh-fg-muted)] m-0 mb-6">{desc}</p>

      <form
        ref={formRef}
        action={(fd) =>
          startTransition(async () => {
            setError(null);
            setMsg(null);
            // Photos in FormData injecten (sonst werden sie nicht serialisiert)
            for (const f of photos) fd.append("photos", f);
            const r = await submitCommunityEntry(fd);
            if (r.ok) {
              setMsg(
                "Danke! Dein Beitrag wurde eingereicht. Sobald er moderiert ist, erscheint er hier."
              );
              setPhotos([]);
              formRef.current?.reset();
            } else {
              setError(r.error);
            }
          })
        }
        className="space-y-4"
        encType="multipart/form-data"
      >
        <input type="hidden" name="kind" value={kind} />

        {/* Honeypot — versteckt für echte User, Bots füllen es aus */}
        <div
          style={{ position: "absolute", left: "-5000px", height: 0, overflow: "hidden" }}
          aria-hidden
        >
          <label>
            Webseite (bitte leer lassen):
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Dein Name</label>
            <input
              name="authorName"
              type="text"
              required
              maxLength={120}
              placeholder="z.B. Lena Brinkmann"
              className={inputBase}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Klasse / Schule</label>
            <input
              name="authorContext"
              type="text"
              maxLength={200}
              placeholder={contextPlaceholder ?? "z.B. Klasse 9b, ESG Gütersloh"}
              className={inputBase}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              E-Mail (nicht öffentlich)
            </label>
            <input
              name="authorEmail"
              type="email"
              maxLength={255}
              placeholder="für Rückfragen, optional"
              className={inputBase}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Aufenthalt war ungefähr</label>
            <input name="visitDate" type="date" className={inputBase} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Überschrift (optional)</label>
          <input
            name="title"
            type="text"
            maxLength={200}
            placeholder="z.B. Die Nacht am Lagerfeuer"
            className={inputBase}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Dein Beitrag</label>
          <textarea
            name="body"
            required
            minLength={20}
            maxLength={4000}
            rows={6}
            placeholder="Was ist Dir besonders in Erinnerung geblieben? Was hast Du gelernt?"
            className={inputBase}
          />
          <p className="text-[11px] text-[var(--color-wh-fg-muted)] mt-1">
            20 bis 4000 Zeichen.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Photos hochladen (optional, max. 6 Stück)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []).slice(0, 6);
              setPhotos(files);
            }}
            className="block text-sm w-full file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-wh-beige)] file:text-[var(--color-wh-deep-green)] hover:file:bg-[var(--color-wh-winter-grey)]/30"
          />
          {photos.length > 0 && (
            <p className="text-[12px] text-[var(--color-wh-fg-muted)] mt-1">
              {photos.length} Photo{photos.length === 1 ? "" : "s"} ausgewählt:{" "}
              {photos.map((p) => p.name).join(", ")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {pending ? "Wird gesendet …" : "Beitrag einreichen"}
          </button>
          {msg && <span className="text-sm text-emerald-700">{msg}</span>}
          {error && <span className="text-sm text-red-700">{error}</span>}
        </div>

        <p className="text-[11px] text-[var(--color-wh-fg-muted)] leading-relaxed pt-2 border-t border-[var(--color-wh-winter-grey)]/40">
          Hinweis: Dein Beitrag wird vor Veröffentlichung von uns gelesen. Beleidigende oder
          rechtswidrige Inhalte werden nicht freigeschaltet. Deine E-Mail-Adresse ist nur intern
          sichtbar (für Rückfragen).
        </p>
      </form>
    </div>
  );
}
