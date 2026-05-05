import Link from "next/link";
import {
  Users,
  MountainSnow,
  Route,
  CookingPot,
  Armchair,
  Umbrella,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    Icon: Users,
    eye: "Gemeinschaft",
    title: "Bis zu 33 Personen",
    body: "Platz für Gruppen, Familien und Vereinsfahrten. Mindestbelegung 10 Personen.",
  },
  {
    Icon: MountainSnow,
    eye: "Direkt am Haus",
    title: "Rodelhang",
    body: "Raus aus der Tür, rein in den Schnee.",
  },
  {
    Icon: Route,
    eye: "Fußläufig",
    title: "Loipe",
    body: "Start am Rand des Naturschutzgebiets.",
  },
  {
    Icon: CookingPot,
    eye: "Selber kochen",
    title: "Gemeinschaftsküche",
    body: "Für große Töpfe und lange Abende.",
  },
  {
    Icon: Armchair,
    eye: "Drinnen",
    title: "Zwei Aufenthaltsräume",
    body: "Für Spiele, Gespräche, Geschichten.",
  },
  {
    Icon: Umbrella,
    eye: "Draußen",
    title: "Terrasse mit Blick",
    body: "Grillen, Winterluft, Sauerländer Hügel.",
  },
];

export default function HomePage() {
  return (
    <div>
      <Hero />
      <IntroBlock />
      <FeatureGrid />
      <CTABand />
    </div>
  );
}

const Hero = () => (
  <section className="relative h-[680px] overflow-hidden">
    <img
      src="https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1920&auto=format&fit=crop"
      alt=""
      className="absolute inset-0 w-full h-full object-cover"
      style={{ filter: "saturate(0.88) contrast(1.02)" }}
    />
    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/55" />
    <div className="relative max-w-[1320px] mx-auto px-8 pt-32 pb-16 flex flex-col items-start gap-7 h-full justify-end">
      <h1
        className="font-display font-extrabold uppercase tracking-tight text-[var(--color-wh-snow)] m-0"
        style={{
          fontSize: "clamp(48px, 7vw, 96px)",
          lineHeight: 0.95,
          letterSpacing: "-0.025em",
        }}
      >
        Draußen kalt.
        <br />
        Drinnen gemeinsam.
      </h1>
      <p className="text-[19px] leading-relaxed text-[var(--color-wh-snow)]/90 m-0 max-w-xl">
        Die Wiesenhütte der Skifreunde Gütersloh liegt in Langewiese — direkt am Rodelhang, der
        Loipe und der Hochsauerländer Natur.
      </p>
      <div className="flex gap-3 flex-wrap">
        <Link
          href="/buchen"
          className="inline-flex h-14 px-6 sm:px-7 items-center gap-2.5 rounded-[var(--radius-btn)] bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] font-semibold no-underline hover:bg-white transition-all shadow-[var(--shadow-float)] hover:shadow-[var(--shadow-deep)]"
        >
          Verfügbarkeit prüfen
          <ArrowRight size={18} />
        </Link>
        <Link
          href="/huette"
          className="inline-flex h-14 px-6 sm:px-7 items-center rounded-[var(--radius-btn)] font-semibold no-underline transition-colors backdrop-blur-sm"
          style={{
            background: "rgba(17,17,17,0.35)",
            color: "var(--color-wh-snow)",
            border: "1px solid rgba(247,247,242,0.7)",
          }}
        >
          Mehr über die Hütte
        </Link>
      </div>
    </div>
    <div className="absolute right-8 top-8 text-[var(--color-wh-snow)] text-xs uppercase tracking-[0.18em] opacity-85">
      Langewiese · Hochsauerland
    </div>
  </section>
);

const IntroBlock = () => (
  <section className="bg-[var(--color-wh-snow)] px-8 py-32">
    <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-24 items-start">
      <div>
        <div className="eyebrow">Was die Wiesenhütte ist</div>
        <h2 className="text-[56px] font-display font-bold leading-[1.02] tracking-tight text-[var(--color-wh-deep-green)] mt-4 mb-0">
          Keine Designunterkunft. Eine echte Vereinshütte.
        </h2>
      </div>
      <div className="pt-7">
        <p className="text-[18px] leading-[1.7] text-[var(--color-wh-black)]">
          Verwittertes Holz, robuste Etagenbetten, eine Gemeinschaftsküche, zwei Aufenthaltsräume
          und ein Skikeller voller Winterspuren.
        </p>
        <p className="text-[18px] leading-[1.7] text-[var(--color-wh-fg-muted)] mt-5">
          Seit Generationen steht die Hütte oberhalb von Langewiese — gebaut von Vereinsmitgliedern,
          getragen von Generationen, gefüllt von Gruppen, die nicht nur übernachten wollen.
        </p>
      </div>
    </div>
  </section>
);

const FeatureGrid = () => (
  <section className="bg-[var(--color-wh-snow)] px-8 pb-32">
    <div className="max-w-[1280px] mx-auto">
      <div className="flex flex-col gap-3.5 mb-14">
        <div className="eyebrow">Auf einen Blick</div>
        <h2 className="text-[44px] font-display font-bold tracking-tight text-[var(--color-wh-deep-green)] m-0">
          Was Euch hier erwartet.
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <article
            key={f.title}
            className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-7 flex flex-col gap-3"
          >
            <f.Icon
              size={28}
              strokeWidth={1.6}
              className="text-[var(--color-wh-deep-green)]"
            />
            <div className="eyebrow">{f.eye}</div>
            <h4 className="font-display font-semibold text-[24px] text-[var(--color-wh-deep-green)] m-0">
              {f.title}
            </h4>
            <p className="m-0 text-[var(--color-wh-fg-muted)] leading-relaxed">{f.body}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const CTABand = () => (
  <section className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] py-24 px-8">
    <div className="max-w-[1080px] mx-auto flex flex-col md:flex-row gap-8 md:items-end justify-between">
      <div>
        <div className="eyebrow text-[var(--color-wh-snow)]/80">Jetzt buchen</div>
        <h2 className="text-[44px] font-display font-bold tracking-tight m-0 mt-3 text-[var(--color-wh-snow)]">
          Wann wollt Ihr kommen?
        </h2>
        <p className="text-[var(--color-wh-snow)]/80 max-w-md mt-3 leading-relaxed">
          Termin auswählen, Personen eintragen, Pauschalen abhaken — und sofort verbindlich buchen.
        </p>
      </div>
      <Link
        href="/buchen"
        className="inline-flex h-14 px-7 items-center gap-2.5 rounded-[var(--radius-btn)] bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] font-semibold no-underline hover:bg-white transition-colors w-fit"
      >
        Verfügbarkeit prüfen
        <ArrowRight size={18} />
      </Link>
    </div>
  </section>
);
