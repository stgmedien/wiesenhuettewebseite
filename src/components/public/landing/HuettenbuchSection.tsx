import type { Locale } from "@/lib/i18n-shared";
import { HUETTENBUCH_ENTRIES, HUETTENBUCH_COPY } from "@/lib/huettenbuch-entries";
import { ScrollReveal } from "@/components/public/ScrollReveal";

/**
 * "Aus dem Huettenbuch" — Zettel-Cards auf Holz-/Beige-Background.
 * Eintraege leicht rotiert (rotationDeg), Caveat-Font fuer Handschrift-Feel.
 * Mobile: vertikal gestapelt, Rotation reduziert.
 */

export function HuettenbuchSection({ locale }: { locale: Locale }) {
  const c = HUETTENBUCH_COPY[locale];

  return (
    <section
      className="relative px-6 sm:px-8 py-24 sm:py-32 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #4a3b29 0%, #5a4830 50%, #4a3b29 100%)",
      }}
    >
      {/* Holzmaserung-Overlay */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0px, rgba(0,0,0,0.15) 1px, transparent 3px, transparent 7px)," +
            "repeating-linear-gradient(180deg, transparent 0px, rgba(120,80,40,0.2) 60px, transparent 62px, transparent 140px)",
        }}
        aria-hidden
      />

      <div className="relative max-w-[1180px] mx-auto">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-14 sm:mb-20 max-w-2xl mx-auto">
            <div className="text-[11px] uppercase tracking-[0.3em] font-semibold text-[var(--color-wh-beige)] mb-4">
              {c.eyebrow}
            </div>
            <h2
              className="font-display font-bold m-0 mb-5 leading-[1.05]"
              style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                letterSpacing: "-0.02em",
                color: "var(--color-wh-snow)",
              }}
            >
              {c.h2}
            </h2>
            <p
              className="text-base sm:text-lg leading-relaxed m-0 mx-auto"
              style={{ color: "rgba(247,247,242,0.82)" }}
            >
              {c.lead}
            </p>
          </div>
        </ScrollReveal>

        {/* Notes-Stack: leichtes Masonry/Mosaic mit rotierten Zetteln */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {HUETTENBUCH_ENTRIES.map((entry, i) => (
            <ScrollReveal
              key={i}
              delay={i * 100}
              className={`${i % 2 === 0 ? "lg:translate-y-6" : "lg:-translate-y-2"} ${i === 4 ? "sm:col-span-2 lg:col-span-1" : ""}`}
            >
              <NoteCard entry={entry} locale={locale} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const NoteCard = ({
  entry,
  locale,
}: {
  entry: (typeof HUETTENBUCH_ENTRIES)[number];
  locale: Locale;
}) => {
  return (
    <article
      className="relative bg-[var(--color-wh-snow)] p-7 sm:p-8 shadow-[0_20px_45px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:rotate-0 hover:translate-y-[-4px]"
      style={{
        transform: `rotate(${entry.rotationDeg}deg)`,
        borderRadius: "3px 3px 12px 3px", // leichte Asymmetrie wie ein Papier-Eck
        backgroundImage:
          "repeating-linear-gradient(180deg, transparent 0px, transparent 23px, rgba(180,150,90,0.08) 24px)",
      }}
    >
      {/* "Tape" oben — kleine Klebestreifen-Andeutung */}
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-5 bg-[rgba(255,255,255,0.7)] shadow-sm"
        style={{
          backdropFilter: "blur(2px)",
          transform: "translateX(-50%) rotate(-2deg)",
        }}
        aria-hidden
      />

      {/* Datum + Autor */}
      <div className="flex items-baseline justify-between gap-3 mb-4 pb-3 border-b border-dashed border-[var(--color-wh-winter-grey)]">
        <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-[var(--color-wh-deep-green)]/70">
          {entry.date}
        </span>
      </div>

      {/* Handschrift-Text */}
      <p
        className="text-[var(--color-wh-deep-green)] m-0 leading-[1.45]"
        style={{
          fontFamily: "var(--font-script), cursive",
          fontSize: "clamp(19px, 1.6vw, 23px)",
        }}
      >
        „{entry.text[locale]}"
      </p>

      {/* Autor-Signatur unten rechts */}
      <p
        className="m-0 mt-5 text-right text-[var(--color-wh-deep-green)]/75"
        style={{
          fontFamily: "var(--font-script), cursive",
          fontSize: "clamp(15px, 1.2vw, 17px)",
        }}
      >
        — {entry.author}
      </p>
    </article>
  );
};
