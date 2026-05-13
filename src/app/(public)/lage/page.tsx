import Image from "next/image";
import { ConsentGate } from "@/components/consent/ConsentGate";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

export const metadata = {
  title: "Lage & Anfahrt · Wiesenhütte Langewiese",
  description:
    "Wiesenhütte, Bundesstraße 6, 59955 Winterberg-Langewiese. Anfahrt mit Auto, Bahn (ZOB Winterberg) und Bus R28. Direkt am Rothaarsteig, Loipen und Rodelhang.",
};

type Copy = {
  hero: { eyebrow: string; h1: string };
  address: { eyebrow: string; h2: string; subtitle: string; intro: string };
  car: { h3: string; body: string };
  parking: {
    h3: string;
    summer: { label: string; body: string };
    winter: { label: string; body: string };
  };
  transit: { eyebrow: string; h2: string; steps: string[] };
  map: { eyebrow: string; h2: string; googleLink: string };
  infra: {
    eyebrow: string;
    h2: string;
    bakery: { title: string; detail: string };
    catering: { title: string; detail: string };
    emergency: { title: string; detail: string };
  };
};

const COPY: Record<Locale, Copy> = {
  de: {
    hero: { eyebrow: "Lage", h1: "Langewiese, Hochsauerland." },
    address: {
      eyebrow: "Adresse",
      h2: "Wiesenhütte",
      subtitle: "Bundesstraße 6 · 59955 Winterberg-Langewiese",
      intro: "Das Haus liegt etwa 50 Meter unterhalb der Bundesstraße am Hang. Direkt gegenüber ist die Bäckerei Gerke — die Einfahrt zur Wiesenhütte liegt unterhalb der Bundesstraße.",
    },
    car: {
      h3: "Mit dem Auto",
      body: "Anfahrt über die A44 (Soest/Werl) bzw. A46 (Bestwig). Letzte Etappe über die B480 durch Winterberg ins Höhendorf Langewiese.",
    },
    parking: {
      h3: "Parken",
      summer: { label: "Sommer:", body: "direkt vor dem Haus und oben an der Bundesstraße auf einer Seite." },
      winter: { label: "Winter:", body: "aus Sicherheitsgründen ausschließlich oben an der Bundesstraße." },
    },
    transit: {
      eyebrow: "Mit Bahn & Bus",
      h2: "Anreise mit ÖPNV",
      steps: [
        "Bahn bis **Bahnhof Winterberg (Westf)**",
        "Vom direkt anschließenden ZOB den **Bus R28** Richtung Schmallenberg",
        "Ausstieg **Langewiese Ortsmitte**",
        "200 m Fußweg in Fahrtrichtung bis zur **Bäckerei Gerke**",
        "Direkt gegenüber der Bäckerei: Einfahrt zur Wiesenhütte",
      ],
    },
    map: { eyebrow: "Karte", h2: "Hier liegen wir.", googleLink: "In Google Maps öffnen ↗" },
    infra: {
      eyebrow: "Was es im Ort gibt",
      h2: "Infrastruktur Langewiese.",
      bakery: { title: "Bäckerei Gerke", detail: "Direkt gegenüber. Mo–Sa 6:30–12:30 + Mo–Fr 15:00–18:00 · Vorbestellungen möglich · Tel. 02758 / 280" },
      catering: { title: "Catering", detail: "Gasthof Graberhof, Hohenleye 1, Winterberg-Hoheleye · Tel. 02758 / 284 · Handy 0160 7622508" },
      emergency: { title: "Notfall", detail: "St. Franziskus Hospital Winterberg · Franziskusstr. 2 · Tel. 02981 / 8020 · Bereitschaftsdienst 116 117" },
    },
  },
  en: {
    hero: { eyebrow: "Location", h1: "Langewiese, Hochsauerland." },
    address: {
      eyebrow: "Address",
      h2: "Wiesenhütte",
      subtitle: "Bundesstraße 6 · 59955 Winterberg-Langewiese, Germany",
      intro: "The cabin sits about 50 metres below the main road on a hillside. Directly opposite is bakery Gerke — the driveway to the Wiesenhütte is below the main road.",
    },
    car: {
      h3: "By car",
      body: "Take the A44 (Soest/Werl) or A46 (Bestwig). Final leg via the B480 through Winterberg into the highland village of Langewiese.",
    },
    parking: {
      h3: "Parking",
      summer: { label: "Summer:", body: "directly in front of the cabin and along one side of the main road above." },
      winter: { label: "Winter:", body: "for safety reasons only along the main road above." },
    },
    transit: {
      eyebrow: "By train & bus",
      h2: "Public transport",
      steps: [
        "Train to **Winterberg (Westf) station**",
        "From the adjacent bus terminal take **bus R28** towards Schmallenberg",
        "Get off at **Langewiese Ortsmitte**",
        "200 m walk in the direction of travel to **bakery Gerke**",
        "Directly opposite the bakery: driveway to the Wiesenhütte",
      ],
    },
    map: { eyebrow: "Map", h2: "Here we are.", googleLink: "Open in Google Maps ↗" },
    infra: {
      eyebrow: "What's in the village",
      h2: "Langewiese infrastructure.",
      bakery: { title: "Bakery Gerke", detail: "Directly opposite. Mon–Sat 6:30–12:30 + Mon–Fri 15:00–18:00 · Pre-orders possible · Tel. +49 2758 / 280" },
      catering: { title: "Catering", detail: "Gasthof Graberhof, Hohenleye 1, Winterberg-Hoheleye · Tel. +49 2758 / 284 · Mobile +49 160 7622508" },
      emergency: { title: "Emergency", detail: "St. Franziskus Hospital Winterberg · Franziskusstr. 2 · Tel. +49 2981 / 8020 · On-call doctor 116 117" },
    },
  },
  nl: {
    hero: { eyebrow: "Ligging", h1: "Langewiese, Hochsauerland." },
    address: {
      eyebrow: "Adres",
      h2: "Wiesenhütte",
      subtitle: "Bundesstraße 6 · 59955 Winterberg-Langewiese, Duitsland",
      intro: "De hut ligt zo'n 50 meter onder de hoofdweg op een helling. Direct tegenover staat bakkerij Gerke — de oprit naar de Wiesenhütte ligt onder de hoofdweg.",
    },
    car: {
      h3: "Met de auto",
      body: "Aanrijden via de A44 (Soest/Werl) of A46 (Bestwig). Laatste stuk via de B480 door Winterberg naar het hooggelegen dorp Langewiese.",
    },
    parking: {
      h3: "Parkeren",
      summer: { label: "Zomer:", body: "direct voor de hut en aan één kant van de hoofdweg erboven." },
      winter: { label: "Winter:", body: "om veiligheidsredenen uitsluitend aan de hoofdweg erboven." },
    },
    transit: {
      eyebrow: "Met trein & bus",
      h2: "Openbaar vervoer",
      steps: [
        "Trein tot **station Winterberg (Westf)**",
        "Vanaf het aansluitende busstation **bus R28** richting Schmallenberg",
        "Uitstappen bij **Langewiese Ortsmitte**",
        "200 m lopen in de rijrichting tot **bakkerij Gerke**",
        "Direct tegenover de bakkerij: oprit naar de Wiesenhütte",
      ],
    },
    map: { eyebrow: "Kaart", h2: "Hier liggen we.", googleLink: "In Google Maps openen ↗" },
    infra: {
      eyebrow: "Wat er in het dorp is",
      h2: "Infrastructuur Langewiese.",
      bakery: { title: "Bakkerij Gerke", detail: "Direct tegenover. Ma–Za 6:30–12:30 + Ma–Vr 15:00–18:00 · Vooraf bestellen mogelijk · Tel. +49 2758 / 280" },
      catering: { title: "Catering", detail: "Gasthof Graberhof, Hohenleye 1, Winterberg-Hoheleye · Tel. +49 2758 / 284 · Mobiel +49 160 7622508" },
      emergency: { title: "Noodgeval", detail: "St. Franziskus Hospital Winterberg · Franziskusstr. 2 · Tel. +49 2981 / 8020 · Huisartsenpost 116 117" },
    },
  },
};

