"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setBookingStatus } from "./actions";
import { Button } from "@/components/ui/Button";

const STATUSES = [
  { value: "angefragt", label: "Angefragt" },
  { value: "bestaetigt", label: "Bestätigt" },
  { value: "bezahlt", label: "Bezahlt" },
  { value: "angereist", label: "Angereist" },
  { value: "abgereist", label: "Abgereist" },
  { value: "storniert", label: "Storniert" },
] as const;

export function StatusActions({
  bookingId,
  currentStatus,
}: {
  bookingId: string;
  currentStatus: string;
}) {
  const [pending, startTransition] = useTransition();
  const [notify, setNotify] = useState(false);
  const router = useRouter();

  const change = (next: string) => {
    if (next === currentStatus) return;
    startTransition(async () => {
      await setBookingStatus(bookingId, next, notify);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)]">
        Status setzen
      </div>
      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            disabled={pending || s.value === currentStatus}
            onClick={() => change(s.value)}
            className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-[var(--radius-pill)] border cursor-pointer transition-colors ${
              s.value === currentStatus
                ? "bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] border-[var(--color-wh-deep-green)]"
                : "bg-white border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] hover:border-[var(--color-wh-deep-green)]"
            } ${pending ? "opacity-50" : ""}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs text-[var(--color-wh-fg-muted)] cursor-pointer mt-1 max-w-[230px] text-right">
        <input
          type="checkbox"
          checked={notify}
          onChange={(e) => setNotify(e.target.checked)}
          className="accent-[var(--color-wh-deep-green)] shrink-0"
        />
        <span>Gast per Mail benachrichtigen (bei „Bestätigt"/„Storniert")</span>
      </label>
    </div>
  );
}
