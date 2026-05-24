"use client";

import { useState, useTransition } from "react";
import { reviewApproveBooking, reviewRejectBooking } from "./actions";

type Props = {
  bookingId: string;
  bookingNumber: string;
  purposeRaw: string | null;
};

export function ReviewActions({ bookingId, bookingNumber, purposeRaw }: Props) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"idle" | "rejecting">("idle");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  const handleApprove = () => {
    if (!confirm(`Buchung ${bookingNumber} freigeben? Der Gast bekommt eine Mail mit dem Zahlungslink für die Anzahlung.`)) return;
    setError(null);
    startTransition(async () => {
      const r = await reviewApproveBooking(bookingId);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setDoneMsg("Buchung freigegeben — Zahlungslink wurde versendet.");
    });
  };

  const handleReject = () => {
    if (!confirm(`Buchung ${bookingNumber} ablehnen? Die Tage werden freigegeben und der Gast bekommt eine Absage-Mail.`)) return;
    setError(null);
    startTransition(async () => {
      const r = await reviewRejectBooking(bookingId, reason.trim() || undefined);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setDoneMsg("Buchung abgelehnt — Tage sind wieder frei.");
    });
  };

  if (doneMsg) {
    return (
      <div className="mt-6 rounded-[var(--radius-md)] bg-[var(--color-wh-green-soft)] border border-[var(--color-wh-green)] px-4 py-3 text-[var(--color-wh-deep-green)]">
        ✓ {doneMsg}
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-[var(--radius-card)] border-l-4 border-[var(--color-wh-sunset)] bg-[var(--color-wh-beige)] px-5 py-4">
      <p className="text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-sunset)] m-0">
        ⚠ Vorstands-Prüfung ausstehend
      </p>
      <h3 className="font-display text-[22px] font-bold m-0 mt-1 text-[var(--color-wh-deep-green)]">
        Private-Feier-Anfrage
      </h3>
      {purposeRaw && (
        <p className="mt-2 mb-0 text-[15px] leading-relaxed text-[var(--color-wh-black)]">
          {purposeRaw}
        </p>
      )}
      <p className="mt-3 mb-0 text-[13px] text-[var(--color-wh-fg-muted)] italic">
        Es wurde noch keine Zahlung ausgelöst. Erst nach „Freigeben" bekommt der Gast den Stripe-Zahlungslink.
      </p>

      {mode === "rejecting" && (
        <div className="mt-4">
          <label className="text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-deep-green)] block mb-1">
            Grund (optional, wird dem Gast in der Absage-Mail mitgeteilt)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="z. B. Termin überschneidet sich mit Vereinsfahrt …"
            className="w-full min-h-[80px] rounded-[var(--radius-md)] border border-[var(--color-wh-winter-grey)] bg-white px-3 py-2 text-sm"
          />
        </div>
      )}

      {error && (
        <p className="mt-3 mb-0 text-sm text-[var(--color-wh-sunset)] font-medium">⚠ {error}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {mode === "idle" ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={handleApprove}
              className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {pending ? "…" : "✓ Freigeben (Zahlungslink senden)"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setMode("rejecting")}
              className="rounded-full border-2 border-[var(--color-wh-sunset)] text-[var(--color-wh-sunset)] px-5 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Ablehnen
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={handleReject}
              className="rounded-full bg-[var(--color-wh-sunset)] text-white px-5 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {pending ? "…" : "Absage abschicken"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setMode("idle")}
              className="rounded-full border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-fg-muted)] px-5 py-2 text-sm"
            >
              Abbrechen
            </button>
          </>
        )}
      </div>
    </div>
  );
}
