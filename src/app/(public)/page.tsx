import Link from "next/link";
import Image from "next/image";
import {
  Users,
  MountainSnow,
  Route,
  CookingPot,
  Armchair,
  Flame,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    Icon: Users,
    eye: "Gemeinschaft",
    title: "33 Schlafplätze",
    body: "Platz für Familien, Vereine, Schulklassen und Gruppen. Mindestbelegung 10 Personen.",
  },
  {
    Icon: MountainSnow,
    eye: "Direkt am Haus",
    title: "Rodelhang",
    body: "Eigener kleiner Hang neben der Hütte — raus aus der Tür, rein in den Schnee.",
  },
  {
    Icon: Route,
    eye: "Fußläufig",
    title: "Loipe & Rothaarsteig",
    body: "Langlaufloipen direkt im Ort, Wanderwege durchs Hochsauerland ab der Haustür.",
  },
  {
    Icon: CookingPot,
    eye: "Selbstversorgung",
    title: "Großküche",
    body: "Voll ausgestattet — zwei Herde, Backofen, Spülmaschine, ausreichend Geschirr für Gruppen.",
  },
  {
    Icon: Armchair,
    eye: "Drinnen",
    title: "Zwei Aufenthaltsräume",
    body: "Esszimmer mit Platz für die ganze Gruppe und ein zweiter Raum für Spiele, Projekte, Gespräche.",
  },
  {
    Icon: Flame,
    eye: "Draußen",
    title: "Feuerstelle & Freisitz",
    body: "Selbstgebaute Feuerstelle, Baumbank, Sitzgruppen — Sauerländer Hügel als Kulisse.",
  },
];

export default function HomePage() {
  return (
    <div>
      <Hero />
      <IntroBlock />
      <FeatureGrid />
      <HistoryTeaser />
      <CTABand />
    </div>
  );
}

const Hero = () => (
  <section className="relative h-[600px] sm:h-[680px] overflow-hidden">
    <video
      autoPlay
      loop
      muted
      playsInline
      poster="/media/video/hero-poster.jpg"
      className="absolute inset-0 w-full h-full object-cover"
      style={{ filter: "saturate(0.95) contrast(1.02)" }}
    >
      <source src="/media/video/hero.mp4" type="video/mp4" />
    </video>
    <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-black/65" />
    <div className="relative max-w-[1320px] mx-auto px-6 sm:px-8 pt-24 pb-16 flex flex-col items-start gap-6 sm:gap-7 h-full justify-end">
      <h1
        className="font-display font-extrabold uppercase tracking-tight text-[var(--color-wh-snow)] m-0 drop-shadow-lg"
        style={{
          fontSize: "clamp(40px, 7vw, 96px)",
          lineHeight: 0.95,
          letterSpacing: "-0.025em",
        }}
      >
        Draußen kalt.
        <br />
        Drinnen gemeinsam.
      </h1>
      <p className="text-base sm:text-[19px] leading-relaxed text-[var(--color-wh-snow)]/95 m-0 max-w-xl drop-shadow">
        Die Wiesenhütte der Skifreunde Gütersloh in Langewiese — seit 1956 ein einfacher,
        naturnaher Aufenthaltsort für Familien, Vereine und Schulklassen im Hochsauerland.
      </p>
      <div className="flex gap-3 flex-wrap">
        <Link
          href="/buchen"
          className="inline-flex h-13 sm:h-14 px-6 sm:px-7 items-center gap-2.5 rounded-[var(--radius-btn)] bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] font-semibold no-underline hover:bg-white transition-all shadow-[var(--shadow-float)] hover:shadow-[var(--shadow-deep)]"
        >
          Verfügbarkeit prüfen
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
          Mehr über die Hütte
        </Link>
      </div>
    </div>
    <div className="absolute right-6 top-6 sm:right-8 sm:top-8 text-[var(--color-wh-snow)] text-xs uppercase tracking-[0.18em] opacity-90 drop-shadow">
      Langewiese · Hochsauerland · Seit 1956
    </div>
  </section>
);

