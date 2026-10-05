"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createSperrzeit } from "./actions";

export default function SperrzeitForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [kind, setKind] = useState<"sperrzeit" | "reservierung">("sperrzeit");
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    // Formular vor dem await merken: e.currentTarget ist danach null — das
    // reset() warf deshalb nach jedem erfolgreichen Speichern einen Fehler.
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await createSperrzeit(fd);
      if (!res.ok) {
        setError(res.error ?? "Fehler.");
        return;
      }
      form.reset();
      setKind("sperrzeit");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 space-y-4"
    >
      <h3 className="text-[20px] m-0">
        {kind === "reservierung" ? "Neue Reservierung" : "Neue Sperrzeit"}
      </h3>
      <fieldset className="space-y-2 text-sm">
        <label className="flex items-start gap-2">
          <input
            type="radio"
            name="kind"
            value="sperrzeit"
            checked={kind === "sperrzeit"}
            onChange={() => setKind("sperrzeit")}
            className="mt-0.5 accent-[var(--color-wh-deep-green)]"
          />
          <span>
            <strong>Sperrzeit</strong> — Wartung oder Eigennutzung. Kein Reinigungstag danach.
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="radio"
            name="kind"
            value="reservierung"
            checked={kind === "reservierung"}
            onChange={() => setKind("reservierung")}
            className="mt-0.5 accent-[var(--color-wh-deep-green)]"
          />
          <span>
            <strong>Reservierung</strong> — geplante Fahrt, z.&nbsp;B. ESG. Hält den Termin frei,
            mit Reinigungstag danach; später in eine Buchung umwandelbar.
          </span>
        </label>
      </fieldset>
      <Input id="from" name="from" type="date" label="Von" required />
      <Input id="to" name="to" type="date" label="Bis" required />
      <Input
        id="purpose"
        name="purpose"
        label={kind === "reservierung" ? "Für wen / was" : "Grund"}
        placeholder={kind === "reservierung" ? "z. B. ESG Klasse 9b" : "z. B. Wartung Heizung"}
        required
      />
      {error && (
        <div className="text-sm bg-[var(--color-wh-sunset)]/10 text-[var(--color-wh-sunset)] px-3 py-2 rounded-md">
          {error}
        </div>
      )}
      <Button type="submit" variant="primary" disabled={pending} block>
        {pending ? "Speichere ..." : kind === "reservierung" ? "Reservierung anlegen" : "Sperrzeit anlegen"}
      </Button>
    </form>
  );
}
