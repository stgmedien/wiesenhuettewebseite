"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createSperrzeit } from "./actions";

export default function SperrzeitForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createSperrzeit(fd);
      if (!res.ok) {
        setError(res.error ?? "Fehler.");
        return;
      }
      router.refresh();
      (e.currentTarget as HTMLFormElement).reset();
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] rounded-[var(--radius-card)] p-6 space-y-4"
    >
      <h3 className="text-[20px] m-0 text-[var(--color-wh-snow)]">Neue Sperrzeit</h3>
      <Input id="from" name="from" type="date" label="Von" required />
      <Input id="to" name="to" type="date" label="Bis" required />
      <Input id="purpose" name="purpose" label="Grund" placeholder="z. B. Wartung Heizung" required />
      {error && (
        <div className="text-sm bg-[var(--color-wh-sunset)]/20 text-[var(--color-wh-snow)] px-3 py-2 rounded-md">
          {error}
        </div>
      )}
      <Button type="submit" variant="primary" disabled={pending} block>
        {pending ? "Speichere ..." : "Sperrzeit anlegen"}
      </Button>
    </form>
  );
}
