"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2 } from "lucide-react";
import { rebookBooking } from "./rebook-actions";
import { AvailabilityCalendar } from "@/app/(public)/buchen/AvailabilityCalendar";

type Props = {
  bookingId: string;
  bookingStatus: string;
  bookedDates: string[];
  cleaningDates: string[];
  wartungDates: string[];
};

const NOT_REBOOKABLE = new Set(["storniert", "abgereist", "angereist"]);

export function RebookControl({
  bookingId,
  bookingStatus,
  bookedDates,
  cleaningDates,
  wartungDates,
}: Props) {
  const [open, setOpen] = useState(false);
  const [newArrival, setNewArrival] = useState("");
  const [newDeparture, setNewDeparture] = useState("");
  const [mode, setMode] = useState<"altvertrag" | "neuvertrag">("altvertrag");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (NOT_REBOOKABLE.has(bookingStatus)) return null;

  const submit = () => {
    setError(null);
    if (!newArrival || !newDeparture) {
      setError("Bitte An- und Abreise angeben.");
      return;
    }
    const confirmText =
      mode === "altvertrag"
        ? "Diese Buchung wird storniert und mit den ursprünglichen Konditionen (Preise, Storno-Frist) auf den neuen Zeitraum umgebucht. Fortfahren?"
        : "Diese Buchung wird storniert und mit den aktuellen Konditionen (heutige Preise, heutige Storno-Frist) auf den neuen Zeitraum umgebucht. Fortfahren?";
    if (!window.confirm(confirmText)) return;

    start(async () => {
      const res = await rebookBooking({ bookingId, newArrival, newDeparture, mode });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/m/buchungen/${res.newBookingId}`);
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-wh-deep-green)] hover:underline cursor-pointer inline-flex items-center gap-1.5"
      >
        <CalendarClock size={13} />
        Umbuchen
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-[var(--color-wh-winter-grey)] bg-[var(--color-wh-snow)] p-4">
      <div className="text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)] mb-3">
        Buchung umbuchen
      </div>
      <p className="text-[13px] leading-snug text-[var(--color-wh-fg-muted)] mb-3">
        Storniert diese Buchung und legt eine neue mit demselben Gast auf den neuen Zeitraum an.
        Bereits erhaltene Zahlungen wandern mit auf die neue Buchung.
      </p>

      <div className="mb-3 rounded-lg border border-[var(--color-wh-winter-grey)] bg-white p-2">
        <AvailabilityCalendar
          bookedDates={bookedDates}
          cleaningDates={cleaningDates}
          wartungDates={wartungDates}
          arrival={newArrival}
          departure={newDeparture}
          onSelect={(a, d) => {
            setNewArrival(a);
            setNewDeparture(d);
          }}
        />
      </div>

      <div className="space-y-2 mb-3">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="radio"
            name="rebook-mode"
            checked={mode === "altvertrag"}
            onChange={() => setMode("altvertrag")}
            className="mt-0.5 accent-[var(--color-wh-deep-green)]"
          />
          <span className="text-[13px] leading-snug text-[var(--color-wh-black)]">
            <strong>Alt-Vertrag</strong> — ursprüngliche Personenpreise und Storno-Frist bleiben
            erhalten (Kulanz-Umbuchung).
          </span>
        </label>
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="radio"
            name="rebook-mode"
            checked={mode === "neuvertrag"}
            onChange={() => setMode("neuvertrag")}
            className="mt-0.5 accent-[var(--color-wh-deep-green)]"
          />
          <span className="text-[13px] leading-snug text-[var(--color-wh-black)]">
            <strong>Neu-Vertrag</strong> — heutige Preise und heutige Storno-Frist, wie eine neue
            Buchung.
          </span>
        </label>
      </div>

      {error && <p className="text-[13px] text-[#7a3a20] mt-2">{error}</p>}

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="inline-flex items-center justify-center h-10 px-5 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold hover:bg-[var(--color-wh-green)] transition-colors cursor-pointer disabled:opacity-50"
        >
          {pending && <Loader2 size={14} className="animate-spin mr-1.5" />}
          {pending ? "Wird umgebucht …" : "Jetzt umbuchen"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="inline-flex items-center justify-center h-10 px-4 text-sm text-[var(--color-wh-fg-muted)] hover:text-[var(--color-wh-deep-green)] cursor-pointer"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
