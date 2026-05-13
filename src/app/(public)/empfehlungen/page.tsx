import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  Phone,
  ExternalLink,
  Snowflake,
  Sun,
  ArrowDownRight,
  MapPin,
  Compass,
} from "lucide-react";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";
import {
  RECOMMENDATIONS,
  CATEGORY_META,
  CATEGORY_COPY,
  CATEGORY_ORDER,
  type Recommendation,
} from "./data";
import { ScrollReveal, StickyCategoryNav, ParallaxLayer, TiltCard } from "./RecsClient";

export const dynamic = "force-static";
export const metadata = {
  title: "Empfehlungen rund um die Hütte · Wiesenhütte",
  description:
    "Kuratierte Tipps für Euren Aufenthalt: Restaurants, Abenteuer, Highlights und alles, was Ihr fürs Ankommen und im Notfall braucht.",
};

const PAGE_COPY: Record<
  Locale,
  {
    eyebrow: string;
    h1l1: string;
    h1l2: string;
    lead: string;
    statsLabel1: string;
    statsLabel2: string;
    statsLabel3: string;
    scrollHint: string;
    insiderLabel: string;
    drivingTime: (min: number) => string;
    distanceWord: string;
    visitWebsite: string;
    callPhone: string;
    season_winter: string;
    season_summer: string;
    season_all: string;
    ctaH2: string;
    ctaBody: string;
    ctaBack: string;
    footnoteEyebrow: string;
    footnoteH: string;
    footnoteBody: string;
    onTheCabin: string;
  }
> = {
  de: {
    eyebrow: "Vor Ort",
    h1l1: "Wenn Ihr da seid,",
    h1l2: "macht das hier.",
    lead: "Handverlesene Orte rund um die Hütte. Keine Affiliate-Links, keine Ads — nur das, wo der Vorstand selbst hingeht, wenn er da ist.",
    statsLabel1: "Orte",
    statsLabel2: "Minuten Umkreis",
    statsLabel3: "Kategorien",
    scrollHint: "weiterscrollen",
    insiderLabel: "Vorstand-Tipp",
    drivingTime: (min: number) => `${min} Min mit dem Auto`,
    distanceWord: "Entfernung",
    visitWebsite: "Website",
    callPhone: "Anrufen",
    season_winter: "Winter-Tipp",
    season_summer: "Sommer-Tipp",
    season_all: "Ganzjährig",
    ctaH2: "Plant's mit Eurer Gruppe.",
    ctaBody: "Macht aus dieser Seite einen WhatsApp-Plan: Wer geht ins WAVE, wer auf den Asten, wer holt morgens Brötchen?",
    ctaBack: "Zurück zur Hütte",
    footnoteEyebrow: "Mit Liebe gemacht",
    footnoteH: "Diese Liste lebt.",
    footnoteBody: "Wenn Ihr einen Ort vermisst oder eine Empfehlung habt, schreibt uns — sie wandert in die nächste Version. Empfehlungen vom letzten Gast werden zuerst aufgenommen.",
    onTheCabin: "Auf der Hütte",
  },
  en: {
    eyebrow: "On location",
    h1l1: "Once you're here,",
    h1l2: "do this.",
    lead: "Hand-picked places around the cabin. No affiliate links, no ads — just what the club board itself goes to when they're up here.",
    statsLabel1: "places",
    statsLabel2: "minutes radius",
    statsLabel3: "categories",
    scrollHint: "scroll on",
    insiderLabel: "Board's tip",
    drivingTime: (min: number) => `${min} min by car`,
    distanceWord: "distance",
    visitWebsite: "Website",
    callPhone: "Call",
    season_winter: "Winter pick",
    season_summer: "Summer pick",
    season_all: "Year-round",
    ctaH2: "Plan it with your group.",
    ctaBody: "Turn this page into a WhatsApp plan: who goes to the WAVE, who climbs the Asten, who grabs morning rolls?",
    ctaBack: "Back to the cabin",
    footnoteEyebrow: "Made with care",
    footnoteH: "This list is alive.",
    footnoteBody: "If you're missing a place or have a recommendation, drop us a line — it'll move into the next version. Guest tips get priority.",
    onTheCabin: "At the cabin",
  },
  nl: {
    eyebrow: "Ter plaatse",
    h1l1: "Als jullie er zijn,",
    h1l2: "doe dán dit.",
    lead: "Met de hand gekozen plekken rond de hut. Geen affiliate-links, geen advertenties — alleen wat het bestuur zelf bezoekt als ze hier zijn.",
    statsLabel1: "plekken",
    statsLabel2: "minuten radius",
    statsLabel3: "categorieën",
    scrollHint: "verder scrollen",
    insiderLabel: "Bestuurstip",
    drivingTime: (min: number) => `${min} min met de auto`,
    distanceWord: "afstand",
    visitWebsite: "Website",
    callPhone: "Bellen",
    season_winter: "Wintertip",
    season_summer: "Zomertip",
    season_all: "Het hele jaar",
    ctaH2: "Plan het met je groep.",
    ctaBody: "Maak van deze pagina een WhatsApp-plan: wie gaat naar de WAVE, wie de Asten op, wie haalt 's ochtends broodjes?",
    ctaBack: "Terug naar de hut",
    footnoteEyebrow: "Met zorg gemaakt",
    footnoteH: "Deze lijst leeft.",
    footnoteBody: "Mis je een plek of heb je een aanbeveling? Laat het ons weten — komt mee in de volgende versie. Gastentips krijgen voorrang.",
    onTheCabin: "In de hut",
  },
};

