"use client";

import { useState } from "react";
import { Star, ChevronLeft, ChevronRight, Languages } from "lucide-react";
import type { Locale } from "@/lib/i18n-shared";

type Item = {
  id: string;
  authorName: string;
  rating: number | null;
  text: string | null;
  relativeTime: string | null;
  source: string;
  sourceLabel: string;
  translated: boolean;
  originalLanguage: string | null;
};

const COPY: Record<Locale, { prev: string; next: string; translated: string }> = {
  de: { prev: "Zurück", next: "Weiter", translated: "übersetzt aus" },
  en: { prev: "Previous", next: "Next", translated: "translated from" },
  nl: { prev: "Vorige", next: "Volgende", translated: "vertaald uit" },
};

export function ReviewCarousel({ items, locale }: { items: Item[]; locale: Locale }) {
  const c = COPY[locale];
  const [idx, setIdx] = useState(0);
  const n = items.length;

  if (n === 0) return null;

  const goPrev = () => setIdx((i) => (i - 1 + n) % n);
  const goNext = () => setIdx((i) => (i + 1) % n);

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[idx, (idx + 1) % n, (idx + 2) % n].slice(0, Math.min(3, n)).map((i, slot) => {
          const r = items[i];
          // Sliding-Logic: auf Mobile zeigen wir nur den aktuellen, auf Desktop 3
          return (
            <article
              key={`${r.id}-${slot}`}
              className={`bg-white border border-[var(--color-wh-winter-grey)] rounded-2xl p-6 flex flex-col gap-3 shadow-[0_4px_16px_rgba(47,74,53,0.05)] ${
                slot > 0 ? "hidden md:flex" : "flex"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-[var(--color-wh-deep-green)]">
                  {r.authorName}
                </div>
                {r.rating !== null && (
                  <div className="inline-flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star
                        key={k}
                        size={14}
                        fill={k < (r.rating ?? 0) ? "currentColor" : "none"}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                )}
              </div>
              {r.text && (
                <blockquote className="text-sm text-[var(--color-wh-black)] m-0 leading-relaxed flex-1">
                  „{r.text}"
                </blockquote>
              )}
              <div className="flex items-center justify-between text-xs text-[var(--color-wh-fg-muted)] mt-2 pt-3 border-t border-[var(--color-wh-winter-grey)]">
                <span>{r.relativeTime ?? ""}</span>
                <span className="inline-flex items-center gap-1">
                  {r.translated && (
                    <span className="inline-flex items-center gap-0.5">
                      <Languages size={11} />
                      {c.translated} {r.originalLanguage?.toUpperCase()}
                      ·
                    </span>
                  )}
                  {r.sourceLabel}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {n > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={goPrev}
            aria-label={c.prev}
            className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-white border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)] cursor-pointer shadow-sm"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-xs text-[var(--color-wh-fg-muted)] font-mono">
            {idx + 1} / {n}
          </div>
          <button
            type="button"
            onClick={goNext}
            aria-label={c.next}
            className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-white border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)] cursor-pointer shadow-sm"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
