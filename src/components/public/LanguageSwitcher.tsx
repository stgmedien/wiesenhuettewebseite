"use client";

import { useState, useTransition } from "react";
import { setLocale } from "@/app/i18n-actions";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n-shared";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ current }: { current: Locale }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        aria-label="Sprache wählen"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full hover:bg-[var(--color-wh-beige)] transition disabled:opacity-50"
      >
        <Globe size={14} />
        {current.toUpperCase()}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 mt-2 w-44 bg-white border border-[var(--color-wh-winter-grey)] rounded-lg shadow-lg z-20 overflow-hidden">
            {LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                disabled={pending || l === current}
                onClick={() => {
                  startTransition(async () => {
                    await setLocale(l);
                    setOpen(false);
                  });
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--color-wh-beige)] disabled:cursor-default ${
                  l === current ? "bg-[var(--color-wh-beige)]/60 font-semibold" : ""
                }`}
              >
                <span className="text-lg">{LOCALE_LABELS[l].flag}</span>
                <span>{LOCALE_LABELS[l].native}</span>
                {l === current && <span className="ml-auto text-[var(--color-wh-deep-green)]">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
