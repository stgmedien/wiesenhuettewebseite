"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmManualFinalPayment, confirmManualDepositReturn } from "./actions";

const euro = (c: number) => (c / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

type Props = {
  bookingId: string;
  status: string;
  hasStripePaymentIntent: boolean;
  depositCents: number;
  hasRefund: boolean;
};

/**
 * Zwei "Häkchen" für Buchungen ohne Stripe-Zahlungsvorgang (Banküberweisung,
 * z. B. Alt-Verträge oder Vereine ohne Kartenzahlung): stoßen dieselbe
 * Buchführung/Mail-Automatik an, die sonst der T-14- bzw. Kaution-
 * Rückerstattungs-Cron übernehmen würde. Erscheinen bewusst nur, wenn kein
 * Stripe-Zahlungsvorgang vorhanden ist — sonst läuft die Automatik ohnehin.
 */
export function ManualAutomationButtons({
  bookingId,
  status,
  hasStripePaymentIntent,
  depositCents,
  hasRefund,
}: Props) {
  const [pendingFinal, startFinal] = useTransition();
  const [pendingRefund, startRefund] = useTransition();
  const [finalMsg, setFinalMsg] = useState<string | null>(null);
  const [finalErr, setFinalErr] = useState<string | null>(null);
  const [refundMsg, setRefundMsg] = useState<string | null>(null);
  const [refundErr, setRefundErr] = useState<string | null>(null);
  const router = useRouter();

  const showFinal = status === "bezahlt" && !hasStripePaymentIntent && !finalMsg;
  const showRefund = status === "abgereist" && depositCents > 0 && !hasStripePaymentIntent && !hasRefund && !refundMsg;

  if (!showFinal && !showRefund) return null;

  const confirmFinal = () => {
    if (!window.confirm("Restzahlung + Kaution + Kurtaxe als per Überweisung erhalten bestätigen?")) return;
    setFinalErr(null);
    startFinal(async () => {
      const r = await confirmManualFinalPayment(bookingId);
      if (r.ok) {
        setFinalMsg(`Bestätigt: ${euro(r.chargeCents)} erfasst.`);
        router.refresh();
      } else {
        setFinalErr(r.error);
      }
    });
  };

  const confirmRefund = () => {
    if (
      !window.confirm(
        `Kaution (${euro(depositCents)}) als manuell zurücküberwiesen bestätigen? Verschickt die "Kaution zurück"-Mail mit Rechnung als PDF.`
      )
    )
      return;
    setRefundErr(null);
    startRefund(async () => {
      const r = await confirmManualDepositReturn(bookingId);
      if (r.ok) {
        setRefundMsg("Bestätigt — Mail mit Rechnung verschickt.");
        router.refresh();
      } else {
        setRefundErr(r.error);
      }
    });
  };

  return (
    <div className="mt-4 rounded-xl border border-[#C9B8E8] bg-[#F2EEF9] p-4 space-y-3">
      <div className="text-xs uppercase tracking-wider font-semibold text-[#4A3B6B]">
        Manuelle Buchung (Banküberweisung)
      </div>
      {showFinal && (
        <div>
          <button
            type="button"
            onClick={confirmFinal}
            disabled={pendingFinal}
            className="inline-flex items-center h-9 px-4 rounded-[var(--radius-btn)] bg-[#7B5EA7] text-white text-sm font-semibold cursor-pointer hover:bg-[#6a4f92] disabled:opacity-50 transition-colors"
          >
            {pendingFinal ? "…" : "Restzahlung + Kaution + Kurtaxe per Überweisung erhalten"}
          </button>
          {finalErr && <p className="text-xs text-[#7a3a20] mt-1">{finalErr}</p>}
        </div>
      )}
      {showRefund && (
        <div>
          <button
            type="button"
            onClick={confirmRefund}
            disabled={pendingRefund}
            className="inline-flex items-center h-9 px-4 rounded-[var(--radius-btn)] bg-[#7B5EA7] text-white text-sm font-semibold cursor-pointer hover:bg-[#6a4f92] disabled:opacity-50 transition-colors"
          >
            {pendingRefund ? "…" : `Kaution (${euro(depositCents)}) manuell zurücküberwiesen`}
          </button>
          {refundErr && <p className="text-xs text-[#7a3a20] mt-1">{refundErr}</p>}
        </div>
      )}
      {finalMsg && <p className="text-xs text-[#4A3B6B] m-0">{finalMsg}</p>}
      {refundMsg && <p className="text-xs text-[#4A3B6B] m-0">{refundMsg}</p>}
    </div>
  );
}
