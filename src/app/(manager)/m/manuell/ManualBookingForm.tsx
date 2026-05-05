"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createManualBooking } from "./actions";

export default function ManualBookingForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createManualBooking(fd);
      if (!res.ok) {
        setError(res.error ?? "Fehler beim Anlegen.");
        return;
      }
      if (res.redirectTo) router.push(res.redirectTo);
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
      <h3 className="text-[20px] m-0">Zeitraum & Belegung</h3>
      <div className="grid grid-cols-2 gap-4">
        <Input id="arrival" name="arrival" label="Anreise" type="date" required />
        <Input id="departure" name="departure" label="Abreise" type="date" required />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Input id="adults" name="adults" type="number" min={0} defaultValue={0} label="Erwachsene NM" hint="ab 16, Nichtmitgl." />
        <Input id="members" name="members" type="number" min={0} defaultValue={0} label="Mitglieder" hint="Vereinsmitgl." />
        <Input id="children" name="children" type="number" min={0} defaultValue={0} label="Kinder 4–15" />
        <Input id="pupils" name="pupils" type="number" min={0} defaultValue={0} label="Schüler" />
        <Input id="teachers" name="teachers" type="number" min={0} defaultValue={0} label="Lehrkräfte" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="cleaningOptedIn" defaultChecked /> Endreinigung
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="soloUse" /> Allein-/Exklusivnutzung
        </label>
      </div>

      <h3 className="text-[20px] m-0 mt-4">Gast</h3>

      <div className="grid grid-cols-2 gap-4">
        <select
          name="customerType"
          defaultValue="privat"
          className="h-11 px-4 rounded-[var(--radius-md)] border border-[var(--color-wh-winter-grey)] bg-white"
        >
          <option value="privat">Privat</option>
          <option value="mitglied">Vereinsmitglied</option>
          <option value="verein">Verein / Schule</option>
          <option value="firma">Firma</option>
        </select>
        <Input id="company" name="company" label="Firma / Verein (optional)" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input id="firstName" name="firstName" label="Vorname" required />
        <Input id="lastName" name="lastName" label="Nachname" required />
        <Input id="email" name="email" type="email" label="E-Mail" required />
        <Input id="phone" name="phone" type="tel" label="Telefon" />
      </div>

      <Input id="purpose" name="purpose" label="Anlass (optional)" />
      <Textarea id="internalNotes" name="internalNotes" label="Interne Notizen (nicht an den Gast)" />

      {error && (
        <div className="text-sm text-[var(--color-wh-sunset)] bg-[var(--color-wh-sunset)]/10 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Speichere ..." : "Buchung anlegen"}
        </Button>
      </div>
    </form>
  );
}
