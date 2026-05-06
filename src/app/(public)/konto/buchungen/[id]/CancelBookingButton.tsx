"use client";

import { useState, useTransition } from "react";
import { cancelOwnBooking } from "./actions";
import { formatEuro } from "@/lib/pricing";

type Props = {
  bookingId: string;
  bookingNumber: string;
  feePercent: number;
  feeCents: number;
  subtotalCents: number;
};

export function CancelBookingButton({
  bookingId,
  bookingNumber,
  feePercent,
  feeCents,
  subtotalCents,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await cancelOwnBooking(formData);
      if (!res.ok) setError(res.error ?? "Stornierung fehlgeschlagen.");
      else setOpen(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-red-300 text-red-700 px-5 py-2.5 text-sm font-semibold hover:bg-red-50"
      >
        Stornieren
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-heading text-xl text-[var(--color-wh-deep-green)] mb-2">
              Buchung stornieren?
            </h3>
            <p className="text-sm text-[var(--color-wh-black)] mb-4">
              Buchung <strong>{bookingNumber}</strong> wird storniert. Bei Stornierung jetzt fällt
              eine Gebühr von{" "}
              <strong>
                {feePercent}% = {formatEuro(feeCents)}
              </strong>{" "}
              an. Du bekommst <strong>{formatEuro(subtotalCents - feeCents)}</strong> + die volle
              Kaution erstattet.
            </p>

            <form action={submit} className="space-y-3">
              <input type="hidden" name="id" value={bookingId} />
              <textarea
                name="reason"
                rows={3}
                placeholder="Grund (optional, hilft uns)"
                className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm"
              />
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
                  {error}
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="px-4 py-2 rounded-full text-sm border border-[var(--color-wh-winter-grey)]"
                >
                  Doch nicht
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-4 py-2 rounded-full text-sm bg-red-600 text-white font-semibold disabled:opacity-50"
                >
                  {pending ? "Wird storniert …" : "Ja, stornieren"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
