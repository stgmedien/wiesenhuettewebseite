"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldOff, ShieldCheck, X } from "lucide-react";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { holdDepositRefund, releaseDepositHold } from "./deposit-actions";

type Props = {
  bookingId: string;
  currentHold: boolean;
  reason: string | null;
  heldBy: string | null;
  heldAt: Date | string | null;
};

export function DepositHoldControl({
  bookingId,
  currentHold,
  reason,
  heldBy,
  heldAt,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submitHold = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (draft.trim().length < 5) {
      setError("Bitte einen Grund mit mindestens 5 Zeichen angeben.");
      return;
    }
    start(async () => {
      const res = await holdDepositRefund({ bookingId, reason: draft.trim() });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      setDraft("");
      router.refresh();
    });
  };

  const releaseHold = () => {
    if (!confirm("Hold aufheben? Die Kaution wird beim nächsten Cron-Lauf automatisch zurückgebucht.")) return;
    start(async () => {
      const res = await releaseDepositHold(bookingId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <>
      {currentHold ? (
        <div className="bg-[var(--color-wh-sunset)]/10 border border-[var(--color-wh-sunset)]/30 rounded-[var(--radius-md)] p-4 mt-3">
          <div className="flex items-start gap-3">
            <ShieldOff className="text-[var(--color-wh-sunset)] shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-sunset)]">
                Auto-Refund pausiert
              </div>
              {reason && (
                <p className="m-0 mt-2 text-sm text-[var(--color-wh-black)] leading-relaxed whitespace-pre-wrap">
                  {reason}
                </p>
              )}
              <div className="text-xs text-[var(--color-wh-fg-muted)] mt-2">
                {heldBy ? `Gesetzt von ${heldBy}` : ""}
                {heldAt
                  ? ` · ${new Date(heldAt).toLocaleString("de-DE", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}`
                  : ""}
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={releaseHold}
                className="inline-flex h-9 px-4 mt-3 items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-deep-green-hover)] disabled:opacity-50"
              >
                {pending ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                Hold aufheben
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setError(null);
            setDraft("");
          }}
          className="inline-flex h-9 px-4 mt-3 items-center gap-2 rounded-[var(--radius-btn)] bg-white border border-[var(--color-wh-sunset)] text-[var(--color-wh-sunset)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-sunset)]/10 transition-colors"
        >
          <ShieldOff size={14} />
          Auto-Refund stoppen
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <form
            onSubmit={submitHold}
            className="w-full max-w-[560px] bg-white rounded-[var(--radius-card)] shadow-[var(--shadow-deep)] max-h-[88vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-[var(--color-wh-winter-grey)]">
              <div className="flex items-center gap-2.5">
                <ShieldOff size={22} className="text-[var(--color-wh-sunset)]" />
                <h2 className="m-0 text-[20px]">Kaution-Refund stoppen</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Schließen"
                className="w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-[var(--color-wh-green-soft)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <p className="text-sm text-[var(--color-wh-fg-muted)] leading-relaxed m-0">
                Der automatische Cron bucht die Kaution 14 Tage nach Abreise zurück. Wenn Du das
                stoppen willst (z. B. wegen eines Schadens oder einer offenen Klärung), gib hier
                den Grund an. Der Bucher bekommt automatisch eine Mail mit genau diesem Grund —
                also bitte freundlich und konkret formulieren.
              </p>
              <Textarea
                id="reason"
                label="Grund (wird wortgleich an den Bucher gemailt)"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={6}
                placeholder="z. B. Bei der Abnahme wurde eine Glasscheibe in der Tür Aufenthaltsraum II gesprungen festgestellt. Wir haben einen Kostenvoranschlag eingeholt und melden uns innerhalb von 7 Tagen mit dem genauen Betrag."
                required
              />
              {error && (
                <div className="text-sm text-[var(--color-wh-sunset)] bg-[var(--color-wh-sunset)]/10 px-3 py-2 rounded-md">
                  {error}
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6 border-t border-[var(--color-wh-winter-grey)] flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={pending}
                iconLeft={
                  pending ? <Loader2 size={16} className="animate-spin" /> : <ShieldOff size={16} />
                }
              >
                {pending ? "Stoppe ..." : "Refund stoppen + Bucher informieren"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
