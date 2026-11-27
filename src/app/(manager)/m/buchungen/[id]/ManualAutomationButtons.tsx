"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmManualFinalPayment } from "./actions";
import { todayBerlinIso } from "@/lib/manual-final-payment";

const euro = (c: number) => (c / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
const deDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};

type Props = {
  bookingId: string;
  status: string;
  hasStripePaymentIntent: boolean;
  /** Fälligkeit der Restzahlung (YYYY-MM-DD): Anreise − 14 bzw. 30 Tage. */
  restDueIso: string;
  /** Noch offen: Rest-Miete + Kaution + Kurtaxe (Cent). */
  openCents: number;
  rentRemainderCents: number;
  kautionCents: number;
  kurtaxeCents: number;
  restAlreadyReceived: boolean;
  /** Cron hat den Stripe-Einzug schon ausgelöst → kein manuelles Verbuchen mehr. */
  autoChargeAttempted: boolean;
  /** Stripe-Einzug gescheitert → Kasten mit Verbuchen-Knopf zeigen. */
  autoChargeFailed: boolean;
};

/**
 * "Häkchen" für Buchungen ohne Stripe-Zahlungsvorgang (Banküberweisung):
 * verbucht Restzahlung + Kaution + Kurtaxe als erhalten — Pendant zum
 * T-14/T-30-Einzug im Cron.
 *
 * Erscheint erst ab Fälligkeit der Restzahlung (Dana 11/2026: direkt nach
 * der Anzahlung sah der Knopf so aus, als sei schon alles bezahlt). Vorher
 * nur ein Hinweis mit Fälligkeitsdatum — plus ein kleiner Link für den
 * Sonderfall, dass ein Gast früher überweist.
 *
 * Kartenbuchungen (Stripe): nur der Link, solange kein Einzug läuft oder
 * durch ist — für Gäste, die den Rest lieber selbst aufs Hüttenkonto
 * überweisen (Finn 11/2026). Nach einem gescheiterten Einzug direkt mit
 * Knopf. Verbucht Rest + Kaution + Kurtaxe, danach überspringt der Cron
 * den Einzug komplett.
 */
export function ManualAutomationButtons({
  bookingId,
  status,
  hasStripePaymentIntent,
  restDueIso,
  openCents,
  rentRemainderCents,
  kautionCents,
  kurtaxeCents,
  restAlreadyReceived,
  autoChargeAttempted,
  autoChargeFailed,
}: Props) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [early, setEarly] = useState(false);
  const [receivedOn, setReceivedOn] = useState(todayBerlinIso);
  const router = useRouter();

  const isDue = todayBerlinIso() >= restDueIso;
  const stripe = hasStripePaymentIntent;
  const relevant =
    status === "bezahlt" &&
    !restAlreadyReceived &&
    openCents > 0 &&
    (!stripe || !autoChargeAttempted);
  if (!relevant && !msg) return null;

  const showButton = stripe ? early || autoChargeFailed : isDue || early;

  const breakdown = [
    `${euro(rentRemainderCents)} Restzahlung`,
    kautionCents > 0 ? `${euro(kautionCents)} Kaution` : null,
    kurtaxeCents > 0 ? `${euro(kurtaxeCents)} Kurtaxe` : null,
  ]
    .filter(Boolean)
    .join(" + ");

  const confirmFinal = () => {
    if (!receivedOn) {
      setErr("Bitte das Datum der Überweisung angeben.");
      return;
    }
    if (
      !window.confirm(
        `${euro(openCents)} (${breakdown}) als per Überweisung erhalten verbuchen?\n\nEingegangen am ${deDate(receivedOn)}.`
      )
    )
      return;
    setErr(null);
    start(async () => {
      const r = await confirmManualFinalPayment(bookingId, receivedOn);
      if (r.ok) {
        setMsg(`Verbucht: ${euro(r.chargeCents)} — Buchung ist jetzt vollständig bezahlt.`);
        router.refresh();
      } else {
        setErr(r.error);
      }
    });
  };

  return (
    <div className="mt-4 rounded-xl border border-[#C9B8E8] bg-[#F2EEF9] p-4 space-y-3">
      <div className="text-xs uppercase tracking-wider font-semibold text-[#4A3B6B]">
        {stripe && autoChargeFailed
          ? "Automatischer Einzug fehlgeschlagen"
          : stripe
            ? "Restzahlung per Überweisung statt Einzug"
            : "Manuelle Buchung (Banküberweisung)"}
      </div>
      {msg ? (
        <p className="text-xs text-[#4A3B6B] m-0">{msg}</p>
      ) : !showButton ? (
        <div className="text-[13px] text-[#4A3B6B] space-y-1">
          <p className="m-0">
            {stripe ? (
              <>
                {isDue ? (
                  <>
                    Fällig seit <strong>{deDate(restDueIso)}</strong>, automatischer Einzug ist noch nicht gelaufen
                  </>
                ) : (
                  <>
                    Wird am <strong>{deDate(restDueIso)}</strong> automatisch eingezogen
                  </>
                )}
                : {euro(openCents)} ({breakdown}).
              </>
            ) : (
              <>
                Restzahlung fällig am <strong>{deDate(restDueIso)}</strong>: {euro(openCents)} ({breakdown}).
                Der Knopf zum Verbuchen erscheint dann.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => setEarly(true)}
            className="text-xs text-[#7B5EA7] underline cursor-pointer"
          >
            {stripe ? "Rest ist schon per Überweisung eingegangen?" : "Rest ist schon früher eingegangen?"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[13px] text-[#4A3B6B] m-0">
            Offen: <strong>{euro(openCents)}</strong> ({breakdown}) — fällig {isDue ? "seit" : "am"}{" "}
            {deDate(restDueIso)}.
            {stripe && autoChargeFailed
              ? " Der Einzug von der Karte bzw. dem Konto des Gastes hat nicht geklappt und wird nicht wiederholt. Wenn der Gast überwiesen hat, hier verbuchen."
              : stripe && " Nach dem Verbuchen wird nichts mehr automatisch eingezogen."}
          </p>
          <label className="block max-w-[220px]">
            <span className="block text-xs text-[#4A3B6B] mb-1">Überweisung eingegangen am</span>
            <input
              type="date"
              value={receivedOn}
              max={todayBerlinIso()}
              onChange={(e) => setReceivedOn(e.target.value)}
              className="w-full rounded-lg border border-[#C9B8E8] bg-white px-3 py-2 text-sm focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={confirmFinal}
            disabled={pending}
            className="inline-flex items-center h-9 px-4 rounded-[var(--radius-btn)] bg-[#7B5EA7] text-white text-sm font-semibold cursor-pointer hover:bg-[#6a4f92] disabled:opacity-50 transition-colors"
          >
            {pending ? "…" : `${euro(openCents)} als erhalten verbuchen`}
          </button>
          {err && <p className="text-xs text-[#7a3a20] m-0">{err}</p>}
        </div>
      )}
    </div>
  );
}
