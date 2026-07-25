"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { previewBookingExtension, submitBookingExtension, type ExtensionPreview } from "./actions";

type Props = {
  bookingId: string;
  departureLabel: string;
  deadlineLabel: string;
};

const eur = (c: number) => (c / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export function ExtendStayForm({ bookingId, departureLabel, deadlineLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [extraNights, setExtraNights] = useState(1);
  const [preview, setPreview] = useState<ExtensionPreview | null>(null);
  const [done, setDone] = useState<{ newDeparture: string; deltaCents: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const update = (value: number) => {
    const next = Math.max(1, Math.min(value, 14));
    setExtraNights(next);
    setError(null);
    start(async () => {
      setPreview(await previewBookingExtension({ bookingId, extraNights: next }));
    });
  };

  const submit = () => {
    setError(null);
    start(async () => {
      const res = await submitBookingExtension({ bookingId, extraNights });
      if (res.ok) {
        setDone({ newDeparture: res.calc.newDeparture, deltaCents: res.calc.deltaCents });
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  if (done) {
    return (
      <section className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 mb-6">
        <h2 className="font-heading text-xl text-emerald-900 mb-2">✓ Verlängerung übernommen</h2>
        <p className="text-sm text-emerald-900">
          Eure neue Abreise ist jetzt der <strong>{done.newDeparture}</strong>. Der Mehrbetrag von{" "}
          <strong>{eur(done.deltaCents)}</strong> wird automatisch mit der Restzahlung fällig — Ihr
          bekommt gerade eine Bestätigung per E-Mail.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-[var(--color-wh-beige)] border-l-4 border-[var(--color-wh-deep-green)] p-6 mb-6">
      <h2 className="font-heading text-xl text-[var(--color-wh-deep-green)] mb-1">
        Aufenthalt verlängern?
      </h2>
      <p className="text-sm text-[var(--color-wh-black)]/80 mb-4">
        Bis zum <strong>{deadlineLabel}</strong> könnt Ihr Eure Abreise (aktuell {departureLabel})
        online nach hinten verschieben — vorbehaltlich freier Termine. Der Mehrbetrag wird
        automatisch mit der Restzahlung fällig; keine neue Kaution oder Endreinigung.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-6 py-3 text-sm font-semibold cursor-pointer hover:opacity-90"
        >
          + Aufenthalt verlängern
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-white border border-[var(--color-wh-winter-grey)]/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--color-wh-black)]">Zusätzliche Nächte</p>
              <p className="text-xs text-[var(--color-wh-black)]/60">nach der aktuellen Abreise</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => update(extraNights - 1)}
                disabled={extraNights <= 1}
                aria-label="weniger Nächte"
                className="w-9 h-9 rounded-full border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] font-bold cursor-pointer hover:bg-[var(--color-wh-beige)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                −
              </button>
              <span className="w-8 text-center font-mono text-sm">{extraNights}</span>
              <button
                type="button"
                onClick={() => update(extraNights + 1)}
                disabled={extraNights >= 14}
                aria-label="mehr Nächte"
                className="w-9 h-9 rounded-full border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] font-bold cursor-pointer hover:bg-[var(--color-wh-beige)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>

          {preview?.ok && (
            <div className="rounded-xl bg-white border border-[var(--color-wh-winter-grey)]/50 p-4 text-sm">
              <p>
                Neue Abreise: <strong>{preview.calc.newDeparture}</strong> · Mehrbetrag{" "}
                <strong>{eur(preview.calc.deltaCents)}</strong>
              </p>
              <p className="text-xs text-[var(--color-wh-black)]/60 mt-1">
                Davon{" "}
                {eur(preview.calc.accommodationDeltaCents + preview.calc.minOccupancySurchargeDeltaCents)}{" "}
                Übernachtung (zum aktuell gültigen Tarif — auch bei individuell vereinbarten
                Preisen gilt das nur für die bereits gebuchten Nächte) und{" "}
                {eur(preview.calc.kurtaxeDeltaCents)} Kurtaxe. Wird automatisch mit der
                Restzahlung eingezogen — keine separate Zahlung nötig.
              </p>
            </div>
          )}
          {preview && !preview.ok && <p className="text-sm text-red-700">{preview.error}</p>}
          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={submit}
              disabled={pending || !preview?.ok}
              className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-6 py-3 text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? "Wird gespeichert …" : `Verbindlich verlängern (+${extraNights})`}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setExtraNights(1);
                setPreview(null);
                setError(null);
              }}
              className="text-sm text-[var(--color-wh-black)]/60 hover:text-[var(--color-wh-deep-green)] cursor-pointer"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
