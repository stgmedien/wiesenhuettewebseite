import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getServerLocale } from "@/lib/i18n";
import { makeT, type Locale } from "@/lib/i18n-shared";
import { loadTrustData, type TrustData } from "@/lib/trust-reviews";
import { TrustBadgeButton } from "@/components/public/TrustBadgeButton";
import { EditorialGallery } from "@/components/public/landing/EditorialGallery";
import { PullQuote } from "@/components/public/landing/PullQuote";
import { ScrollStory } from "@/components/public/landing/ScrollStory";
import { HistoryTimeline } from "@/components/public/landing/HistoryTimeline";
import { HuettenbuchSection } from "@/components/public/landing/HuettenbuchSection";

// Hero zeigt aktuelle Trust-Daten (DB-Aggregat) — keine Static-Render-Cache,
// damit Manager-seitige Aenderungen (Reviews ein/ausblenden) sofort sichtbar
// werden.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getServerLocale();
  const tr = makeT(locale);
  const trust = await loadTrustData();
  return (
    <div>
      <Hero tr={tr} trust={trust} locale={locale} />
      <IntroBlock tr={tr} />
      <EditorialGallery locale={locale} />
      <PullQuote locale={locale} />
      <ScrollStory locale={locale} />
      <HistoryTimeline locale={locale} />
      <HuettenbuchSection locale={locale} />
      <CTABand tr={tr} />
    </div>
  );
}

type Tr = (key: string) => string;

const Hero = ({
  tr,
  trust,
  locale,
}: {
  tr: Tr;
  trust: TrustData;
  locale: Locale;
}) => (
  <section className="relative h-[600px] sm:h-[680px] overflow-hidden">
    <video
      autoPlay
      loop
      muted
      playsInline
      preload="none"
      poster="/media/video/hero-poster.jpg"
      className="absolute inset-0 w-full h-full object-cover"
      style={{ filter: "saturate(0.95) contrast(1.02)" }}
    >
      {/* WebM zuerst (kleiner), MP4 als Fallback. preload="none" → das
          Posterbild paintet sofort, das Video laedt nachgelagert und
          blockt nicht mehr First Paint / die uebrigen Assets. */}
      <source src="/media/video/hero.webm" type="video/webm" />
      <source src="/media/video/hero.mp4" type="video/mp4" />
    </video>
    <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-black/65" />
    <div className="relative max-w-[1320px] mx-auto px-6 sm:px-8 pt-24 pb-16 flex flex-col items-start gap-6 sm:gap-7 h-full justify-end">
      {/* Editorial Meta-Issue-Zeile im Magazin-Stil */}
      <div className="text-[11px] sm:text-[12px] uppercase tracking-[0.3em] font-semibold text-[var(--color-wh-snow)]/85 drop-shadow flex items-center gap-3">
        <span
          className="inline-block w-6 h-px bg-[var(--color-wh-snow)]/60"
          aria-hidden
        />
        {tr("home.hero.issue")}
      </div>
      <h1
        className="font-display font-extrabold uppercase tracking-tight text-[var(--color-wh-snow)] m-0 drop-shadow-lg"
        style={{
          fontSize: "clamp(40px, 7vw, 96px)",
          lineHeight: 0.95,
          letterSpacing: "-0.025em",
        }}
      >
        {tr("home.hero.h1.l1")}
        <br />
        {tr("home.hero.h1.l2")}
      </h1>
      <p className="text-base sm:text-[19px] leading-relaxed text-[var(--color-wh-snow)]/95 m-0 max-w-xl drop-shadow">
        {tr("home.hero.lead")}
      </p>
      <div className="flex gap-3 flex-wrap items-center">
        <Link
          href="/buchen"
          className="inline-flex h-13 sm:h-14 px-6 sm:px-7 items-center gap-2.5 rounded-[var(--radius-btn)] bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] font-semibold no-underline hover:bg-white transition-all shadow-[var(--shadow-float)] hover:shadow-[var(--shadow-deep)]"
        >
          {tr("home.hero.cta.book")}
          <ArrowRight size={18} />
        </Link>
        <Link
          href="/huette"
          className="inline-flex h-13 sm:h-14 px-6 sm:px-7 items-center rounded-[var(--radius-btn)] font-semibold no-underline transition-colors backdrop-blur-sm"
          style={{
            background: "rgba(17,17,17,0.4)",
            color: "var(--color-wh-snow)",
            border: "1px solid rgba(247,247,242,0.7)",
          }}
        >
          {tr("home.hero.cta.more")}
        </Link>
        <TrustBadgeButton trust={trust} locale={locale} variant="hero" />
      </div>
    </div>
    <div className="absolute right-6 top-6 sm:right-8 sm:top-8 text-[var(--color-wh-snow)] text-xs uppercase tracking-[0.18em] opacity-90 drop-shadow">
      {tr("home.hero.tagline")}
    </div>
  </section>
);

const IntroBlock = ({ tr }: { tr: Tr }) => (
  <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-20 sm:py-32">
    <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-start">
      <div>
        <div className="eyebrow">{tr("home.intro.eyebrow")}</div>
        <h2 className="text-[40px] sm:text-[56px] font-display font-bold leading-[1.02] tracking-tight text-[var(--color-wh-deep-green)] mt-4 mb-0">
          {tr("home.intro.h2")}
        </h2>
      </div>
      <div className="md:pt-7">
        <p className="text-base sm:text-[18px] leading-[1.7] text-[var(--color-wh-black)]">
          {tr("home.intro.p1")}
        </p>
        <p className="text-base sm:text-[18px] leading-[1.7] text-[var(--color-wh-fg-muted)] mt-5">
          {tr("home.intro.p2")}
        </p>
      </div>
    </div>
  </section>
);

const CTABand = ({ tr }: { tr: Tr }) => (
  <section className="relative overflow-hidden text-[var(--color-wh-snow)] py-16 sm:py-24 px-6 sm:px-8 bg-[linear-gradient(135deg,var(--color-wh-deep-green)_0%,var(--color-wh-deep-green-hover)_100%)]">
    {/* Leichter, weicher Lichtschein oben links + feines Film-Noise.
        mix-blend-soft-light haelt das Korn dezent ueber dem Gruen. */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(120% 80% at 15% 0%, rgba(247,247,242,0.10), rgba(247,247,242,0) 60%)",
      }}
    />
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-soft-light"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundRepeat: "repeat",
      }}
    />
    <div className="relative z-10 max-w-[1080px] mx-auto flex flex-col md:flex-row gap-6 md:gap-8 md:items-end justify-between">
      <div>
        <div className="eyebrow text-[var(--color-wh-snow)]/80">{tr("home.cta.eyebrow")}</div>
        <h2 className="text-[36px] sm:text-[44px] font-display font-bold tracking-tight m-0 mt-3 text-[var(--color-wh-snow)]">
          {tr("home.cta.h2")}
        </h2>
        <p className="text-[var(--color-wh-snow)]/85 max-w-md mt-3 leading-relaxed">
          {tr("home.cta.body")}
        </p>
      </div>
      <Link
        href="/buchen"
        className="inline-flex h-13 sm:h-14 px-6 sm:px-7 items-center gap-2.5 rounded-[var(--radius-btn)] bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] font-semibold no-underline hover:bg-white transition-colors w-fit"
      >
        {tr("home.hero.cta.book")}
        <ArrowRight size={18} />
      </Link>
    </div>
  </section>
);
