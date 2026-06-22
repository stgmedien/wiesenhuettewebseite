"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { User, Users } from "lucide-react";
import { submitWapelbad } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 px-6 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] font-semibold hover:bg-[var(--color-wh-green)] transition-colors disabled:opacity-60 cursor-pointer"
    >
      {pending ? "…" : "Anmeldung absenden"}
    </button>
  );
}

export function WapelbadForm() {
  const [teilnahme, setTeilnahme] = useState<"ich" | "familie">("ich");

  const option = (
    value: "ich" | "familie",
    label: string,
    Icon: typeof User
  ) => {
    const active = teilnahme === value;
    return (
      <label
        className={
          "flex items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 cursor-pointer transition-colors " +
          (active
            ? "bg-[var(--color-wh-green-soft)] border-[var(--color-wh-green)]"
            : "bg-white border-[var(--color-wh-winter-grey)] hover:border-[var(--color-wh-green)]/60")
        }
      >
        <input
          type="radio"
          name="teilnahme"
          value={value}
          checked={active}
          onChange={() => setTeilnahme(value)}
          className="accent-[var(--color-wh-deep-green)] w-4 h-4 shrink-0"
        />
        <Icon size={18} className="text-[var(--color-wh-deep-green)] shrink-0" />
        <span className="text-[15px] font-medium text-[var(--color-wh-black)]">
          {label}
        </span>
      </label>
    );
  };

  return (
    <form action={submitWapelbad} className="space-y-6">
      {/* Honeypot: für Menschen unsichtbar, Bots füllen es aus. */}
      <div aria-hidden className="hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider font-bold text-[var(--color-wh-deep-green)] mb-3">
          Teilnahme
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {option("ich", "Ich nehme teil", User)}
          {option("familie", "Meine Familie nimmt teil", Users)}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium text-[var(--color-wh-black)] mb-1.5">
            Personenanzahl *
          </span>
          <input
            type="number"
            name="persons"
            min={1}
            max={50}
            defaultValue={teilnahme === "familie" ? 2 : 1}
            required
            className="w-full h-12 rounded-[var(--radius-md)] border border-[var(--color-wh-winter-grey)] bg-white px-4 focus:outline-none focus:border-[var(--color-wh-green)]"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-[var(--color-wh-black)] mb-1.5">
            Name *
          </span>
          <input
            type="text"
            name="name"
            maxLength={120}
            required
            className="w-full h-12 rounded-[var(--radius-md)] border border-[var(--color-wh-winter-grey)] bg-white px-4 focus:outline-none focus:border-[var(--color-wh-green)]"
          />
        </label>
      </div>

      <label className="block">
        <span className="block text-sm font-medium text-[var(--color-wh-black)] mb-1.5">
          E-Mail *
        </span>
        <input
          type="email"
          name="email"
          required
          className="w-full h-12 rounded-[var(--radius-md)] border border-[var(--color-wh-winter-grey)] bg-white px-4 focus:outline-none focus:border-[var(--color-wh-green)]"
        />
        <span className="block text-[13px] text-[var(--color-wh-fg-muted)] mt-1.5">
          Nur für die Anmeldung und eine eventuelle wetterbedingte Absage – wird nicht weitergegeben.
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-wh-winter-grey)] bg-white px-4 py-3 hover:border-[var(--color-wh-green)]/60 transition-colors">
        <input
          type="checkbox"
          name="grill"
          className="accent-[var(--color-wh-deep-green)] w-4 h-4 mt-0.5 shrink-0"
        />
        <span className="text-[15px] text-[var(--color-wh-black)]">
          Wir nehmen am <strong>Grillbuffet</strong> teil
          <span className="text-[var(--color-wh-fg-muted)]"> (10 € pro Person, vor Ort zu zahlen)</span>
        </span>
      </label>

      <SubmitButton />
    </form>
  );
}
