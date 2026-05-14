import Image from "next/image";
import type { Locale } from "@/lib/i18n-shared";
import { HISTORY_ENTRIES, HISTORY_COPY } from "@/lib/history-entries";
import { ScrollReveal } from "@/components/public/ScrollReveal";

/**
 * History-Timeline.
 * Desktop: horizontal scroll-snap, mit Schienen-Linie als visueller Anker.
 * Mobile: vertikal gestapelt mit linker Timeline-Linie + Year-Dot.
 *
 * Server-Component (kein State). Scroll-Snap macht der Browser nativ,
 * ScrollReveal triggert beim Sichtbarwerden Fade-in.
 */

export function HistoryTimeline({ locale }: { locale: Locale }) {
  const c = HISTORY_COPY[locale];

  return (
    <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-20 sm:py-28">
      <div className="max-w-[1280px] mx-auto">
        {/* Section-Header */}
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10 sm:mb-14">
            <div className="md:col-span-5">
              <div className="eyebrow mb-3 text-[var(--color-wh-deep-green)]">{c.eyebrow}</div>
              <h2
                className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 leading-[1.02]"
                style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-0.02em" }}
              >
                {c.h2}
              </h2>
            </div>
            <div className="md:col-span-7 md:pt-3">
              <p className="text-base sm:text-[18px] leading-[1.7] text-[var(--color-wh-black)] m-0 max-w-2xl">
                {c.lead}
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* DESKTOP: horizontaler Scroll mit Snap */}
        <div className="hidden md:block relative">
          {/* Timeline-Linie quer */}
          <div
            className="absolute top-[210px] left-0 right-0 h-px bg-[var(--color-wh-winter-grey)]"
            aria-hidden
          />
          <div
            className="flex gap-8 overflow-x-auto snap-x snap-mandatory pb-6 -mx-6 sm:-mx-8 px-6 sm:px-8"
            style={{ scrollbarWidth: "thin" }}
          >
            {HISTORY_ENTRIES.map((e, i) => (
              <ScrollReveal
                key={e.year}
                delay={i * 80}
                className="shrink-0 snap-start w-[340px] lg:w-[400px]"
              >
                <TimelineCard entry={e} locale={locale} variant="desktop" />
              </ScrollReveal>
            ))}
          </div>
          <p className="mt-6 text-[11px] uppercase tracking-[0.25em] font-semibold text-[var(--color-wh-fg-muted)] m-0">
            {c.scrollHint}
          </p>
        </div>

        {/* MOBILE: vertikaler Stack mit linker Timeline-Linie */}
        <div className="md:hidden relative">
          <div
            className="absolute top-3 bottom-3 left-3 w-px bg-[var(--color-wh-winter-grey)]"
            aria-hidden
          />
          <div className="space-y-10">
            {HISTORY_ENTRIES.map((e, i) => (
              <ScrollReveal key={e.year} delay={i * 80} className="relative pl-10">
                {/* Dot auf der Linie */}
                <div
                  className="absolute left-[7px] top-3 w-3 h-3 rounded-full bg-[var(--color-wh-deep-green)] ring-4 ring-[var(--color-wh-snow)]"
                  aria-hidden
                />
                <TimelineCard entry={e} locale={locale} variant="mobile" />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const TimelineCard = ({
  entry,
  locale,
  variant,
}: {
  entry: (typeof HISTORY_ENTRIES)[number];
  locale: Locale;
  variant: "desktop" | "mobile";
}) => {
  return (
    <article className="flex flex-col">
      {/* Photo */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[var(--color-wh-winter-grey)] bg-[var(--color-wh-beige)] mb-5">
        <Image
          src={entry.photo}
          alt={entry.photoAlt}
          fill
          sizes={variant === "desktop" ? "400px" : "100vw"}
          className="object-cover"
        />
      </div>

      {/* Year + Dot (Desktop only — Mobile-Dot ist außen) */}
      {variant === "desktop" && (
        <div className="flex items-center gap-3 mb-3">
          <span
            className="block w-3 h-3 rounded-full bg-[var(--color-wh-deep-green)] ring-4 ring-[var(--color-wh-snow)]"
            aria-hidden
          />
          <span className="font-display font-bold text-[var(--color-wh-deep-green)] text-[28px] leading-none tabular-nums">
            {entry.year}
          </span>
        </div>
      )}
      {variant === "mobile" && (
        <span className="font-display font-bold text-[var(--color-wh-deep-green)] text-[26px] leading-none tabular-nums mb-2">
          {entry.year}
        </span>
      )}

      <h3
        className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 mb-2 leading-tight"
        style={{ fontSize: "clamp(18px, 1.5vw, 22px)" }}
      >
        {entry.title[locale]}
      </h3>
      <p className="text-[14px] sm:text-[15px] leading-relaxed text-[var(--color-wh-black)] m-0">
        {entry.body[locale]}
      </p>

      {entry.handwrittenNote?.[locale] && (
        <div
          className="mt-5 pt-4 border-t border-dashed border-[var(--color-wh-winter-grey)]"
          aria-hidden={false}
        >
          <p
            className="text-[var(--color-wh-deep-green)]/85 m-0 leading-snug"
            style={{
              fontFamily: "var(--font-script), cursive",
              fontSize: "clamp(18px, 1.6vw, 22px)",
            }}
          >
            {entry.handwrittenNote[locale]}
          </p>
        </div>
      )}
    </article>
  );
};
