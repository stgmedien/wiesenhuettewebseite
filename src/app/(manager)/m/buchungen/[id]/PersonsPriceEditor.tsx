"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { editBookingPersons, refundBookingDifference } from "./actions";

// Lehrkräfte zählen einfach als Erwachsene (gleicher Preis) — kein eigenes
// Feld mehr. Ein evtl. vorhandener teachers-Bestand aus einer älteren
// Buchung wird beim Öffnen einmalig in "adults" mit eingerechnet.
type P = { adults: number; members: number; children: number; pupils: number };

const FIELDS: { key: keyof P; label: string }[] = [
  { key: "members", label: "Mitglieder (Erw., −50 %)" },
  { key: "adults", label: "Erwachsene (inkl. Lehrkräfte)" },
  { key: "children", label: "Kinder (4–15)" },
  { key: "pupils", label: "Kinder/Sch. bis 16 (Mitgl., −50 %)" },
];

const euro = (cents: number) =>
  (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export function PersonsPriceEditor({ bookingId, initial }: { bookingId: string; initial: P }) {
  const [open, setOpen] = useState(false);
  const [p, setP] = useState<P>(initial);
  const [res, setRes] = useState<{
    deltaCents: number;
    newSubtotalCents: number;
    refundableCents: number;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const set = (k: keyof P, v: string) =>
    setP((s) => ({ ...s, [k]: Math.max(0, Math.min(60, parseInt(v || "0", 10) || 0)) }));

  const save = () => {
    setErr(null);
    setMsg(null);
    setRes(null);
    start(async () => {
      const r = await editBookingPersons({ bookingId, ...p, teachers: 0 });
      if (r.ok) {
        setRes({
          deltaCents: r.deltaCents,
          newSubtotalCents: r.newSubtotalCents,
          refundableCents: r.refundableCents,
        });
        router.refresh();
      } else {
        setErr(r.error);
      }
    });
  };

  const refund = () => {
    if (!res || res.refundableCents <= 0) return;
    setErr(null);
    start(async () => {
      const r = await refundBookingDifference(bookingId, res.refundableCents);
      if (r.ok) {
        setMsg(`Erstattung über ${euro(res.refundableCents)} ausgelöst (Verbuchung folgt automatisch).`);
        setRes((s) => (s ? { ...s, refundableCents: 0 } : s));
        router.refresh();
      } else {
        setErr(r.error);
      }
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-wh-deep-green)] hover:underline cursor-pointer"
      >
        Personen anpassen (Vorstand)
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-[var(--color-wh-winter-grey)] bg-[var(--color-wh-snow)] p-4">
      <div className="text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)] mb-1">
        Personen anpassen
      </div>
      <p className="text-[11px] text-[var(--color-wh-fg-muted)] leading-snug mb-3 m-0">
        Der Mitglieder-Tarif (−50 %) gilt nur für tatsächliche Vereinsmitglieder — nicht für die
        ganze Gruppe. Übernachtung &amp; personenabhängige Aufschläge werden neu berechnet; Extras,
        Rabatte und Kaution bleiben unverändert.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="block text-[11px] text-[var(--color-wh-fg-muted)] mb-1 leading-tight">
              {f.label}
            </span>
            <input
              type="number"
              min={0}
              max={60}
              value={p[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] bg-white px-2 py-1.5 text-sm focus:border-[var(--color-wh-deep-green)] focus:outline-none"
            />
          </label>
        ))}
      </div>

      {err && <p className="text-[13px] text-[#7a3a20] mt-2">{err}</p>}
      {msg && <p className="text-[13px] text-[var(--color-wh-deep-green)] font-semibold mt-2">{msg}</p>}

      {res && (
        <div className="mt-3 rounded-lg bg-white border border-[var(--color-wh-winter-grey)] p-3 text-sm">
          <div className="flex justify-between">
            <span>Neue Zwischensumme</span>
            <span className="font-semibold">{euro(res.newSubtotalCents)}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Differenz</span>
            <span
              className={`font-semibold ${
                res.deltaCents < 0
                  ? "text-[var(--color-wh-deep-green)]"
                  : res.deltaCents > 0
                    ? "text-[var(--color-wh-sunset)]"
                    : ""
              }`}
            >
              {res.deltaCents >= 0 ? "+" : ""}
              {euro(res.deltaCents)}
            </span>
          </div>

          {res.deltaCents < 0 && res.refundableCents > 0 && (
            <button
              type="button"
              onClick={refund}
              disabled={pending}
              className="mt-3 w-full inline-flex items-center justify-center h-10 px-4 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold hover:bg-[var(--color-wh-green)] transition-colors cursor-pointer disabled:opacity-50"
            >
              {pending ? "…" : `Differenz erstatten (${euro(res.refundableCents)} via Stripe)`}
            </button>
          )}
          {res.deltaCents < 0 && res.refundableCents === 0 && (
            <p className="text-[12px] text-[var(--color-wh-fg-muted)] mt-2 m-0">
              Keine Stripe-Zahlung verknüpft — Differenz bitte manuell (Überweisung) erstatten.
            </p>
          )}
          {res.deltaCents > 0 && (
            <p className="text-[12px] text-[var(--color-wh-fg-muted)] mt-2 m-0">
              Mehrbetrag {euro(res.deltaCents)} — über „Nachricht + Zahlungslink" nachfordern.
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex items-center justify-center h-10 px-5 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold hover:bg-[var(--color-wh-green)] transition-colors cursor-pointer disabled:opacity-50"
        >
          {pending ? "Wird berechnet …" : "Berechnen & speichern"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setErr(null);
            setMsg(null);
            setRes(null);
            setP(initial);
          }}
          className="inline-flex items-center justify-center h-10 px-4 text-sm text-[var(--color-wh-fg-muted)] hover:text-[var(--color-wh-deep-green)] cursor-pointer"
        >
          Schließen
        </button>
      </div>
    </div>
  );
}
