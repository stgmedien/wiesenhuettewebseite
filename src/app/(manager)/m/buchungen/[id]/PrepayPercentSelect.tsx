"use client";

import { useState, useTransition } from "react";
import { setPrepayPercent } from "./notes-actions";

// Anzahlungsquote einer Buchung umstellen (z. B. 10 % statt 50 %). Wirkt auf
// den in der Buchungsbestätigung ausgewiesenen Anzahlungsbetrag.
export function PrepayPercentSelect({
  bookingId,
  current,
  options,
}: {
  bookingId: string;
  current: number;
  options: readonly number[];
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const change = (value: string) => {
    setError(null);
    start(async () => {
      const r = await setPrepayPercent(bookingId, Number(value));
      if (!r.ok) setError(r.error);
    });
  };

  return (
    <>
      <select
        aria-label="Anzahlungsquote"
        value={String(current)}
        disabled={pending}
        onChange={(e) => change(e.target.value)}
        className="h-8 px-2 rounded-[var(--radius-md)] border border-[var(--color-wh-winter-grey)] bg-white text-sm disabled:opacity-50"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}&nbsp;%
          </option>
        ))}
      </select>
      {error && <span className="text-[13px] text-[#7a3a20]">{error}</span>}
    </>
  );
}
