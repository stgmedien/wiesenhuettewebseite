import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Die Hütte · Wiesenhütte Langewiese",
  description:
    "33 Schlafplätze in 5 Schlafzimmern, voll ausgestattete Großküche, zwei Aufenthaltsräume, Skikeller, Feuerstelle. Selbstversorgerhütte für Gruppen in Langewiese, Hochsauerland.",
};

const ROOMS = [
  {
    name: "Naturtraum",
    floor: "1. Etage",
    detail: "8 Schlafplätze in 4 Etagenbetten",
  },
  {
    name: "Waldblick",
    floor: "1. Etage",
    detail: "4 Schlafplätze in 4 Bodenbetten · über Innentreppe verbunden",
  },
  {
    name: "Sonnenplatz",
    floor: "1. Etage",
    detail: `4 Schlafplätze in 2 Etagenbetten · Sitzecke mit Tisch ("Lehrerzimmer")`,
  },
  {
    name: "Vogelnest",
    floor: "Dachgeschoss",
    detail: "4 Schlafplätze in 4 Bodenbetten",
  },
  {
    name: "Baumkrone",
    floor: "Dachgeschoss",
    detail: "13 Schlafplätze (3 + 10) · durch Vorhang abgetrennter Großschlafraum",
  },
];

const FACTS = [
  { kpi: "33", label: "Schlafplätze" },
  { kpi: "5", label: "Schlafzimmer" },
  { kpi: "2", label: "Aufenthaltsräume" },
  { kpi: "10–33", label: "Personen Belegung" },
];

const GALLERY = [
  { src: "/media/photos/exterior-main.jpg", alt: "Wiesenhütte Hauptansicht von außen" },
  { src: "/media/photos/interior-7496.jpg", alt: "Aufenthaltsraum mit Holzeinrichtung" },
  { src: "/media/photos/interior-7517.jpg", alt: "Schlafzimmer mit Etagenbetten" },
  { src: "/media/photos/interior-7547.jpg", alt: "Großküche mit Herd und Spülmaschine" },
  { src: "/media/photos/interior-7593.jpg", alt: "Esszimmer für Gruppen" },
  { src: "/media/photos/interior-7649.jpg", alt: "Sanitärbereich" },
  { src: "/media/photos/aerial-1.jpg", alt: "Wiesenhütte aus der Vogelperspektive" },
  { src: "/media/photos/nature-1.jpg", alt: "Hütte eingebettet in die Sauerländer Natur" },
  { src: "/media/photos/exterior-front.jpg", alt: "Eingangsbereich der Hütte im Schnee" },
];

