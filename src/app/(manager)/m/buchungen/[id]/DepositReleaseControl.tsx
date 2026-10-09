"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { parseEuroInput } from "@/lib/utils";
import { confirmManualDepositReturn } from "./actions";
import {
  releaseDepositForRefund,
  withdrawDepositRelease,
  markDepositReleaseTransferred,
} from "./deposit-release-actions";

const euro = (c: number) => (c / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
const euroInput = (c: number) => (c / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 });

type Props = {
  bookingId: string;
  status: string;
  hasStripePaymentIntent: boolean;
  depositCents: number;
  paidCents: number;
  /** Offene Freigabe (Auftrag an die Finanzen ist raus, Überweisung noch nicht bestätigt). */
  openRelease: { amountCents: number; releasedAtLabel: string } | null;
  /** Es gibt bereits eine (andere) Rückerstattungs-Zeile — nichts mehr zu tun. */
  hasOtherRefund: boolean;
};

const btn =
  "inline-flex items-center h-9 px-4 rounded-[var(--radius-btn)] bg-[#7B5EA7] text-white text-sm font-semibold cursor-pointer hover:bg-[#6a4f92] disabled:opacity-50 transition-colors";
const linkBtn = "text-xs underline text-[#4A3B6B] cursor-pointer disabled:opacity-50 bg-transparent border-0 p-0";
const inputCls =
  "w-full rounded-lg border border-[#C9B8E8] bg-white px-3 py-2 text-sm focus:border-[#7B5EA7] focus:outline-none";

/**
 * Kautions-Rückzahlung bei Überweisern: erst Freigabe (Auftragsmail an die
 * Vereinsfinanzen), verbucht wird erst, wenn die Überweisung bestätigt ist.
 * Bei Kartenbuchungen unsichtbar — dort erstattet der Cron über Stripe.
 */
export function DepositReleaseControl({
  bookingId,
  status,
  hasStripePaymentIntent,
  depositCents,
  paidCents,
  openRelease,
  hasOtherRefund,
}: Props) {
  const [amount, setAmount] = useState(euroInput(depositCents));
  const [note, setNote] = useState("");
  const [inspected, setInspected] = useState(false);
  const [askDirect, setAskDirect] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (status !== "abgereist" || hasStripePaymentIntent || depositCents <= 0) return null;
  if (hasOtherRefund && !msg) return null;

  const run = (fn: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>) => {
    setErr(null);
    setMsg(null);
    start(async () => {
      const r = await fn();
      if (r.ok) {
        setMsg(r.message);
        router.refresh();
      } else {
        setErr(r.error);
      }
    });
  };

  const release = () => {
    const amt = parseEuroInput(amount);
    if (!amt || amt <= 0) {
      setErr("Bitte einen gültigen Betrag angeben, z. B. 300,00.");
      return;
    }
    if (!inspected) {
      setErr("Bitte erst bestätigen, dass die Hütte abgenommen ist.");
      return;
    }
    run(() =>
      releaseDepositForRefund({
        bookingId,
        amountCents: Math.round(amt * 100),
        inspected: true,
        note: note.trim() || undefined,
      })
    );
  };

  const direct = () =>
    run(async () => {
      const r = await confirmManualDepositReturn(bookingId);
      return r.ok ? { ok: true, message: "Verbucht — Mail mit Rechnung verschickt." } : r;
    });

  return (
    <div className="mt-4 rounded-xl border border-[#C9B8E8] bg-[#F2EEF9] p-4 space-y-3">
      <div className="text-xs uppercase tracking-wider font-semibold text-[#4A3B6B]">
        Kaution zurückzahlen (Banküberweisung)
      </div>

      {openRelease ? (
        <>
          <p className="text-sm text-[#2b2140] m-0">
            <strong>{euro(openRelease.amountCents)}</strong> freigegeben am {openRelease.releasedAtLabel} —
            wartet auf die Überweisung durch die Finanzen. Der Gast bekommt seine Mail erst, wenn
            die Überweisung bestätigt ist.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              className={btn}
              disabled={pending}
              onClick={() => run(() => markDepositReleaseTransferred(bookingId))}
            >
              {pending ? "…" : "Überweisung ist raus — verbuchen"}
            </button>
            <button
              type="button"
              className={linkBtn}
              disabled={pending}
              onClick={() => run(() => withdrawDepositRelease(bookingId))}
            >
              Freigabe zurückziehen
            </button>
          </div>
        </>
      ) : hasOtherRefund ? null : (
        <>
          <p className="text-sm text-[#2b2140] m-0">
            Die Freigabe schickt den Finanzen einen Auftrag mit Betrag, Empfänger und
            Verwendungszweck. Verbucht wird erst, wenn die Überweisung bestätigt ist.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
            <label className="text-xs text-[#4A3B6B]">
              Betrag in €
              <input
                className={inputCls}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label className="text-xs text-[#4A3B6B]">
              Hinweis für die Finanzen (optional)
              <input
                className={inputCls}
                maxLength={300}
                placeholder="z. B. inkl. 1,37 € Überzahlung"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
          </div>
          <p className="text-xs text-[#4A3B6B] m-0">
            Kaution laut Buchung: {euro(depositCents)} · vom Gast bezahlt: {euro(paidCents)}. Bei
            Abzügen wegen Schäden weniger, bei Überzahlung mehr eintragen.
          </p>
          <label className="flex items-start gap-2 text-sm text-[#2b2140] cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={inspected}
              onChange={(e) => setInspected(e.target.checked)}
            />
            Hütte ist abgenommen, der Betrag kann zurücküberwiesen werden.
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className={btn} disabled={pending} onClick={release}>
              {pending ? "…" : "Kaution zur Rückzahlung freigeben"}
            </button>
            {!askDirect ? (
              <button type="button" className={linkBtn} disabled={pending} onClick={() => setAskDirect(true)}>
                Schon überwiesen? Direkt verbuchen
              </button>
            ) : (
              <span className="text-xs text-[#4A3B6B]">
                {euro(depositCents)} ohne Auftrag als zurücküberwiesen verbuchen und Gast-Mail schicken?{" "}
                <button type="button" className={linkBtn} disabled={pending} onClick={direct}>
                  Ja, verbuchen
                </button>{" "}
                ·{" "}
                <button type="button" className={linkBtn} disabled={pending} onClick={() => setAskDirect(false)}>
                  Abbrechen
                </button>
              </span>
            )}
          </div>
        </>
      )}

      {err && <p className="text-xs text-[#7a3a20] m-0">{err}</p>}
      {msg && <p className="text-xs text-[#4A3B6B] m-0">{msg}</p>}
    </div>
  );
}
