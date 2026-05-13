"use client";

import { useEffect, useState } from "react";
import { Star, X, Languages } from "lucide-react";
import type { Locale } from "@/lib/i18n-shared";
import type { TrustData } from "@/lib/trust-reviews";

const COPY: Record<Locale, {
  ariaLabel: string;
  modalH: string;
  basedOn: (n: number) => string;
  sourceLine: (sources: string[]) => string;
  noText: string;
  close: string;
  translated: string;
}> = {
  de: {
    ariaLabel: "Bewertungen anzeigen",
    modalH: "Bewertungen unserer Gäste",
    basedOn: (n) => `Basierend auf ${n} öffentlichen Bewertungen`,
    sourceLine: (sources) => `Quellen: ${sources.join(" · ")}`,
    noText: "(keine Textbewertung)",
    close: "Schließen",
    translated: "übersetzt aus",
  },
  en: {
    ariaLabel: "Show reviews",
    modalH: "What our guests say",
    basedOn: (n) => `Based on ${n} public reviews`,
    sourceLine: (sources) => `Sources: ${sources.join(" · ")}`,
    noText: "(no text review)",
    close: "Close",
    translated: "translated from",
  },
  nl: {
    ariaLabel: "Reviews tonen",
    modalH: "Wat onze gasten zeggen",
    basedOn: (n) => `Gebaseerd op ${n} openbare reviews`,
    sourceLine: (sources) => `Bronnen: ${sources.join(" · ")}`,
    noText: "(geen tekstreview)",
    close: "Sluiten",
    translated: "vertaald uit",
  },
};

const SOURCE_LABELS: Record<string, string> = {
  google: "Google",
  gruppenhaus: "Gruppenhaus.de",
  gruppenunterkuenfte: "Gruppenunterkünfte.de",
  manual: "",
};

export function TrustBadgeButton({
  trust,
  locale,
  variant = "header",
}: {
  trust: TrustData;
  locale: Locale;
  variant?: "header" | "mobile-menu";
}) {
  const c = COPY[locale];
  const [open, setOpen] = useState(false);

  // Close on Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Body-Scroll-Lock fuer das Modal
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const avgRounded = trust.avg.toFixed(1).replace(".", locale === "de" || locale === "nl" ? "," : ".");

  const PillContent = (
    <>
      <Star size={14} fill="currentColor" strokeWidth={0} className="text-amber-400" />
      <span className="font-bold tabular-nums">{avgRounded}</span>
      <span className="opacity-70 font-medium">· {trust.count}</span>
    </>
  );

  return (
    <>
      {variant === "header" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={c.ariaLabel}
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-[var(--color-wh-snow)] text-xs transition-colors cursor-pointer whitespace-nowrap"
        >
          {PillContent}
        </button>
      ) : (
        // mobile-menu Variante: groesserer, gut tappbarer Button
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={c.ariaLabel}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-[var(--color-wh-snow)] text-sm transition-colors cursor-pointer"
        >
          {PillContent}
          <span className="opacity-70">›</span>
        </button>
      )}

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" aria-hidden />

          {/* Sheet */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="trust-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-[680px] max-h-[92vh] sm:max-h-[80vh] bg-[var(--color-wh-snow)] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[var(--color-wh-winter-grey)] bg-[var(--color-wh-beige)]">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2
                  id="trust-modal-title"
                  className="font-display font-bold text-[var(--color-wh-deep-green)] m-0"
                  style={{ fontSize: "clamp(20px, 3vw, 26px)" }}
                >
                  {c.modalH}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={c.close}
                  className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-white border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)] cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <Stars avg={trust.avg} />
                <div>
                  <div className="text-2xl font-bold text-[var(--color-wh-deep-green)] leading-none">
                    {avgRounded}
                    <span className="text-base font-normal text-[var(--color-wh-fg-muted)] ml-1">
                      / 5
                    </span>
                  </div>
                  <div className="text-xs text-[var(--color-wh-fg-muted)] mt-0.5">
                    {c.basedOn(trust.count)}
                  </div>
                </div>
              </div>
              {trust.sources.length > 0 && (
                <div className="text-[11px] text-[var(--color-wh-fg-muted)]/80 mt-2">
                  {c.sourceLine(trust.sources)}
                </div>
              )}
            </div>

            {/* List — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-4 space-y-4">
              {trust.items.map((r) => (
                <article
                  key={r.id}
                  className="bg-white border border-[var(--color-wh-winter-grey)] rounded-xl p-4"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="font-semibold text-[var(--color-wh-deep-green)] text-sm">
                      {r.authorName}
                    </div>
                    {r.rating !== null && (
                      <div className="inline-flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, k) => (
                          <Star
                            key={k}
                            size={13}
                            fill={k < (r.rating ?? 0) ? "currentColor" : "none"}
                            strokeWidth={1.5}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {r.text ? (
                    <p className="text-sm text-[var(--color-wh-black)] m-0 leading-relaxed">
                      „{r.text}"
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--color-wh-fg-muted)]/70 italic m-0">
                      {c.noText}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-[var(--color-wh-fg-muted)] mt-3 pt-2 border-t border-[var(--color-wh-winter-grey)]/60">
                    <span>{r.relativeTime ?? ""}</span>
                    <span className="inline-flex items-center gap-1">
                      {r.translated && (
                        <span className="inline-flex items-center gap-0.5">
                          <Languages size={10} />
                          {c.translated} {r.originalLanguage?.toUpperCase()}
                          {SOURCE_LABELS[r.source] ? " ·" : ""}
                        </span>
                      )}
                      {SOURCE_LABELS[r.source] && <span>{SOURCE_LABELS[r.source]}</span>}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const Stars = ({ avg }: { avg: number }) => {
  const full = Math.floor(avg);
  const half = avg - full >= 0.25 && avg - full < 0.75;
  const showFull = avg - full >= 0.75 ? full + 1 : full;
  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => {
        const isFull = i < showFull;
        const isHalf = !isFull && i === full && half;
        return (
          <Star
            key={i}
            size={18}
            fill={isFull ? "currentColor" : isHalf ? "url(#half-gradient-modal)" : "none"}
            strokeWidth={1.5}
          />
        );
      })}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <defs>
          <linearGradient id="half-gradient-modal" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
