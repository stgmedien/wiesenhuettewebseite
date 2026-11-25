"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendTransferRequestMail } from "./actions";

/** Kontodaten-Mail für Überweisungs-Buchungen (erneut) an den Gast schicken. */
export function TransferRequestMailButton({ bookingId }: { bookingId: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const send = () => {
    if (!window.confirm("Mail mit Kontodaten und Anzahlungsbetrag jetzt an den Gast schicken?")) return;
    setErr(null);
    start(async () => {
      const r = await sendTransferRequestMail(bookingId);
      if (r.ok) {
        setMsg(`Verschickt an ${r.to}.`);
        router.refresh();
      } else {
        setErr(r.error);
      }
    });
  };

  return (
    <div className="mt-4 rounded-xl border border-[#C9B8E8] bg-[#F2EEF9] p-4 space-y-2">
      <div className="text-xs uppercase tracking-wider font-semibold text-[#4A3B6B]">
        Überweisung offen
      </div>
      <p className="text-[13px] text-[#4A3B6B] m-0">
        Der Gast hat per Überweisung gebucht, die Anzahlung ist noch nicht verbucht. Die Mail mit den
        Kontodaten geht bei der Buchung automatisch raus. Hier kannst Du sie (erneut) schicken.
      </p>
      {msg ? (
        <p className="text-xs text-[#4A3B6B] m-0">{msg}</p>
      ) : (
        <button
          type="button"
          onClick={send}
          disabled={pending}
          className="inline-flex items-center h-9 px-4 rounded-[var(--radius-btn)] bg-[#7B5EA7] text-white text-sm font-semibold cursor-pointer hover:bg-[#6a4f92] disabled:opacity-50 transition-colors"
        >
          {pending ? "…" : "Kontodaten an Gast senden"}
        </button>
      )}
      {err && <p className="text-xs text-[#7a3a20] m-0">{err}</p>}
    </div>
  );
}
