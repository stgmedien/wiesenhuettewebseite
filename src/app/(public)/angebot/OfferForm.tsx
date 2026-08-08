"use client";

import { useState, useTransition } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Info,
} from "lucide-react";
import { createOffer } from "./actions";
import { RULES } from "@/lib/pricing";
import { formatDateLong } from "@/lib/utils";

const inputBase =
  "w-full rounded-xl border border-[var(--color-wh-winter-grey)] px-3.5 py-2.5 bg-white focus:border-[var(--color-wh-deep-green)] focus:outline-none focus:ring-2 focus:ring-[var(--color-wh-deep-green)]/15 text-[15px] transition-colors";

// Lokales "heute + n Tage" als YYYY-MM-DD (ohne UTC-Off-by-one)
const localIsoPlusDays = (base: string | null, days: number): string => {
  const d = base ? new Date(`${base}T12:00:00`) : new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="block text-[12px] font-semibold text-[var(--color-wh-deep-green)] mb-1.5">
      {label}
    </span>
    {children}
    {hint && <span className="block text-[11px] text-[var(--color-wh-fg-muted)] mt-1">{hint}</span>}
  </label>
);

export function OfferForm() {
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [pupils, setPupils] = useState(0);
  const [teachers, setTeachers] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ token: string; validUntil: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const totalPersons = adults + children + pupils + teachers;
  const minArrival = localIsoPlusDays(null, 0);
  const minDeparture = arrival
    ? localIsoPlusDays(arrival, RULES.minNights)
    : localIsoPlusDays(null, RULES.minNights);

  const numField = (
    label: string,
    hint: string,
    name: string,
    value: number,
    set: (n: number) => void
  ) => (
    <Field label={label} hint={hint}>
      <input
        name={name}
        type="number"
        min={0}
        max={RULES.maxPersons}
        value={value}
        onChange={(e) =>
          set(Math.max(0, Math.min(RULES.maxPersons, Number(e.target.value) || 0)))
        }
        className={inputBase}
      />
    </Field>
  );

  // ---------- Erfolgs-Ansicht: Link groß + Kopieren + PDF ----------
  if (result) {
    const url = `${window.location.origin}/angebot/${result.token}`;
    const pdfUrl = `/api/angebot/${result.token}/pdf`;
    return (
      <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(47,74,53,0.08)]">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={28} className="text-[var(--color-wh-deep-green)] shrink-0" />
          <div>
            <h2 className="text-[22px] sm:text-[26px] m-0">Euer Angebot steht!</h2>
            <p className="text-[13px] text-[var(--color-wh-fg-muted)] m-0 mt-0.5">
              Gültig bis {formatDateLong(result.validUntil)} — bis dahin sind die Preise
              eingefroren.
            </p>
          </div>
        </div>

        {/* Link groß */}
        <div className="mt-6 rounded-2xl bg-[var(--color-wh-green-soft)] border border-[var(--color-wh-green)]/40 p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--color-wh-deep-green)] m-0 mb-2">
            Euer teilbarer Link
          </p>
          <a
            href={url}
            className="block font-mono text-[14px] sm:text-[16px] text-[var(--color-wh-deep-green)] break-all underline underline-offset-2 hover:no-underline"
          >
            {url}
          </a>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            }}
            className="inline-flex items-center gap-2 h-12 px-6 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] font-semibold text-[15px] hover:bg-[var(--color-wh-deep-green-hover)] transition-colors"
          >
            {copied ? <Check size={17} /> : <Copy size={17} />}
            {copied ? "Kopiert!" : "Link kopieren"}
          </button>
          <a
            href={pdfUrl}
            className="inline-flex items-center gap-2 h-12 px-6 rounded-[var(--radius-btn)] border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] font-semibold text-[15px] hover:bg-[var(--color-wh-green-soft)] transition-colors"
          >
            <Download size={17} /> Als PDF
          </a>
          <a
            href={url}
            className="inline-flex items-center gap-2 h-12 px-6 rounded-[var(--radius-btn)] border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-black)] font-semibold text-[15px] hover:bg-[var(--color-wh-beige)]/50 transition-colors"
          >
            <ExternalLink size={17} /> Angebot ansehen
          </a>
        </div>

        <button
          type="button"
          onClick={() => {
            setResult(null);
            setError(null);
          }}
          className="mt-6 text-[13px] text-[var(--color-wh-fg-muted)] underline underline-offset-2 hover:no-underline"
        >
          Weiteres Angebot erstellen
        </button>
      </div>
    );
  }

  // ---------- Formular ----------
  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          setError(null);
          const r = await createOffer(fd);
          if (r.ok) {
            setResult({ token: r.token, validUntil: r.validUntil });
          } else {
            setError(r.error);
          }
        })
      }
      className="bg-white border border-[var(--color-wh-winter-grey)] rounded-3xl p-6 sm:p-8 space-y-8 shadow-[0_20px_50px_rgba(47,74,53,0.08)]"
    >
      {/* 1 · Zeitraum */}
      <fieldset className="space-y-4">
        <legend className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--color-wh-deep-green)]">
          1 · Zeitraum
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Anreise">
            <input
              name="arrival"
              type="date"
              required
              min={minArrival}
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
              className={inputBase}
            />
          </Field>
          <Field label="Abreise" hint={`Mindestaufenthalt ${RULES.minNights} Nächte`}>
            <input
              name="departure"
              type="date"
              required
              min={minDeparture}
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              className={inputBase}
            />
          </Field>
        </div>
      </fieldset>

      <div className="h-px bg-[var(--color-wh-winter-grey)]" />

      {/* 2 · Gruppe */}
      <fieldset className="space-y-4">
        <legend className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--color-wh-deep-green)]">
          2 · Eure Gruppe
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {numField("Erwachsene", "ab 16 Jahren", "adults", adults, setAdults)}
          {numField("Kinder", "4–15 Jahre", "children", children, setChildren)}
          {numField("Schüler", "Schulgruppen", "pupils", pupils, setPupils)}
          {numField("Lehrkräfte", "zählen wie Erwachsene", "teachers", teachers, setTeachers)}
        </div>
        <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0">
          {totalPersons} von max. {RULES.maxPersons} Personen
          {totalPersons > 0 && totalPersons < RULES.minOccupancyFloor && (
            <> · unter {RULES.minOccupancyFloor} Personen fällt ein Mindestbelegungs-Aufschlag an</>
          )}
        </p>
        <div className="flex items-start gap-2 rounded-xl bg-[var(--color-wh-sand)] border border-[var(--color-wh-winter-grey)] p-3 text-[12.5px] leading-relaxed text-[var(--color-wh-fg-muted)]">
          <Info size={15} className="text-[var(--color-wh-wood)] shrink-0 mt-0.5" />
          <span>
            Vereinsmitglieder (−50 %) gebt ihr später beim verbindlichen Buchen an — das Angebot
            rechnet ohne Rabatt, damit ihr auf der sicheren Seite seid.
          </span>
        </div>
      </fieldset>

      <div className="h-px bg-[var(--color-wh-winter-grey)]" />

      {/* 3 · Optional */}
      <fieldset className="space-y-4">
        <legend className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--color-wh-deep-green)]">
          3 · Für wen ist das Angebot? <span className="normal-case font-medium">(optional)</span>
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Anlass">
            <input
              name="purpose"
              type="text"
              maxLength={200}
              placeholder="z. B. Klassenfahrt 8b, Vereinswochenende"
              className={inputBase}
            />
          </Field>
          <Field label="Schule / Verein">
            <input
              name="institution"
              type="text"
              maxLength={200}
              placeholder="z. B. Gesamtschule Gütersloh"
              className={inputBase}
            />
          </Field>
        </div>
        <Field label="Ansprechpartner:in">
          <input
            name="contactName"
            type="text"
            maxLength={200}
            placeholder="z. B. Frau Sommer"
            className={inputBase}
          />
        </Field>
      </fieldset>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 m-0">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0 max-w-[280px]">
          Unverbindlich & kostenlos — es entsteht keine Reservierung.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 h-14 px-8 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] font-semibold text-[16px] disabled:opacity-60 hover:bg-[var(--color-wh-deep-green-hover)] transition-colors"
        >
          {pending ? "Wird erstellt …" : "Angebot erstellen"}
          {!pending && <ArrowRight size={19} />}
        </button>
      </div>
    </form>
  );
}
