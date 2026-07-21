"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { resendGuestMails } from "./notes-actions";

export function ResendMailsButton({ bookingId }: { bookingId: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = () => {
    setResult(null);
    start(async () => {
      const r = await resendGuestMails(bookingId);
      if (r.ok) {
        setResult({ ok: true, text: `Gesendet: ${r.sent.join(", ")}` });
      } else {
        setResult({ ok: false, text: r.error });
      }
    });
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-wh-deep-green)] hover:underline cursor-pointer disabled:opacity-50"
      >
        <RefreshCw size={12} className={pending ? "animate-spin" : ""} />
        {pending ? "Wird gesendet …" : "Buchungsbestätigung + Mietvertrag erneut senden"}
      </button>
      {result && (
        <p
          className={`text-[13px] mt-1.5 ${result.ok ? "text-[var(--color-wh-deep-green)]" : "text-[#7a3a20]"}`}
        >
          {result.text}
        </p>
      )}
    </div>
  );
}