const IntroBlock = () => (
  <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-20 sm:py-32">
    <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-start">
      <div>
        <div className="eyebrow">Was die Wiesenhütte ist</div>
        <h2 className="text-[40px] sm:text-[56px] font-display font-bold leading-[1.02] tracking-tight text-[var(--color-wh-deep-green)] mt-4 mb-0">
          Keine Designunterkunft. Eine echte Vereinshütte.
        </h2>
      </div>
      <div className="md:pt-7">
        <p className="text-base sm:text-[18px] leading-[1.7] text-[var(--color-wh-black)]">
          Verwittertes Holz, robuste Etagenbetten, eine Großküche zum Selbstkochen, zwei
          Aufenthaltsräume und ein Skikeller voller Winterspuren.
        </p>
        <p className="text-base sm:text-[18px] leading-[1.7] text-[var(--color-wh-fg-muted)] mt-5">
          Seit 1956 oberhalb von Langewiese — gebaut von Vereinsmitgliedern in Eigenleistung,
          mehrfach erweitert, getragen von Generationen. Ein Ort für Gruppen, die nicht nur
          übernachten wollen, sondern zusammen kochen, wandern, an der Feuerstelle sitzen.
        </p>
      </div>
    </div>
  </section>
);

const FeatureGrid = () => (
  <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 pb-20 sm:pb-32">
    <div className="max-w-[1280px] mx-auto">
      <div className="flex flex-col gap-3.5 mb-10 sm:mb-14">
        <div className="eyebrow">Auf einen Blick</div>
        <h2 className="text-[36px] sm:text-[44px] font-display font-bold tracking-tight text-[var(--color-wh-deep-green)] m-0">
          Was Euch hier erwartet.
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <article
            key={f.title}
            className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 sm:p-7 flex flex-col gap-3"
          >
            <f.Icon
              size={28}
              strokeWidth={1.6}
              className="text-[var(--color-wh-deep-green)]"
            />
            <div className="eyebrow">{f.eye}</div>
            <h4 className="font-display font-semibold text-[22px] sm:text-[24px] text-[var(--color-wh-deep-green)] m-0">
              {f.title}
            </h4>
            <p className="m-0 text-[var(--color-wh-fg-muted)] leading-relaxed">{f.body}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const HistoryTeaser = () => (
  <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-20 sm:py-32">
    <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-10 md:gap-16 items-center">
      <div className="relative aspect-[4/5] rounded-[var(--radius-card)] overflow-hidden">
        <Image
          src="/media/historical/founders.jpg"
          alt="Historisches Foto der Skifreunde Gütersloh"
          fill
          className="object-cover"
          sizes="(min-width: 768px) 460px, 100vw"
        />
      </div>
      <div>
        <div className="eyebrow">Seit 1949</div>
        <h2 className="text-[36px] sm:text-[44px] font-display font-bold leading-tight tracking-tight mt-4 mb-5">
          Über sieben Jahrzehnte Vereinsleben.
        </h2>
        <p className="text-base sm:text-[17px] leading-[1.7] text-[var(--color-wh-black)] m-0">
          Im Oktober 1949 trafen sich 124 Skibegeisterte in Gütersloh und gründeten den Verein.
          1956 erwarben die Skifreunde die Hütte in Langewiese, anfangs für 15 Übernachtungen.
          Heute: 33 Schlafplätze, fünf Schlafzimmer, eine selbstgebaute Feuerstelle vor der Tür —
          und eine Hütte, die durch ehrenamtliche Arbeit lebt.
        </p>
        <Link
          href="/verein"
          className="inline-flex mt-6 h-12 px-5 items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] no-underline font-semibold hover:bg-[var(--color-wh-deep-green-hover)] transition-colors"
        >
          Vereinsgeschichte lesen <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  </section>
);

const CTABand = () => (
  <section className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] py-16 sm:py-24 px-6 sm:px-8">
    <div className="max-w-[1080px] mx-auto flex flex-col md:flex-row gap-6 md:gap-8 md:items-end justify-between">
      <div>
        <div className="eyebrow text-[var(--color-wh-snow)]/80">Jetzt buchen</div>
        <h2 className="text-[36px] sm:text-[44px] font-display font-bold tracking-tight m-0 mt-3 text-[var(--color-wh-snow)]">
          Wann wollt Ihr kommen?
        </h2>
        <p className="text-[var(--color-wh-snow)]/85 max-w-md mt-3 leading-relaxed">
          Termin auswählen, Personen eintragen, Pauschalen abhaken — und sofort verbindlich buchen.
          50 % Anzahlung, Rest vor Anreise.
        </p>
      </div>
      <Link
        href="/buchen"
        className="inline-flex h-13 sm:h-14 px-6 sm:px-7 items-center gap-2.5 rounded-[var(--radius-btn)] bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] font-semibold no-underline hover:bg-white transition-colors w-fit"
      >
        Verfügbarkeit prüfen
        <ArrowRight size={18} />
      </Link>
    </div>
  </section>
);
