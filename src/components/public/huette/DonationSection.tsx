"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Volleyball, Heart } from "lucide-react";
import { createDonationCheckout } from "@/app/(public)/huette/spenden-actions";

export type DonationCopy = {
  eyebrow: string;
  h2: string;
  body: string;
  amountLabel: string;
  customLabel: string;
  cta: string;
  secure: string;
  receiptNote: string;
  thanks: string;
  error: string;
};

const PRESETS = [10, 25, 50, 100];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 px-6 items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] font-semibold hover:bg-white transition-colors disabled:opacity-60 cursor-pointer"
    >
      <Heart size={17} />
      {pending ? "…" : label}
    </button>
  );
}

export function DonationSection({
  copy,
  status,
}: {
  copy: DonationCopy;
  status: "danke" | "fehler" | null;
}) {
  const [amount, setAmount] = useState<string>("25");

  return (
    <section
      id="spenden"
      className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24"
    >
      <div className="max-w-[920px] mx-auto">
        <div className="flex items-center gap-2.5 eyebrow text-[var(--color-wh-snow)]/80">
          <Volleyball size={16} className="shrink-0" />
          {copy.eyebrow}
        </div>
        <h2 className="text-[var(--color-wh-snow)] text-[32px] sm:text-[44px] mt-3 mb-4 leading-tight">
          {copy.h2}
        </h2>
        <p className="text-[var(--color-wh-snow)]/88 max-w-2xl leading-relaxed m-0 mb-8 text-base sm:text-[17px]">
          {copy.body}
        </p>

        {status === "danke" && (
          <div
            role="status"
            className="mb-8 rounded-[var(--radius-card)] bg-[var(--color-wh-snow)]/15 border border-[var(--color-wh-snow)]/30 px-5 py-4 font-semibold"
          >
            {copy.thanks}
          </div>
        )}
        {status === "fehler" && (
          <div
            role="alert"
            className="mb-8 rounded-[var(--radius-card)] bg-[var(--color-wh-sunset)]/25 border border-[var(--color-wh-sunset)]/50 px-5 py-4 font-semibold"
          >
            {copy.error}
          </div>
        )}

        <form action={createDonationCheckout} className="max-w-xl">
          <div className="text-xs uppercase tracking-wider font-bold text-[var(--color-wh-snow)]/70 mb-3">
            {copy.amountLabel}
          </div>
          <div className="flex flex-wrap gap-2.5 mb-4">
            {PRESETS.map((p) => {
              const active = amount === String(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(String(p))}
                  aria-pressed={active}
                  className={
                    "h-11 px-5 rounded-full font-semibold text-sm transition-colors cursor-pointer " +
                    (active
                      ? "bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)]"
                      : "bg-[var(--color-wh-snow)]/12 text-[var(--color-wh-snow)] border border-[var(--color-wh-snow)]/30 hover:bg-[var(--color-wh-snow)]/20")
                  }
                >
                  {p} €
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="block text-xs text-[var(--color-wh-snow)]/70 mb-1.5">
                {copy.customLabel}
              </span>
              <input
                type="number"
                name="amount"
                min={2}
                max={5000}
                step="1"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="h-12 w-36 rounded-[var(--radius-btn)] bg-[var(--color-wh-snow)]/12 border border-[var(--color-wh-snow)]/35 px-4 text-[var(--color-wh-snow)] font-semibold text-lg focus:outline-none focus:border-[var(--color-wh-snow)]"
              />
            </label>
            <SubmitButton label={copy.cta} />
          </div>
          <p className="text-[12.5px] text-[var(--color-wh-snow)]/60 mt-4 m-0">{copy.secure}</p>
          <p className="text-sm text-[var(--color-wh-snow)]/80 mt-2 m-0">{copy.receiptNote}</p>
        </form>
      </div>
    </section>
  );
}
