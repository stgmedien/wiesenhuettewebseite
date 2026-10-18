"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMeterReading } from "./actions";

export function DeleteReadingButton({ id }: { id: string }) {
  const [ask, setAsk] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const cls = "text-xs underline cursor-pointer bg-transparent border-0 p-0 text-[var(--color-wh-fg-muted)] disabled:opacity-50";
  if (!ask) {
    return (
      <button type="button" className={cls} onClick={() => setAsk(true)}>
        löschen
      </button>
    );
  }
  return (
    <span className="text-xs whitespace-nowrap">
      <button
        type="button"
        className={cls + " text-[#7a3a20]"}
        disabled={pending}
        onClick={() =>
          start(async () => {
            await deleteMeterReading(id);
            router.refresh();
          })
        }
      >
        ja, löschen
      </button>{" "}
      ·{" "}
      <button type="button" className={cls} onClick={() => setAsk(false)}>
        nein
      </button>
    </span>
  );
}
