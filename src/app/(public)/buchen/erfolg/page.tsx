import Link from "next/link";
import { CheckCircle2, MapPin, Footprints, Backpack, Sparkles, ArrowRight } from "lucide-react";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";
import { RECOMMENDATIONS } from "../../empfehlungen/data";

export const metadata = { title: "Buchung erfolgreich · Wiesenhütte" };

type Copy = {
  title: string;
  bnLabel: string;
  body: string;
  hubEyebrow: string;
  hubH2: string;
  hubBody: string;
  cards: { title: string; body: string }[];
  hubCta: string;
  accountLink: string;
  recsTeaserEyebrow: string;
  recsTeaserH: string;
  recsTeaserBody: string;
  recsTeaserCta: string;
};

const COPY: Record<Locale, Copy> = {
  de: {
    title: "Vielen Dank — Eure Buchung ist da.",
    bnLabel: "Buchungsnummer:",
    body: "Eine Bestätigung mit allen Details ist unterwegs zu Eurer E-Mail-Adresse. Falls sie nicht innerhalb weniger Minuten ankommt, schaut bitte im Spam-Ordner nach.",
    hubEyebrow: "Damit Ihr gut vorbereitet seid",
    hubH2: "Was Ihr jetzt schon planen könnt.",
    hubBody: "Drei Tools, die wir Euch für die Zeit vor und während des Aufenthalts mitgeben.",
    cards: [
      { title: "Empfehlungen in der Region", body: "Restaurants, Einkauf, Notdienste, Ausflüge — kuratiert vom Vorstand." },
      { title: "Wandertouren mit GPX", body: "Routen direkt von der Hütte aus, downloadbar für Komoot & Garmin." },
      { title: "Deine Packliste", body: "Personalisiert nach Saison und Aktivität — druckbar als PDF." },
    ],
    hubCta: "Ansehen",
    accountLink: "Buchung in Deinem Konto ansehen →",
    recsTeaserEyebrow: "Vor Ort",
    recsTeaserH: "Was rund um die Hütte wirklich lohnt.",
    recsTeaserBody: "Wir haben für Euch alles zusammengestellt, was man sehen, essen und erleben sollte — vom Frühstücks-Bäcker um die Ecke bis zur olympischen Bobbahn. Handverlesen vom Vorstand.",
    recsTeaserCta: "Alle Empfehlungen entdecken",
  },
  en: {
    title: "Thanks — your booking is confirmed.",
    bnLabel: "Booking number:",
    body: "A confirmation with all details is on its way to your email. If it doesn't arrive within a few minutes, please check your spam folder.",
    hubEyebrow: "So you're well prepared",
    hubH2: "What you can already plan now.",
    hubBody: "Three small tools we hand you for the time before and during your stay.",
    cards: [
      { title: "Local recommendations", body: "Restaurants, shopping, emergency services, day trips — curated by the club board." },
      { title: "Hiking routes with GPX", body: "Routes straight from the cabin, downloadable for Komoot & Garmin." },
      { title: "Your packing list", body: "Personalised by season and activity — printable as PDF." },
    ],
    hubCta: "View",
    accountLink: "View booking in your account →",
    recsTeaserEyebrow: "On location",
    recsTeaserH: "What's really worth doing around the cabin.",
    recsTeaserBody: "We've curated everything you should see, eat and try — from the morning bakery around the corner to the Olympic bob run. Hand-picked by the board.",
    recsTeaserCta: "Discover all recommendations",
  },
  nl: {
    title: "Bedankt — je boeking is binnen.",
    bnLabel: "Boekingsnummer:",
    body: "Een bevestiging met alle details is onderweg naar je e-mail. Komt die niet binnen enkele minuten, kijk dan ook in je spam-map.",
    hubEyebrow: "Zodat jullie goed voorbereid zijn",
    hubH2: "Wat jullie nu al kunnen plannen.",
    hubBody: "Drie kleine tools voor de tijd vóór en tijdens jullie verblijf.",
    cards: [
      { title: "Lokale aanbevelingen", body: "Restaurants, winkels, noodhulp, uitstapjes — samengesteld door het bestuur." },
      { title: "Wandelroutes met GPX", body: "Routes direct vanaf de hut, te downloaden voor Komoot & Garmin." },
      { title: "Jouw paklijst", body: "Op maat per seizoen en activiteit — afdrukbaar als PDF." },
    ],
    hubCta: "Bekijken",
    accountLink: "Boeking in je account bekijken →",
    recsTeaserEyebrow: "Ter plaatse",
    recsTeaserH: "Wat rond de hut écht de moeite waard is.",
    recsTeaserBody: "We hebben voor je verzameld wat je moet zien, eten en doen — van de bakker om de hoek tot de Olympische bobbaan. Met de hand gekozen door het bestuur.",
    recsTeaserCta: "Alle aanbevelingen ontdekken",
  },
};

type Props = { searchParams: Promise<{ bn?: string }> };