// Helper: ersetzt **fett** durch <strong>
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default async function LagePage() {
  const locale = await getServerLocale();
  const c = COPY[locale];

  return (
    <div>
      <section className="relative h-[420px] sm:h-[480px] overflow-hidden">
        <Image
          src="/media/photos/landscape.jpg"
          alt="Hochsauerland"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative max-w-[1080px] mx-auto h-full px-6 sm:px-8 flex flex-col justify-end pb-10 sm:pb-12">
          <div className="eyebrow text-[var(--color-wh-snow)]/85">{c.hero.eyebrow}</div>
          <h1 className="text-[var(--color-wh-snow)] font-display font-bold text-[44px] sm:text-[64px] leading-tight m-0 mt-3 sm:mt-4">
            {c.hero.h1}
          </h1>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
          <div>
            <div className="eyebrow">{c.address.eyebrow}</div>
            <h2 className="text-[28px] sm:text-[34px] mt-3 mb-2">
              {c.address.h2}
              <span className="block text-base sm:text-lg font-normal mt-2 text-[var(--color-wh-fg-muted)]">
                {c.address.subtitle}
              </span>
            </h2>
            <p className="text-base text-[var(--color-wh-black)] leading-relaxed mt-4">{c.address.intro}</p>

            <h3 className="mt-10 mb-3 text-[20px]">{c.car.h3}</h3>
            <p className="text-[var(--color-wh-fg-muted)] leading-relaxed m-0">{c.car.body}</p>

            <h3 className="mt-8 mb-3 text-[20px]">{c.parking.h3}</h3>
            <ul className="list-disc list-inside marker:text-[var(--color-wh-green)] text-[var(--color-wh-black)] space-y-1.5">
              <li>
                <strong>{c.parking.summer.label}</strong> {c.parking.summer.body}
              </li>
              <li>
                <strong>{c.parking.winter.label}</strong> {c.parking.winter.body}
              </li>
            </ul>
          </div>

          <div>
            <div className="eyebrow">{c.transit.eyebrow}</div>
            <h2 className="text-[28px] sm:text-[34px] mt-3 mb-2">{c.transit.h2}</h2>
            <ol className="mt-4 space-y-3 text-[var(--color-wh-black)] leading-relaxed list-decimal list-inside marker:text-[var(--color-wh-deep-green)] marker:font-semibold">
              {c.transit.steps.map((step, i) => (
                <li key={i}>{renderInline(step)}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow">{c.map.eyebrow}</div>
          <h2 className="text-[28px] sm:text-[34px] mt-3 mb-6">{c.map.h2}</h2>
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
              {c.map.googleLink}
            </a>
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow">{c.infra.eyebrow}</div>
          <h2 className="text-[28px] sm:text-[34px] mt-3 mb-8">{c.infra.h2}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title={c.infra.bakery.title} detail={c.infra.bakery.detail} />
            <Card title={c.infra.catering.title} detail={c.infra.catering.detail} />
            <Card title={c.infra.emergency.title} detail={c.infra.emergency.detail} />
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
