"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordManualPayment } from "./actions";
import { MANUAL_REST_MARKER } from "@/lib/payment-markers";

const KINDS = [
  { value: "anzahlung", label: "Anzahlung" },
  { value: "restzahlung", label: "Restzahlung" },
  { value: "vollzahlung", label: "Vollzahlung" },
  { value: "kaution", label: "Kaution" },
] as const;

const inputCls =
  "w-full rounded-lg border border-[var(--color-wh-winter-grey)] bg-white px-3 py-2 text-sm focus:border-[var(--color-wh-deep-green)] focus:outline-none";

export function ManualPaymentForm({
  bookingId,
  bookingStatus,
}: {
  bookingId: string;
  bookingStatus: string;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Banküberweisung");
  const [kind, setKind] = useState<string>("anzahlung");
  const [altRest, setAltRest] = useState(false);
  const [confirmAndNotify, setConfirmAndNotify] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const canConfirmAndNotify =
    !altRest &&
    (kind === "anzahlung" || kind === "vollzahlung") &&
    (bookingStatus === "angefragt" || bookingStatus === "bestaetigt");

  const submit = () => {
    setErr(null);
    const amt = parseFloat(amount.replace(",", "."));
    if (!amt || amt <= 0) {
      setErr("Bitte einen Betrag größer 0 angeben.");
      return;
    }
    start(async () => {
      const r = await recordManualPayment({
        bookingId,
        amountEuros: amt,
        method: altRest ? MANUAL_REST_MARKER : method.trim() || "Manuell",
        kind: altRest ? "restzahlung" : (kind as "anzahlung" | "restzahlung" | "vollzahlung" | "kaution"),
        altsystemRest: altRest,
        confirmAndNotify: canConfirmAndNotify && confirmAndNotify,
      });
      if (r.ok) {
        setOpen(false);
        setAmount("");
        setAltRest(false);
        setConfirmAndNotify(false);
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
        className="mt-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-wh-deep-green)] hover:underline cursor-pointer"
      >
        + Zahlung manuell erfassen
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-[var(--color-wh-winter-grey)] bg-[var(--color-wh-snow)] p-4">
      <div className="text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)] mb-3">
        Zahlung manuell erfassen
      </div>

      <label className="flex items-start gap-2.5 mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={altRest}
          onChange={(e) => setAltRest(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[var(--color-wh-deep-green)]"
        />
        <span className="text-[13px] leading-snug text-[var(--color-wh-black)]">
          <strong>Altsystem-Restzahlung</strong> anlegen — offener Restbetrag, wird{" "}
          <em>14 Tage vor Anreise</em> automatisch per Stripe-Link angefordert. Zählt noch
          nicht zur Bezahlt-Summe.
        </span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="block text-xs text-[var(--color-wh-fg-muted)] mb-1">
            {altRest ? "Offener Restbetrag (€)" : "Betrag (€)"}
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100,00"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="block text-xs text-[var(--color-wh-fg-muted)] mb-1">Art</span>
          <select
            value={altRest ? "restzahlung" : kind}
            onChange={(e) => setKind(e.target.value)}
            disabled={altRest}
            className={`${inputCls} ${altRest ? "opacity-60" : ""}`}
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs text-[var(--color-wh-fg-muted)] mb-1">Methode</span>
          <input
            type="text"
            value={altRest ? MANUAL_REST_MARKER : method}
            onChange={(e) => setMethod(e.target.value)}
            readOnly={altRest}
            placeholder="Banküberweisung"
            className={`${inputCls} ${altRest ? "opacity-60" : ""}`}
          />
        </label>
      </div>

      {canConfirmAndNotify && (
        <label className="flex items-start gap-2.5 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmAndNotify}
            onChange={(e) => setConfirmAndNotify(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[var(--color-wh-deep-green)]"
          />
          <span className="text-[13px] leading-snug text-[var(--color-wh-black)]">
            <strong>Buchung bestätigen und Automatik auslösen</strong> — setzt die Buchung auf
            „Bezahlt", erstellt die Rechnung und verschickt Bestätigungsmail + Mietvertrag an den
            Gast sowie die Info-Mail mit Kalendereintrag an den Hüttenservice. Für Zahlungen per
            Überweisung direkt an den Verein (z. B. wenn der Gast keine Stripe-fähige
            Zahlungsmethode hat).
          </span>
        </label>
      )}

      {err && <p className="text-[13px] text-[#7a3a20] mt-2">{err}</p>}

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="inline-flex items-center justify-center h-10 px-5 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold hover:bg-[var(--color-wh-green)] transition-colors cursor-pointer disabled:opacity-50"
        >
          {pending
            ? "Wird gespeichert …"
            : canConfirmAndNotify && confirmAndNotify
              ? "Bestätigen & Mails senden"
              : "Zahlung speichern"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setErr(null);
          }}
          className="inline-flex items-center justify-center h-10 px-4 text-sm text-[var(--color-wh-fg-muted)] hover:text-[var(--color-wh-deep-green)] cursor-pointer"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
