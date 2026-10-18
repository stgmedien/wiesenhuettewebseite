"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { addMeterReading } from "./actions";

type BookingOption = { id: string; label: string };

export default function MeterReadingForm({
  todayIso,
  bookingOptions,
}: {
  todayIso: string;
  bookingOptions: BookingOption[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await addMeterReading(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setNotice(res.warning ?? "Gespeichert.");
      form.reset();
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 space-y-4"
    >
      <h3 className="text-[20px] m-0">Zählerstand erfassen</h3>
      <Input id="readOn" name="readOn" type="date" label="Datum der Ablesung" defaultValue={todayIso} max={todayIso} required />
      <Input
        id="electricity"
        name="electricity"
        inputMode="decimal"
        label="Strom (kWh)"
        placeholder="z. B. 24169,1"
        hint="Alle Ziffern, die letzte (rot umrandet) nach dem Komma."
      />
      <Input
        id="gas"
        name="gas"
        inputMode="decimal"
        label="Gas (m³)"
        placeholder="z. B. 88907,69"
        hint="Schwarze Ziffern vor dem Komma, die zwei roten danach. Die kleine dritte rote Ziffer weglassen."
      />
      <label className="block text-sm">
        <span className="block mb-1 font-medium">Zu welcher Buchung? (optional)</span>
        <select
          name="bookingId"
          defaultValue=""
          className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] bg-white px-3 py-2 text-sm"
        >
          <option value="">— keine / Leerstand —</option>
          {bookingOptions.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
      </label>
      <Input id="note" name="note" label="Notiz (optional)" placeholder="z. B. Abreise Gruppe, Heizung auf Frostschutz" />
      {error && <p className="text-sm text-[#7a3a20] m-0">{error}</p>}
      {notice && <p className="text-sm text-[var(--color-wh-deep-green)] m-0">{notice}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Speichere …" : "Speichern"}
      </Button>
    </form>
  );
}
