import { db } from "@/lib/db";
import { externalReviews } from "@/lib/db/schema";
import { eq, desc, and, isNotNull } from "drizzle-orm";
import { Star } from "lucide-react";
import type { Locale } from "@/lib/i18n-shared";
import { ReviewCarousel } from "./ReviewCarousel";

const COPY: Record<Locale, {
  eyebrow: string;
  h2: string;
  basedOn: (n: number) => string;
  sourceLine: (sources: string[]) => string;
  carouselH: string;
  noText: string;
  via: string;
}> = {
  de: {
    eyebrow: "Was Gäste sagen",
    h2: "Echte Bewertungen, ehrliche Stimmen.",
    basedOn: (n) => `Basierend auf ${n} öffentlichen Bewertungen`,
    sourceLine: (sources) => `Quellen: ${sources.join(" · ")}`,
    carouselH: "Stimmen aus dem Gästebuch",
    noText: "(keine Textbewertung)",
    via: "via",
  },
  en: {
    eyebrow: "What guests say",
    h2: "Real reviews, honest voices.",
    basedOn: (n) => `Based on ${n} public reviews`,
    sourceLine: (sources) => `Sources: ${sources.join(" · ")}`,
    carouselH: "Voices from the guestbook",
    noText: "(no text review)",
    via: "via",
  },
  nl: {
    eyebrow: "Wat gasten zeggen",
    h2: "Echte reviews, eerlijke stemmen.",
    basedOn: (n) => `Gebaseerd op ${n} openbare reviews`,
    sourceLine: (sources) => `Bronnen: ${sources.join(" · ")}`,
    carouselH: "Stemmen uit het gastenboek",
    noText: "(geen tekstreview)",
    via: "via",
  },
};

const SOURCE_LABELS: Record<string, string> = {
  google: "Google",
  gruppenhaus: "Gruppenhaus.de",
  gruppenunterkuenfte: "Gruppenunterkünfte.de",
  manual: "",
};

export async function TrustBadge({ locale }: { locale: Locale }) {
  const c = COPY[locale];

  // Resilient: wenn die Tabelle (noch) nicht existiert (Migration nicht
  // gelaufen) oder die DB-Query aus anderen Gruenden scheitert, blenden
  // wir den Block einfach aus — die Landing-Page soll deswegen nicht
  // crashen.
  type ReviewRow = typeof externalReviews.$inferSelect;
  let rated: { rating: number | null; source: string }[] = [];
  let highlights: ReviewRow[] = [];
  let fallback: ReviewRow[] = [];
  try {
    rated = await db
      .select({
        rating: externalReviews.rating,
        source: externalReviews.source,
      })
      .from(externalReviews)
      .where(and(eq(externalReviews.published, true), isNotNull(externalReviews.rating)));

    if (rated.length === 0) return null;

    highlights = await db
      .select()
      .from(externalReviews)
      .where(and(eq(externalReviews.published, true), eq(externalReviews.highlight, true)))
      .orderBy(desc(externalReviews.reviewedAt))
      .limit(6);

    fallback =
      highlights.length >= 3
        ? []
        : await db
            .select()
            .from(externalReviews)
            .where(
              and(
                eq(externalReviews.published, true),
                isNotNull(externalReviews.text)
              )
            )
            .orderBy(desc(externalReviews.reviewedAt))
            .limit(6 - highlights.length);
  } catch (err) {
    // Tabelle existiert nicht / DB nicht erreichbar — Block ausblenden
    console.warn("[TrustBadge] DB-Query fehlgeschlagen — Block wird ausgeblendet:", err);
    return null;
  }

  const avg = rated.reduce((acc, r) => acc + (r.rating ?? 0), 0) / rated.length;
  const sources = Array.from(new Set(rated.map((r) => r.source))).map(
    (s) => SOURCE_LABELS[s as string] ?? s
  ).filter(Boolean);

  // De-duplicate (highlights kann mit fallback überlappen)
  const seen = new Set<string>();
  const carouselRaw = [...highlights, ...fallback].filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return r.text && r.text.length > 0;
  });

  // Plain-Serialize damit Client-Component sich nichts aus dem Drizzle-Row zieht
  const carouselItems = carouselRaw.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    text: r.text,
    relativeTime: r.relativeTime,
    source: r.source as string,
    sourceLabel: SOURCE_LABELS[r.source as string] ?? "",
    translated: r.translated,
    originalLanguage: r.originalLanguage,
  }));

  // Star-Repräsentation: bestimme volle/halbe Sterne
  const fullStars = Math.floor(avg);
  const halfStar = avg - fullStars >= 0.25 && avg - fullStars < 0.75;
  const showFull = avg - fullStars >= 0.75 ? fullStars + 1 : fullStars;

  return (
    <section className="py-20 sm:py-28 bg-[var(--color-wh-beige)]">
      <div className="max-w-[1080px] mx-auto px-6 sm:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <div className="eyebrow text-[var(--color-wh-deep-green)] mb-3">{c.eyebrow}</div>
          <h2
            className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 mb-6"
            style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.1 }}
          >
            {c.h2}
          </h2>

          {/* Average Stars */}
          <div className="inline-flex flex-col items-center gap-2 bg-white rounded-2xl px-8 py-6 shadow-[0_8px_30px_rgba(47,74,53,0.08)] border border-[var(--color-wh-winter-grey)]">
            <div className="flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => {
                const isFull = i < showFull;
                const isHalf = !isFull && i === fullStars && halfStar;
                return (
                  <Star
                    key={i}
                    size={26}
                    fill={isFull ? "currentColor" : isHalf ? "url(#half-gradient)" : "none"}
                    strokeWidth={1.5}
                  />
                );
              })}
              {/* SVG-Gradient für halbe Sterne (innerhalb des SVG-Symbols) */}
              <svg width="0" height="0" style={{ position: "absolute" }}>
                <defs>
                  <linearGradient id="half-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="text-3xl font-bold text-[var(--color-wh-deep-green)]">
              {avg.toFixed(1)}
              <span className="text-lg font-normal text-[var(--color-wh-fg-muted)] ml-1">/ 5</span>
            </div>
            <div className="text-sm text-[var(--color-wh-fg-muted)] m-0">
              {c.basedOn(rated.length)}
            </div>
            {sources.length > 0 && (
              <div className="text-xs text-[var(--color-wh-fg-muted)]/80 mt-1">
                {c.sourceLine(sources)}
              </div>
            )}
          </div>
        </div>

        {/* Carousel */}
        {carouselItems.length > 0 && (
          <div>
            <div className="text-center text-xs uppercase tracking-wider text-[var(--color-wh-deep-green)] font-semibold mb-6">
              {c.carouselH}
            </div>
            <ReviewCarousel items={carouselItems} locale={locale} />
          </div>
        )}
      </div>
    </section>
  );
}