export default async function EmpfehlungenPage() {
  const locale = await getServerLocale();
  const pc = PAGE_COPY[locale];
  const catCopy = CATEGORY_COPY[locale];

  const total = RECOMMENDATIONS.length;
  const maxMin = Math.max(...RECOMMENDATIONS.map((r) => r.distanceMinutesByCar));

  // Sticky-Nav-Items
  const navItems = CATEGORY_ORDER.filter((cat) =>
    RECOMMENDATIONS.some((r) => r.category === cat)
  ).map((cat) => ({
    id: cat,
    label: catCopy[cat].label,
    emoji: CATEGORY_META[cat].emoji,
    number: CATEGORY_META[cat].number,
  }));

  return (
    <div className="bg-[var(--color-wh-snow)] overflow-x-clip">
      <StickyCategoryNav categories={navItems} locale={locale} />

      {/* ============= HERO ============= */}
      <section className="relative h-[88vh] min-h-[640px] overflow-hidden">
        {/* Parallax-Background: weicher Farbverlauf + Berge-Silhouette aus SVG */}
        <ParallaxLayer speed={0.3}>
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-wh-deep-green)] via-[var(--color-wh-green)] to-[var(--color-wh-deep-green)]" />
          <div
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 30%, rgba(247,247,242,0.5) 0px, transparent 50%), radial-gradient(circle at 75% 65%, rgba(247,247,242,0.35) 0px, transparent 45%)",
            }}
          />
          {/* Subtile Berge-Silhouette als CSS */}
          <svg
            className="absolute bottom-0 left-0 w-full opacity-25"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ height: "55%" }}
            aria-hidden
          >
            <path
              fill="rgba(17,17,17,0.4)"
              d="M0,224 L120,160 L240,200 L360,120 L480,180 L600,80 L720,150 L840,90 L960,170 L1080,110 L1200,200 L1320,140 L1440,200 L1440,320 L0,320 Z"
            />
          </svg>
          <svg
            className="absolute bottom-0 left-0 w-full opacity-40"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ height: "35%" }}
            aria-hidden
          >
            <path
              fill="rgba(17,17,17,0.35)"
              d="M0,260 L160,210 L320,250 L480,200 L640,240 L800,210 L960,260 L1120,220 L1280,250 L1440,230 L1440,320 L0,320 Z"
            />
          </svg>
        </ParallaxLayer>

        <div className="relative h-full max-w-[1280px] mx-auto px-6 sm:px-8 flex flex-col justify-end pb-16 sm:pb-24 z-10">
          <ScrollReveal>
            <div className="inline-block px-3 py-1.5 rounded-full bg-[var(--color-wh-snow)]/15 backdrop-blur-md border border-[var(--color-wh-snow)]/30 text-[var(--color-wh-snow)] text-[11px] uppercase tracking-[0.2em] font-semibold mb-6">
              {pc.eyebrow}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <h1
              className="font-display font-extrabold uppercase tracking-tight text-[var(--color-wh-snow)] m-0 leading-[0.92]"
              style={{
                fontSize: "clamp(48px, 8.5vw, 124px)",
                letterSpacing: "-0.03em",
              }}
            >
              {pc.h1l1}
              <br />
              <span className="text-[var(--color-wh-sunset)]">{pc.h1l2}</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={280}>
            <p className="text-[var(--color-wh-snow)]/90 text-base sm:text-[19px] leading-relaxed max-w-xl mt-8 m-0 drop-shadow">
              {pc.lead}
            </p>
          </ScrollReveal>

          {/* Stats */}
          <ScrollReveal delay={420}>
            <div className="mt-12 flex flex-wrap items-baseline gap-x-10 gap-y-4">
              <Stat n={total} label={pc.statsLabel1} />
              <Stat n={maxMin} label={pc.statsLabel2} suffix="" />
              <Stat n={navItems.length} label={pc.statsLabel3} />
            </div>
          </ScrollReveal>

          {/* Scroll hint */}
          <ScrollReveal delay={620}>
            <div className="absolute bottom-8 right-6 sm:right-8 flex items-center gap-2 text-[var(--color-wh-snow)]/80 text-xs uppercase tracking-[0.2em] font-semibold">
              <span className="hidden sm:inline">{pc.scrollHint}</span>
              <ArrowDownRight size={18} className="animate-bounce" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============= KATEGORIE-SECTIONS ============= */}
      {CATEGORY_ORDER.map((cat) => {
        const items = RECOMMENDATIONS.filter((r) => r.category === cat);
        if (items.length === 0) return null;
        const meta = CATEGORY_META[cat];
        const cc = catCopy[cat];

        return (
          <section
            key={cat}
            id={`cat-${cat}`}
            className="relative px-6 sm:px-8 pt-24 sm:pt-32 pb-20 sm:pb-28 scroll-mt-24"
          >
            {/* Color-Band oben (subtil) */}
            <div
              className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${meta.colorBand}`}
              aria-hidden
            />

            <div className="max-w-[1280px] mx-auto">
              {/* Category-Header — riesige Number + Label */}
              <ScrollReveal>
                <div className="flex items-end gap-6 sm:gap-10 mb-12 sm:mb-16">
                  <div
                    className="font-display font-extrabold leading-none text-transparent select-none"
                    style={{
                      fontSize: "clamp(80px, 12vw, 180px)",
                      WebkitTextStroke: "1.5px var(--color-wh-deep-green)",
                      letterSpacing: "-0.05em",
                    }}
                  >
                    {meta.number}
                  </div>
                  <div className="pb-2 sm:pb-4 flex-1 min-w-0">
                    <div className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-[var(--color-wh-deep-green)]/70 mb-2">
                      {meta.emoji} {cc.description}
                    </div>
                    <h2
                      className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 leading-[0.95]"
                      style={{ fontSize: "clamp(34px, 5.5vw, 76px)", letterSpacing: "-0.02em" }}
                    >
                      {cc.label}
                    </h2>
                  </div>
                </div>
              </ScrollReveal>

              {/* Cards — alternierender Layout (links/rechts) */}
              <div className="space-y-10 sm:space-y-14">
                {items.map((r, idx) => (
                  <ScrollReveal key={r.id} delay={(idx % 3) * 100} as="article">
                    <RecCard rec={r} idx={idx} locale={locale} pc={pc} />
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* ============= CTA ============= */}
      <section className="relative px-6 sm:px-8 py-24 sm:py-32 bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(247,247,242,0.4) 0px, transparent 60%)",
          }}
        />
        <div className="relative max-w-[800px] mx-auto text-center">
          <ScrollReveal>
            <Compass size={42} className="mx-auto mb-6 opacity-80" strokeWidth={1.2} />
            <h2
              className="font-display font-bold m-0 mb-5 leading-tight text-[var(--color-wh-snow)]"
              style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-0.02em" }}
            >
              {pc.ctaH2}
            </h2>
            <p className="text-[var(--color-wh-snow)]/85 text-base sm:text-lg leading-relaxed m-0 mb-10 max-w-xl mx-auto">
              {pc.ctaBody}
            </p>
            <Link
              href="/huette"
              className="inline-flex items-center gap-2 h-13 sm:h-14 px-7 sm:px-9 rounded-full bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] font-semibold no-underline hover:bg-white transition-all shadow-[var(--shadow-float)]"
            >
              {pc.ctaBack}
              <ArrowDownRight size={18} className="-rotate-90" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ============= FOOTNOTE ============= */}
      <section className="px-6 sm:px-8 py-16 sm:py-20 bg-[var(--color-wh-beige)]">
        <div className="max-w-[680px] mx-auto text-center">
          <ScrollReveal>
            <div className="eyebrow text-[var(--color-wh-deep-green)] mb-3">{pc.footnoteEyebrow}</div>
            <h3 className="font-display font-bold text-[var(--color-wh-deep-green)] text-2xl sm:text-3xl m-0 mb-4">
              {pc.footnoteH}
            </h3>
            <p className="text-[var(--color-wh-black)]/80 text-sm sm:text-base m-0 leading-relaxed">
              {pc.footnoteBody}
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

// ============= HELPER-COMPONENTS =============

const Stat = ({ n, label, suffix = "" }: { n: number; label: string; suffix?: string }) => (
  <div className="flex flex-col gap-1">
    <span
      className="font-display font-extrabold text-[var(--color-wh-snow)] leading-none tabular-nums"
      style={{ fontSize: "clamp(40px, 5vw, 64px)" }}
    >
      {n}
      {suffix}
    </span>
    <span className="text-[var(--color-wh-snow)]/70 text-[11px] uppercase tracking-[0.2em] font-semibold">
      {label}
    </span>
  </div>
);

const RecCard = ({
  rec,
  idx,
  locale,
  pc,
}: {
  rec: Recommendation;
  idx: number;
  locale: Locale;
  pc: (typeof PAGE_COPY)[Locale];
}) => {
  const isOdd = idx % 2 === 1;
  const seasonLabel =
    rec.season === "winter"
      ? pc.season_winter
      : rec.season === "summer"
        ? pc.season_summer
        : pc.season_all;
  const SeasonIcon = rec.season === "winter" ? Snowflake : rec.season === "summer" ? Sun : Compass;
  const hasImage = !!rec.imageUrl;

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center ${
        isOdd ? "md:[&>.media]:order-2" : ""
      }`}
    >
      {/* Media-Slot */}
      <div className="media md:col-span-5">
        <TiltCard className="relative">
          <div
            className={`relative aspect-[4/3] rounded-[28px] overflow-hidden border border-[var(--color-wh-winter-grey)] shadow-[0_20px_50px_rgba(47,74,53,0.12)] ${
              hasImage ? "bg-[var(--color-wh-beige)]" : `bg-gradient-to-br ${rec.gradient}`
            }`}
          >
            {hasImage ? (
              <>
                <Image
                  src={rec.imageUrl!}
                  alt={rec.name}
                  fill
                  sizes="(min-width: 1024px) 480px, (min-width: 768px) 45vw, 92vw"
                  className="object-cover"
                  unoptimized={false}
                />
                {/* Subtiler Gradient unten fuer Badge-Lesbarkeit */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.35) 100%)",
                  }}
                  aria-hidden
                />
                {/* Kleines Emoji als Akzent oben rechts */}
                <div className="absolute top-4 right-4 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md text-xl">
                  <span aria-hidden>{rec.emoji}</span>
                </div>
              </>
            ) : (
              <>
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6) 0px, transparent 40%), radial-gradient(circle at 70% 70%, rgba(0,0,0,0.05) 0px, transparent 40%)",
                  }}
                  aria-hidden
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="leading-none select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                    style={{ fontSize: "clamp(80px, 14vw, 180px)" }}
                  >
                    {rec.emoji}
                  </span>
                </div>
              </>
            )}

            {/* Top-left Badge: Season */}
            <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-white text-[var(--color-wh-deep-green)] text-[11px] font-semibold uppercase tracking-wider shadow-sm">
              <SeasonIcon size={12} />
              {seasonLabel}
            </div>
            {/* Bottom-right Badge: Drive Time */}
            <div className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-xs font-bold shadow-md">
              <Clock size={12} />
              {pc.drivingTime(rec.distanceMinutesByCar)}
            </div>
          </div>
        </TiltCard>

        {/* CC-Attribution sehr klein unter dem Bild */}
        {rec.imageAttribution && (
          <p className="text-[10px] text-[var(--color-wh-fg-muted)]/70 mt-2 text-right m-0">
            {rec.imageAttribution}
          </p>
        )}
      </div>

      {/* Text */}
      <div className="md:col-span-7">
        <h3
          className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 mb-3 leading-[1.05]"
          style={{ fontSize: "clamp(26px, 3.5vw, 42px)", letterSpacing: "-0.015em" }}
        >
          {rec.name}
        </h3>
        <p className="text-[var(--color-wh-deep-green)]/80 font-medium text-base sm:text-lg leading-snug m-0 mb-5">
          {rec.tagline[locale]}
        </p>
        <p className="text-[var(--color-wh-black)] text-[15px] sm:text-base leading-relaxed m-0 mb-6 max-w-2xl">
          {rec.description[locale]}
        </p>

        {rec.insiderTip?.[locale] && (
          <div className="relative bg-[var(--color-wh-beige)] border-l-4 border-[var(--color-wh-sunset)] rounded-r-lg p-4 mb-6 max-w-xl">
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--color-wh-sunset)] mb-1">
              ⚡ {pc.insiderLabel}
            </div>
            <p className="text-[14px] sm:text-[15px] text-[var(--color-wh-black)] m-0 leading-relaxed italic">
              {rec.insiderTip[locale]}
            </p>
          </div>
        )}

        {/* Meta-Row */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[var(--color-wh-fg-muted)] mb-5">
          <a
            href={rec.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[var(--color-wh-deep-green)] font-semibold no-underline hover:underline"
          >
            <MapPin size={14} />
            {rec.address}
          </a>
        </div>

        {/* Action-Buttons */}
        <div className="flex flex-wrap gap-2">
          {rec.websiteUrl && (
            <a
              href={rec.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold no-underline hover:opacity-90 transition-opacity"
            >
              {pc.visitWebsite}
              <ExternalLink size={13} />
            </a>
          )}
          {rec.phone && (
            <a
              href={`tel:${rec.phone}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] text-sm font-semibold no-underline hover:bg-[var(--color-wh-green-soft)] transition-colors"
            >
              <Phone size={13} />
              {rec.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
