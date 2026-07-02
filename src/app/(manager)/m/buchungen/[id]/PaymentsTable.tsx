"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { editPayment } from "./actions";

export type PaymentRow = {
  id: string;
  kind: string;
  method: string | null;
  status: string;
  amountCents: number;
  dateLabel: string;
};

const KINDS = [
  { value: "anzahlung", label: "Anzahlung" },
  { value: "restzahlung", label: "Restzahlung" },
  { value: "vollzahlung", label: "Vollzahlung" },
  { value: "kaution", label: "Kaution" },
  { value: "rueckerstattung", label: "Rückerstattung" },
] as const;

const STATUSES = [
  { value: "offen", label: "Offen" },
  { value: "erhalten", label: "Erhalten" },
  { value: "fehlgeschlagen", label: "Fehlgeschlagen" },
  { value: "erstattet", label: "Erstattet" },
] as const;

const label = (list: readonly { value: string; label: string }[], v: string) =>
  list.find((x) => x.value === v)?.label ?? v;

const eur = (c: number) =>
  (c / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

const inputCls =
  "w-full rounded-lg border border-[var(--color-wh-winter-grey)] bg-white px-3 py-2 text-sm focus:border-[var(--color-wh-deep-green)] focus:outline-none";

export function PaymentsTable({ rows }: { rows: PaymentRow[] }) {
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)]">
          <tr>
            <th className="py-2">Datum</th>
            <th>Art</th>
            <th>Methode</th>
            <th>Status</th>
            <th className="text-right">Betrag</th>
            <th className="w-8"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-[var(--color-wh-winter-grey)]">
              <td className="py-2">{p.dateLabel}</td>
              <td>{label(KINDS, p.kind)}</td>
              <td>{p.method ?? "—"}</td>
              <td>{label(STATUSES, p.status)}</td>
              <td className="text-right font-semibold">{eur(p.amountCents)}</td>
              <td className="text-right">
                <button
                  type="button"
                  onClick={() => setEditId(editId === p.id ? null : p.id)}
                  title="Zahlung korrigieren"
                  className="inline-flex w-8 h-8 items-center justify-center rounded-md border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)] cursor-pointer"
                >
                  <Pencil size={13} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editId && (
        <EditPaymentCard
          key={editId}
          row={rows.find((r) => r.id === editId)!}
          onClose={() => setEditId(null)}
        />
      )}
    </div>
  );
}

function EditPaymentCard({ row, onClose }: { row: PaymentRow; onClose: () => void }) {
  const router = useRouter();
  const [kind, setKind] = useState(row.kind);
  const [status, setStatus] = useState(row.status);
  const [amount, setAmount] = useState((row.amountCents / 100).toFixed(2).replace(".", ","));
  const [method, setMethod] = useState(row.method ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () => {
    setErr(null);
    const amt = parseFloat(amount.replace(",", "."));
    if (!amt || amt <= 0) {
      setErr("Bitte einen Betrag größer 0 angeben.");
      return;
    }
    if (!method.trim()) {
      setErr("Bitte eine Methode angeben.");
      return;
    }
    start(async () => {
      const r = await editPayment({
        paymentId: row.id,
        kind: kind as "anzahlung" | "restzahlung" | "vollzahlung" | "kaution" | "rueckerstattung",
        status: status as "offen" | "erhalten" | "fehlgeschlagen" | "erstattet",
        amountEuros: amt,
        method: method.trim(),
      });
      if (r.ok) {
        onClose();
        router.refresh();
      } else {
        setErr(r.error ?? "Fehler");
      }
    });
  };

  return (
    <div className="mt-4 rounded-xl border border-[var(--color-wh-deep-green)]/40 bg-[var(--color-wh-snow)] p-4">
      <div className="text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)] mb-3">
        Zahlung korrigieren
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs text-[var(--color-wh-fg-muted)] mb-1">Art</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls}>
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs text-[var(--color-wh-fg-muted)] mb-1">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs text-[var(--color-wh-fg-muted)] mb-1">Betrag (€)</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="block text-xs text-[var(--color-wh-fg-muted)] mb-1">Methode</span>
          <input
            type="text"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={inputCls}
          />
        </label>
      </div>

      <p className="text-[12px] text-[var(--color-wh-fg-muted)] mt-2">
        Nur erhaltene Einnahmen zählen zur Bezahlt-Summe — bei Statuswechsel wird sie automatisch angepasst.
      </p>
      {err && <p className="text-[13px] text-[#7a3a20] mt-2">{err}</p>}

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex items-center justify-center h-10 px-5 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold hover:bg-[var(--color-wh-green)] transition-colors cursor-pointer disabled:opacity-50"
        >
          {pending ? "Wird gespeichert …" : "Speichern"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center h-10 px-4 text-sm text-[var(--color-wh-fg-muted)] hover:text-[var(--color-wh-deep-green)] cursor-pointer"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