export default function HuettePage() {
  return (
    <div>
      <section className="relative h-[420px] sm:h-[520px] overflow-hidden">
        <Image
          src="/media/photos/aerial-1.jpg"
          alt="Wiesenhütte aus der Vogelperspektive"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative max-w-[1080px] mx-auto h-full px-6 sm:px-8 flex flex-col justify-end pb-10 sm:pb-12">
          <div className="eyebrow text-[var(--color-wh-snow)]/85">Die Hütte</div>
          <h1 className="text-[var(--color-wh-snow)] font-display font-bold text-[44px] sm:text-[64px] leading-tight m-0 mt-3 sm:mt-4">
            Echte Holzhütte.
            <br />
            Selbstversorgung.
          </h1>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {FACTS.map((f) => (
              <div key={f.label}>
                <div className="font-display text-[40px] sm:text-[48px] leading-none text-[var(--color-wh-deep-green)] font-bold">
                  {f.kpi}
                </div>
                <div className="mt-2 text-sm sm:text-base text-[var(--color-wh-fg-muted)]">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[920px] mx-auto">
          <div className="eyebrow">Beschreibung</div>
          <h2 className="text-[32px] sm:text-[40px] mt-3 sm:mt-4">Zwei Vollgeschosse, Dachboden, Untergeschoss.</h2>
          <p className="text-base sm:text-[17px] leading-relaxed text-[var(--color-wh-black)] mt-4">
            Die Wiesenhütte liegt etwa 50 m unterhalb der Bundesstraße am Hang in Langewiese,
            einem Höhendorf bei Winterberg im Hochsauerland. Sie ist eine Selbstversorgerhütte
            für Vereins-, Schul-, Klassen- und Gruppenfahrten. Atmosphäre: bewusst entschleunigt,
            gemeinsames Kochen, Abende an der Feuerstelle, Natur direkt vor der Tür.
          </p>

          <h3 className="mt-12 mb-4 text-[22px] sm:text-[26px]">Schlafzimmer</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0">
            {ROOMS.map((r) => (
              <li
                key={r.name}
                className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-md)] p-4"
              >
                <div className="font-display font-semibold text-[20px] text-[var(--color-wh-deep-green)]">
                  {r.name}
                </div>
                <div className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)] mt-1">
                  {r.floor}
                </div>
                <div className="text-sm text-[var(--color-wh-black)] mt-2">{r.detail}</div>
              </li>
            ))}
          </ul>

          <h3 className="mt-12 mb-4 text-[22px] sm:text-[26px]">Räume & Ausstattung</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-base">
            <Block
              heading="Erdgeschoss"
              items={[
                "Windfang mit Garderobe und Schuhregal",
                "Esszimmer mit 4 Tischen für mind. 6 Personen",
                "Großküche: 2 Herde, Backofen, Mikrowelle, Spülmaschine, Filter-Kaffeemaschine",
                "Vorratsraum mit großem und kleinem Kühlschrank (mit Gefrierfach)",
                "Aufenthaltsraum mit 4 Tischen",
                "Gästetoilette",
              ]}
            />
            <Block
              heading="Untergeschoss"
              items={[
                "2 Sanitärräume mit je 2 Duschen, 2 Toiletten, 4 Waschbecken",
                "Skikeller / Radkeller von außen zugänglich",
                "Grill",
              ]}
            />
            <Block
              heading="Außenbereich"
              items={[
                "Freisitz",
                "Baumbank",
                "Selbstgebaute Feuerstelle",
                "Eigener Rodelhang neben der Hütte",
              ]}
            />
            <Block
              heading="Heizung & Verpflegung"
              items={[
                "Zentralheizung in allen Räumen",
                "Selbstversorgung — Hygieneartikel bitte mitbringen",
                "Bäckerei Gerke direkt gegenüber",
                "Catering nach Absprache (Gasthof Graberhof, Hoheleye)",
              ]}
            />
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1280px] mx-auto">
          <div className="eyebrow">Galerie</div>
          <h2 className="text-[32px] sm:text-[40px] mt-3 sm:mt-4 mb-10">Innen, außen, Natur.</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {GALLERY.map((g) => (
              <div
                key={g.src}
                className="relative aspect-[4/3] rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-wh-beige)]"
              >
                <Image
                  src={g.src}
                  alt={g.alt}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-20">
        <div className="max-w-[820px] mx-auto text-center">
          <div className="eyebrow text-[var(--color-wh-snow)]/80">Bereit?</div>
          <h2 className="text-[var(--color-wh-snow)] text-[32px] sm:text-[40px] mt-3">
            Termin auswählen, Personen eintragen, buchen.
          </h2>
          <Link
            href="/buchen"
            className="inline-flex mt-6 h-12 px-6 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] no-underline font-semibold hover:bg-white transition-colors"
          >
            Verfügbarkeit prüfen
          </Link>
        </div>
      </section>
    </div>
  );
}

const Block = ({ heading, items }: { heading: string; items: string[] }) => (
  <div>
    <h4 className="m-0 text-[18px] font-semibold text-[var(--color-wh-deep-green)]">{heading}</h4>
    <ul className="mt-2 list-disc list-inside marker:text-[var(--color-wh-green)] text-[var(--color-wh-black)] space-y-1">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  </div>
);
