"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitCancellation, type CancelResult } from "./actions";

const inputCls =
  "w-full rounded-lg border border-[var(--color-wh-winter-grey)] bg-white px-3 py-2.5 focus:border-[var(--color-wh-deep-green)] focus:outline-none";

export function CancelForm() {
  const [art, setArt] = useState<"ordentlich" | "ausserordentlich">("ordentlich");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<Extract<CancelResult, { ok: true }> | null>(null);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <div
        className="flex items-start gap-3 rounded-[var(--radius-card)] bg-[var(--color-wh-green-soft)] border border-[var(--color-wh-green)]/40 p-6"
        role="status"
      >
        <CheckCircle2 size={24} className="text-[var(--color-wh-green)] shrink-0 mt-0.5" aria-hidden />
        <div className="text-[var(--color-wh-deep-green)]">
          <div className="font-semibold text-lg">Kündigung eingegangen.</div>
          <p className="text-sm mt-1 mb-0 leading-relaxed">
            Eingegangen am <strong>{done.receivedAt}</strong>. Deine Mitgliedschaft endet{" "}
            <strong>{done.effectiveText}</strong>. Wir haben Dir eine Eingangsbestätigung per
            E-Mail geschickt. Falls Du innerhalb weniger Minuten keine Mail erhältst, prüfe bitte
            den Spam-Ordner oder schreib uns.
          </p>
        </div>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (art === "ausserordentlich" && !((fd.get("reason") as string) ?? "").trim()) {
      setErr("Bei einer außerordentlichen (fristlosen) Kündigung gib bitte einen Grund an.");
      return;
    }
    start(async () => {
      const r = await submitCancellation(fd);
      if (r.ok) setDone(r);
      else setErr(r.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Honeypot */}
      <div aria-hidden className="hidden">
        <label>
          Firma
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="block text-xs uppercase tracking-wider font-bold text-[var(--color-wh-deep-green)] mb-1">
          Art der Kündigung
        </legend>
        <label className="flex items-start gap-2.5 text-sm cursor-pointer">
          <input
            type="radio"
            name="art"
            value="ordentlich"
            checked={art === "ordentlich"}
            onChange={() => setArt("ordentlich")}
            className="mt-0.5 accent-[var(--color-wh-deep-green)]"
          />
          <span>
            <span className="font-semibold">Ordentliche Kündigung</span> — zum Ende des laufenden
            Beitragsjahres (Standard).
          </span>
        </label>
        <label className="flex items-start gap-2.5 text-sm cursor-pointer">
          <input
            type="radio"
            name="art"
            value="ausserordentlich"
            checked={art === "ausserordentlich"}
            onChange={() => setArt("ausserordentlich")}
            className="mt-0.5 accent-[var(--color-wh-deep-green)]"
          />
          <span>
            <span className="font-semibold">Außerordentliche (fristlose) Kündigung</span> — mit
            Begründung.
          </span>
        </label>
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-xs uppercase tracking-wider font-bold text-[var(--color-wh-deep-green)] mb-1.5">
            Vor- und Nachname
          </span>
          <input type="text" name="name" required autoComplete="name" className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-wider font-bold text-[var(--color-wh-deep-green)] mb-1.5">
            E-Mail-Adresse
          </span>
          <input type="email" name="email" required autoComplete="email" className={inputCls} />
        </label>
      </div>

      <label className="block">
        <span className="block text-xs uppercase tracking-wider font-bold text-[var(--color-wh-deep-green)] mb-1.5">
          Mitgliedsnummer / Hinweis <span className="font-normal normal-case">(optional)</span>
        </span>
        <input type="text" name="note" className={inputCls} placeholder="z. B. Mitgliedsnummer" />
      </label>

      <label className="block">
        <span className="block text-xs uppercase tracking-wider font-bold text-[var(--color-wh-deep-green)] mb-1.5">
          Grund{" "}
          <span className="font-normal normal-case">
            {art === "ausserordentlich" ? "(erforderlich)" : "(optional)"}
          </span>
        </span>
        <textarea name="reason" rows={3} className={inputCls} />
      </label>

      {err && (
        <p role="alert" className="text-[13px] text-[#7a3a20]">
          {err}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center h-12 px-8 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] font-semibold hover:bg-[var(--color-wh-green)] transition-colors cursor-pointer disabled:opacity-50 w-full sm:w-auto"
      >
        {pending ? "Wird gesendet …" : "Jetzt kündigen"}
      </button>
      <p className="text-xs text-[var(--color-wh-fg-muted)] m-0">
        Mit Klick auf „Jetzt kündigen" reichst Du die Kündigung verbindlich ein. Du erhältst sofort
        eine Eingangsbestätigung per E-Mail.
      </p>
    </form>
  );
}
