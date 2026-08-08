"use client";

import { useState, useTransition } from "react";
import { BellRing, CheckCircle2 } from "lucide-react";
import { joinWaitlist } from "./waitlist-actions";
import { toLocalIso } from "@/lib/utils";

const inputCls =
  "w-full rounded-lg border border-[var(--color-wh-winter-grey)] bg-white px-3 py-2.5 focus:border-[var(--color-wh-deep-green)] focus:outline-none";

const labelCls =
  "block text-xs uppercase tracking-wider font-bold text-[var(--color-wh-deep-green)] mb-1.5";

// =============================================================
// Verfügbarkeits-Alarm: Formular unterhalb des Buchungsflows.
// Gast trägt E-Mail + Wunschzeitraum ein; wird der Zeitraum durch eine
// Stornierung wirklich frei, geht automatisch eine Mail raus
// (waitlist-actions.ts / src/lib/waitlist.ts).
// =============================================================

export function WaitlistForm() {
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<"new" | "already" | null>(null);
  const [pending, start] = useTransition();
  const todayIso = toLocalIso(new Date());

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const arrival = (fd.get("arrival") as string) ?? "";
    const departure = (fd.get("departure") as string) ?? "";
    if (!arrival || !departure) {
      setErr("Bitte An- und Abreisedatum angeben.");
      return;
    }
    if (arrival >= departure) {
      setErr("Die Abreise muss nach der Anreise liegen.");
      return;
    }
    const personsRaw = ((fd.get("persons") as string) ?? "").trim();
    start(async () => {
      const r = await joinWaitlist({
        email: (fd.get("email") as string) ?? "",
        firstName: ((fd.get("firstName") as string) ?? "").trim() || undefined,
        arrival,
        departure,
        persons: personsRaw ? Number(personsRaw) : undefined,
        company: (fd.get("company") as string) ?? "",
      });
      if (r.ok) setDone(r.already ? "already" : "new");
      else setErr(r.error);
    });
  }

  return (
    <section
      aria-labelledby="waitlist-heading"
      className="rounded-[var(--radius-card)] bg-[var(--color-wh-beige)] border border-[var(--color-wh-winter-grey)]/40 p-6 sm:p-8"
    >
      <div className="flex items-center gap-2.5">
        <BellRing size={20} className="text-[var(--color-wh-deep-green)] shrink-0" aria-hidden />
        <div className="eyebrow">Verfügbarkeits-Alarm</div>
      </div>
      <h2 id="waitlist-heading" className="text-[24px] sm:text-[32px] mt-3 mb-2 leading-tight">
        Wunschtermin belegt? Wir sagen Dir Bescheid, sobald er frei wird.
      </h2>
      <p className="text-[var(--color-wh-fg-muted)] text-[15px] sm:text-[16px] max-w-xl leading-relaxed">
        Trag Dich mit Deinem Wunschzeitraum ein. Wird eine Buchung storniert und Dein Zeitraum
        ist dadurch komplett frei, bekommst Du sofort automatisch eine E-Mail — first come,
        first served.
      </p>

      {done ? (
        <div
          className="mt-6 flex items-start gap-3 rounded-[var(--radius-card)] bg-[var(--color-wh-green-soft)] border border-[var(--color-wh-green)]/40 p-5"
          role="status"
        >
          <CheckCircle2 size={22} className="text-[var(--color-wh-green)] shrink-0 mt-0.5" aria-hidden />
          <div className="text-[var(--color-wh-deep-green)]">
            <div className="font-semibold">
              {done === "already" ? "Du stehst schon auf der Liste." : "Alarm eingerichtet!"}
            </div>
            <p className="text-sm mt-1 mb-0 leading-relaxed">
              {done === "already"
                ? "Für diesen Zeitraum bist Du bereits eingetragen — wir melden uns, sobald er frei wird."
                : "Wird Dein Wunschzeitraum frei, bekommst Du sofort eine E-Mail von uns."}
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {/* Honeypot gegen Spam-Bots */}
          <div aria-hidden className="hidden">
            <label>
              Firma
              <input type="text" name="company" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className={labelCls}>Anreise</span>
              <input type="date" name="arrival" required min={todayIso} className={inputCls} />
            </label>
            <label className="block">
              <span className={labelCls}>Abreise</span>
              <input type="date" name="departure" required min={todayIso} className={inputCls} />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="block sm:col-span-2">
              <span className={labelCls}>E-Mail-Adresse</span>
              <input type="email" name="email" required autoComplete="email" className={inputCls} />
            </label>
            <label className="block">
              <span className={labelCls}>
                Personen <span className="font-normal normal-case">(optional)</span>
              </span>
              <input type="number" name="persons" min={1} max={33} className={inputCls} />
            </label>
          </div>

          <label className="block">
            <span className={labelCls}>
              Vorname <span className="font-normal normal-case">(optional)</span>
            </span>
            <input type="text" name="firstName" autoComplete="given-name" className={inputCls} />
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
            {pending ? "Wird eingetragen …" : "Bescheid geben, wenn's frei wird"}
          </button>
          <p className="text-xs text-[var(--color-wh-fg-muted)] m-0">
            Deine Daten nutzen wir nur für diese eine Benachrichtigung — danach werden sie
            automatisch gelöscht.
          </p>
        </form>
      )}
    </section>
  );
}
