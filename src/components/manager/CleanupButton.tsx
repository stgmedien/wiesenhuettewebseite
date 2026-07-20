"use client";

import { useState, useTransition } from "react";
import { deleteUnpaidRequests } from "@/app/(manager)/m/buchungen/actions";

export function CleanupButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<number | null>(null);

  function handleClick() {
    if (
      !window.confirm(
        "Alle stornierten Buchungen ohne Zahlung (Status: Storniert, 0 € bezahlt) werden unwiderruflich gelöscht. Fortfahren?"
      )
    )
      return;

    setResult(null);
    startTransition(async () => {
      const { deleted } = await deleteUnpaidRequests();
      setResult(deleted);
    });
  }

  return (
    <div className="flex items-center gap-3">
      {result !== null && (
        <span className="text-sm text-[var(--color-wh-fg-muted)]">
          {result} {result === 1 ? "Anfrage" : "Anfragen"} gelöscht.
        </span>
      )}
      <button
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex h-10 px-5 items-center justify-center rounded-[var(--radius-btn)] border border-[var(--color-wh-sunset)] text-[var(--color-wh-sunset)] bg-transparent text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-sunset)]/10 transition-colors disabled:opacity-50"
      >
        {isPending ? "Löschen…" : "Anfragen bereinigen"}
      </button>
    </div>
  );
}
