import type { Locale } from "@/lib/i18n-shared";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { loadTrustData, type TrustReviewItem } from "@/lib/trust-reviews";

/**
 * Magazin-Spread Pull-Quote — riesiges Display-Type-Zitat, keine Bilder.
 *
 * Quelle: ein kuratiertes Highlight-Review aus loadTrustData(). Wir picken
 * eines mit Text + ueberschaubarer Laenge (max ~180 Zeichen, sonst kuerzen
 * wir mit Ellipsis). Wenn DB nicht erreichbar → Fallback-Zitat.
 */

const FALLBACK_QUOTE: Record<Locale, { text: string; author: string }> = {
  de: {
    text: "Dass ich das nochmal sehe. In der Hütte haben wir mit unserer Schulklasse im Winter 1976 unvergessliche Tage verbracht.",
    author: "Schulklasse '76, Gästebuch-Eintrag",
  },
  en: {
    text: "I never thought I'd see this again. We spent unforgettable days here with our school class in winter 1976.",
    author: "School class '76, guest-book entry",
  },
  nl: {
    text: "Dat ik dit nog eens mag zien. We hadden hier met onze schoolklas in de winter van 1976 onvergetelijke dagen.",
    author: "Schoolklas '76, gastenboek",
  },
};

const COPY: Record<Locale, { eyebrow: string }> = {
  de: { eyebrow: "Was Gäste sagen" },
  en: { eyebrow: "What guests say" },
  nl: { eyebrow: "Wat gasten zeggen" },
};

/**
 * Heuristik: bevorzugt ein Review mit 80-180 Zeichen Text — kurz genug fuer
 * Display-Typo, lang genug um Substanz zu haben. Faellt sonst auf das
 * Fallback-Zitat zurueck.
 */
const pickReview = (items: TrustReviewItem[]): TrustReviewItem | null => {
  const candidates = items.filter(
    (r) => r.text && r.text.length >= 60 && r.text.length <= 220 && r.rating && r.rating >= 4
  );
  if (candidates.length === 0) return null;
  // Bevorzugt aktuelle Reviews (sortiert ist es schon, da loadTrustData
  // Highlights-first + neueste liefert)
  return candidates[0];
};

export async function PullQuote({ locale }: { locale: Locale }) {
  const data = await loadTrustData();
  const review = data ? pickReview(data.items) : null;
  const fb = FALLBACK_QUOTE[locale];
  const c = COPY[locale];

  const quoteText = review?.text ?? fb.text;
  const author = review
    ? `${review.authorName}${review.relativeTime ? " · " + review.relativeTime : ""}`
    : fb.author;

  return (
    <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-24 sm:py-36">
      <div className="max-w-[1100px] mx-auto">
        <ScrollReveal>
          <div className="eyebrow text-[var(--color-wh-deep-green)] mb-8 sm:mb-10">
            {c.eyebrow}
          </div>
        </ScrollReveal>
        <ScrollReveal delay={120}>
          <blockquote
            className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 leading-[1.04] relative"
            style={{
              fontSize: "clamp(36px, 6.5vw, 96px)",
              letterSpacing: "-0.025em",
              textWrap: "balance" as React.CSSProperties["textWrap"],
            }}
          >
            <span
              aria-hidden
              className="absolute font-serif text-[var(--color-wh-sunset)]/40 select-none pointer-events-none"
              style={{
                fontSize: "clamp(120px, 18vw, 260px)",
                lineHeight: 1,
                left: "-0.15em",
                top: "-0.45em",
              }}
            >
              „
            </span>
            <span className="relative">{quoteText}</span>
          </blockquote>
        </ScrollReveal>
        <ScrollReveal delay={260}>
          <p className="mt-10 sm:mt-14 text-[13px] uppercase tracking-[0.25em] font-semibold text-[var(--color-wh-deep-green)]/70 m-0">
            — {author}
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
