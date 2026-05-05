import Image from "next/image";
import { ConsentGate } from "@/components/consent/ConsentGate";

export const metadata = {
  title: "Lage & Anfahrt · Wiesenhütte Langewiese",
  description:
    "Wiesenhütte, Bundesstraße 6, 59955 Winterberg-Langewiese. Anfahrt mit Auto, Bahn (ZOB Winterberg) und Bus R28. Direkt am Rothaarsteig, Loipen und Rodelhang.",
};

export default function LagePage() {
  return (
    <div>
      <section className="relative h-[420px] sm:h-[480px] overflow-hidden">
        <Image
          src="/media/photos/landscape.jpg"
          alt="Hochsauerland-Landschaft bei Langewiese"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative max-w-[1080px] mx-auto h-full px-6 sm:px-8 flex flex-col justify-end pb-10 sm:pb-12">
          <div className="eyebrow text-[var(--color-wh-snow)]/85">Lage</div>
          <h1 className="text-[var(--color-wh-snow)] font-display font-bold text-[44px] sm:text-[64px] leading-tight m-0 mt-3 sm:mt-4">
            Langewiese, Hochsauerland.
          </h1>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
          <div>
            <div className="eyebrow">Adresse</div>
            <h2 className="text-[28px] sm:text-[34px] mt-3 mb-2">
              Wiesenhütte
              <span className="block text-base sm:text-lg font-normal mt-2 text-[var(--color-wh-fg-muted)]">
                Bundesstraße 6 · 59955 Winterberg-Langewiese
              </span>
            </h2>
            <p className="text-base text-[var(--color-wh-black)] leading-relaxed mt-4">
              Das Haus liegt etwa 50 Meter unterhalb der Bundesstraße am Hang. Direkt gegenüber
              ist die Bäckerei Gerke — die Einfahrt zur Wiesenhütte liegt unterhalb der Bundesstraße.
            </p>

            <h3 className="mt-10 mb-3 text-[20px]">Mit dem Auto</h3>
            <p className="text-[var(--color-wh-fg-muted)] leading-relaxed m-0">
              Anfahrt über die A44 (Soest/Werl) bzw. A46 (Bestwig). Letzte Etappe über die B480
              durch Winterberg ins Höhendorf Langewiese.
            </p>

            <h3 className="mt-8 mb-3 text-[20px]">Parken</h3>
            <ul className="list-disc list-inside marker:text-[var(--color-wh-green)] text-[var(--color-wh-black)] space-y-1.5">
              <li>
                <strong>Sommer:</strong> direkt vor dem Haus und oben an der Bundesstraße auf einer Seite.
              </li>
              <li>
                <strong>Winter:</strong> aus Sicherheitsgründen ausschließlich oben an der Bundesstraße.
              </li>
            </ul>
          </div>

          <div>
            <div className="eyebrow">Mit Bahn & Bus</div>
            <h2 className="text-[28px] sm:text-[34px] mt-3 mb-2">Anreise mit ÖPNV</h2>
            <ol className="mt-4 space-y-3 text-[var(--color-wh-black)] leading-relaxed list-decimal list-inside marker:text-[var(--color-wh-deep-green)] marker:font-semibold">
              <li>Bahn bis <strong>Bahnhof Winterberg (Westf)</strong></li>
              <li>Vom direkt anschließenden ZOB den <strong>Bus R28</strong> Richtung Schmallenberg</li>
              <li>Ausstieg <strong>Langewiese Ortsmitte</strong></li>
              <li>200 m Fußweg in Fahrtrichtung bis zur <strong>Bäckerei Gerke</strong></li>
              <li>Direkt gegenüber der Bäckerei: Einfahrt zur Wiesenhütte</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow">Karte</div>
          <h2 className="text-[28px] sm:text-[34px] mt-3 mb-6">Hier liegen wir.</h2>
          <ConsentGate
            category="functional"
            serviceName="OpenStreetMap"
            serviceUrl="https://wiki.openstreetmap.org/wiki/Privacy_Policy"
            className="aspect-[16/9]"
          >
            <div className="aspect-[16/9] rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-wh-winter-grey)]">
              <iframe
                title="Karte Langewiese"
                src="https://www.openstreetmap.org/export/embed.html?bbox=8.4500%2C51.2700%2C8.5800%2C51.3300&layer=mapnik&marker=51.3000%2C8.5150"
                className="w-full h-full"
                loading="lazy"
              />
            </div>
          </ConsentGate>
          <p className="text-sm text-[var(--color-wh-fg-muted)] mt-3">
            <a
              href="https://www.google.com/maps/search/?api=1&query=Bundesstra%C3%9Fe+6+59955+Winterberg-Langewiese"
              target="_blank"
              rel="noreferrer"
            >
              In Google Maps öffnen ↗
            </a>
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow">Was es im Ort gibt</div>
          <h2 className="text-[28px] sm:text-[34px] mt-3 mb-8">Infrastruktur Langewiese.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              title="Bäckerei Gerke"
              detail="Direkt gegenüber. Mo–Sa 6:30–12:30 + Mo–Fr 15:00–18:00 · Vorbestellungen möglich · Tel. 02758 / 280"
            />
            <Card
              title="Catering"
              detail="Gasthof Graberhof, Hohenleye 1, Winterberg-Hoheleye · Tel. 02758 / 284 · Handy 0160 7622508"
            />
            <Card
              title="Notfall"
              detail="St. Franziskus Hospital Winterberg · Franziskusstr. 2 · Tel. 02981 / 8020 · Bereitschaftsdienst 116 117"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

const Card = ({ title, detail }: { title: string; detail: string }) => (
  <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
    <h4 className="font-display font-semibold text-[18px] text-[var(--color-wh-deep-green)] m-0 mb-2">
      {title}
    </h4>
    <p className="text-sm text-[var(--color-wh-fg-muted)] m-0 leading-relaxed">{detail}</p>
  </div>
);
