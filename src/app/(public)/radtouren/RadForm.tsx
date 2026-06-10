"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Users } from "lucide-react";
import { submitRideInterest } from "./actions";

export type RadFormCopy = {
  slotsLabel: string;
  interested: string; // "{n} interessiert"
  nameLabel: string;
  emailLabel: string;
  lunchLabel: string;
  consentLabel: string;
  submit: string;
  hint: string;
};

export type RadFormSlot = { id: string; label: string; count: number };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 px-6 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] font-semibold hover:bg-[var(--color-wh-green)] transition-colors disabled:opacity-60 cursor-pointer"
    >
      {pending ? "…" : label}
    </button>
  );
}

export function RadForm({ slots, copy }: { slots: RadFormSlot[]; copy: RadFormCopy }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <form action={submitRideInterest} className="space-y-6">
      {/* Honeypot: für Menschen unsichtbar, Bots füllen es aus. */}
      <div aria-hidden className="hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider font-bold text-[var(--color-wh-deep-green)] mb-3">
          {copy.slotsLabel}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {slots.map((s) => {
            const active = selected.has(s.id);
            return (
              <label
                key={s.id}
                className={
                  "flex items-center justify-between gap-3 rounded-[var(--radius-md)] border px-4 py-3 cursor-pointer transition-colors " +
                  (active
                    ? "bg-[var(--color-wh-green-soft)] border-[var(--color-wh-green)]"
                    : "bg-white border-[var(--color-wh-winter-grey)] hover:border-[var(--color-wh-green)]/60")
                }
              >
                <span className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    name="slots"
                    value={s.id}
                    checked={active}
                    onChange={() => toggle(s.id)}
                    className="accent-[var(--color-wh-deep-green)] w-4 h-4 shrink-0"
                  />
                  <span className="text-[15px] font-medium text-[var(--color-wh-black)] truncate">
                    {s.label}
                  </span>
                </span>
                {s.count > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-wh-deep-green)] bg-[var(--color-wh-green-soft)] border border-[var(--color-wh-green)]/40 rounded-full px-2 py-0.5 shrink-0">
                    <Users size={12} />
                    {copy.interested.replace("{n}", String(s.count))}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium text-[var(--color-wh-black)] mb-1.5">
            {copy.nameLabel}
          </span>
          <input
            type="text"
            name="name"
            maxLength={120}
            className="w-full h-12 rounded-[var(--radius-md)] border border-[var(--color-wh-winter-grey)] bg-white px-4 focus:outline-none focus:border-[var(--color-wh-green)]"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-[var(--color-wh-black)] mb-1.5">
            {copy.emailLabel} *
          </span>
          <input
            type="email"
            name="email"
            required
            className="w-full h-12 rounded-[var(--radius-md)] border border-[var(--color-wh-winter-grey)] bg-white px-4 focus:outline-none focus:border-[var(--color-wh-green)]"
          />
        </label>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="lunch"
          className="accent-[var(--color-wh-deep-green)] w-4 h-4 mt-0.5 shrink-0"
        />
        <span className="text-[15px] text-[var(--color-wh-black)]">{copy.lunchLabel}</span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="consent"
          required
          className="accent-[var(--color-wh-deep-green)] w-4 h-4 mt-0.5 shrink-0"
        />
        <span className="text-[14px] text-[var(--color-wh-fg-muted)]">{copy.consentLabel}</span>
      </label>

      <div className="flex items-center gap-4 flex-wrap">
        <SubmitButton label={copy.submit} />
        <span className="text-[13px] text-[var(--color-wh-fg-muted)]">{copy.hint}</span>
      </div>
    </form>
  );
}