export default async function ErfolgPage({ searchParams }: Props) {
  const locale = await getServerLocale();
  const c = COPY[locale];
  const { bn } = await searchParams;
  const cardHrefs = ["/empfehlungen", "/wandertouren", "/packliste"];
  const cardIcons = [MapPin, Footprints, Backpack];

  return (
    <div className="bg-[var(--color-wh-snow)] min-h-[60vh]">
      <section className="px-8 py-16 sm:py-20">
        <div className="max-w-[680px] mx-auto bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-8 sm:p-10 text-center">
          <CheckCircle2 className="text-[var(--color-wh-green)] mx-auto" size={64} strokeWidth={1.4} />
          <h1 className="text-[36px] sm:text-[40px] mt-6">{c.title}</h1>
          {bn && (
            <p className="text-[var(--color-wh-fg-muted)] m-0">
              {c.bnLabel} <strong className="text-[var(--color-wh-deep-green)]">{bn}</strong>
            </p>
          )}
          <p className="mt-4 text-[var(--color-wh-fg-muted)]">{c.body}</p>
        </div>
      </section>

      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-20">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow text-center">{c.hubEyebrow}</div>
          <h2 className="text-[28px] sm:text-[36px] mt-3 mb-3 leading-tight text-center text-[var(--color-wh-deep-green)] font-display font-bold">
            {c.hubH2}
          </h2>
          <p className="text-[var(--color-wh-fg-muted)] text-[15px] max-w-xl mx-auto mb-10 text-center">
            {c.hubBody}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {c.cards.map((card, i) => {
              const Icon = cardIcons[i];
              return (
                <Link
                  key={i}
                  href={cardHrefs[i]}
                  className="group block bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5 no-underline hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--color-wh-deep-green)]/10 text-[var(--color-wh-deep-green)] flex items-center justify-center mb-3">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-display font-bold text-[18px] text-[var(--color-wh-deep-green)] m-0 mb-2 leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-[13px] sm:text-[14px] text-[var(--color-wh-black)] m-0 mb-3">
                    {card.body}
                  </p>
                  <span className="text-[13px] text-[var(--color-wh-deep-green)] font-semibold group-hover:translate-x-1 inline-block transition-transform">
                    {c.hubCta} →
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/konto"
              className="text-[14px] text-[var(--color-wh-deep-green)] font-semibold no-underline hover:underline"
            >
              {c.accountLink}
            </Link>
          </div>
        </div>
      </section>

      {/* ============= EMPFEHLUNGEN-TEASER ============= */}
      <section className="relative overflow-hidden bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-6 sm:px-8 py-20 sm:py-28">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(247,247,242,0.5) 0px, transparent 60%), radial-gradient(circle at 80% 70%, rgba(247,247,242,0.3) 0px, transparent 50%)",
          }}
        />
        <div className="relative max-w-[1080px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: Text */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-[11px] uppercase tracking-[0.2em] font-semibold mb-6">
              <Sparkles size={12} />
              {c.recsTeaserEyebrow}
            </div>
            <h2
              className="font-display font-extrabold m-0 mb-5 leading-[1.05] text-[var(--color-wh-snow)]"
              style={{ fontSize: "clamp(32px, 4.5vw, 52px)", letterSpacing: "-0.02em" }}
            >
              {c.recsTeaserH}
            </h2>
            <p className="text-[var(--color-wh-snow)]/85 text-base sm:text-lg leading-relaxed m-0 mb-8 max-w-lg">
              {c.recsTeaserBody}
            </p>
            <Link
              href="/empfehlungen"
              className="inline-flex items-center gap-2 h-12 sm:h-13 px-6 sm:px-7 rounded-full bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] font-semibold no-underline hover:bg-white transition-all shadow-[var(--shadow-float)]"
            >
              {c.recsTeaserCta}
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Right: Stack of fanned-out preview cards */}
          <div className="relative h-[340px] sm:h-[400px]">
            {RECOMMENDATIONS.slice(0, 4).map((r, i) => {
              const rotations = [-8, -2, 4, 10];
              const offsets = [
                { x: 0, y: 0 },
                { x: 36, y: 18 },
                { x: 72, y: 36 },
                { x: 108, y: 54 },
              ];
              const o = offsets[i] ?? { x: 0, y: 0 };
              return (
                <div
                  key={r.id}
                  className={`absolute top-0 left-1/2 transition-transform duration-500 hover:translate-y-[-8px] hover:rotate-0 hover:z-50`}
                  style={{
                    transform: `translate(calc(-50% + ${o.x}px), ${o.y}px) rotate(${rotations[i]}deg)`,
                    zIndex: i + 1,
                  }}
                >
                  <div
                    className={`relative w-[180px] sm:w-[220px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white shadow-[0_12px_40px_rgba(0,0,0,0.25)] bg-gradient-to-br ${r.gradient}`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="leading-none select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                        style={{ fontSize: "clamp(60px, 10vw, 110px)" }}
                      >
                        {r.emoji}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent">
                      <div className="text-white font-semibold text-xs sm:text-sm leading-tight line-clamp-2">
                        {r.name}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
