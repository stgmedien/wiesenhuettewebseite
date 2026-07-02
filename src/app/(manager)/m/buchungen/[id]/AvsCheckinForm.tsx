"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Mail, Check } from "lucide-react";
import { sendAvsCheckinLink } from "./actions";

type Props = {
  bookingId: string;
  guestEmail: string;
  /** Formatiertes Datum des letzten Versands — null, wenn noch nie verschickt. */
  lastSentAt: string | null;
};

const inputCls =
  "w-full rounded-lg border border-[var(--color-wh-winter-grey)] bg-white px-3 py-2 text-sm font-mono focus:border-[var(--color-wh-deep-green)] focus:outline-none";

export function AvsCheckinForm({ bookingId, guestEmail, lastSentAt }: Props) {
  const [link, setLink] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const submit = () => {
    setError(null);
    start(async () => {
      const res = await sendAvsCheckinLink({ bookingId, link });
      if (res.ok) {
        setSentTo(res.sentTo);
        setLink("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div>
      {lastSentAt || sentTo ? (
        <p className="text-sm text-emerald-700 flex items-center gap-1.5 mb-3">
          <Check size={14} />
          {sentTo
            ? `Check-in-Link gerade an ${sentTo} verschickt.`
            : `Check-in-Link verschickt am ${lastSentAt}.`}
        </p>
      ) : (
        <p className="text-sm text-[var(--color-wh-sunset)] font-medium mb-3">
          Noch kein Check-in-Link verschickt.
        </p>
      )}

      <ol className="text-xs text-[var(--color-wh-fg-muted)] space-y-1 mb-3 list-decimal list-inside">
        <li>
          Im{" "}
          <a
            href="https://meldeschein.avs.de"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--color-wh-deep-green)] inline-flex items-center gap-0.5"
          >
            AVS-Portal <ExternalLink size={11} />
          </a>{" "}
          → Menü „Link-Generator" → E-Mail <span className="font-mono">{guestEmail}</span>{" "}
          eintragen → „Link generieren".
        </li>
        <li>Erzeugten SelfCheck-in-Link kopieren und hier einfügen — wir mailen ihn dem Gast.</li>
      </ol>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://meldeschein.avs.de/…"
          className={inputCls}
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending || link.trim().length < 10}
          className="inline-flex shrink-0 items-center justify-center gap-2 h-10 px-4 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-deep-green-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
          {lastSentAt || sentTo ? "Erneut senden" : "An Gast senden"}
        </button>
      </div>

      {error && <p className="text-[13px] text-[#7a3a20] mt-2">{error}</p>}
    </div>
  );
}
