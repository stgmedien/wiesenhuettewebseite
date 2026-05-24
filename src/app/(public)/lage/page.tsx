import Image from "next/image";
import {
  MapPin,
  Compass,
  Car,
  TrainFront,
  Bus,
  ParkingCircle,
  Sun,
  Snowflake,
  Mountain,
  Croissant,
  Utensils,
  Stethoscope,
  Phone,
  ExternalLink,
  ArrowRight,
  Clock,
  TriangleAlert,
  Backpack,
} from "lucide-react";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

export const metadata = {
  title: "Lage & Anfahrt · Wiesenhütte Langewiese",
  description:
    "Wiesenhütte, Bundesstraße 6, 59955 Winterberg-Langewiese. 690 m über NHN im Hochsauerland. Anfahrt mit Auto, Bahn (ZOB Winterberg) und Bus R28 — alle Wege herauf.",
};

// =============================================================
// ECHTE KOORDINATEN + ADDRESS
// Quelle: OpenStreetMap Nominatim-Geocoding fuer
// "Bundesstraße 6, 59955 Winterberg-Langewiese" — verifiziert.
// =============================================================
const LAT = 51.1524045;
const LNG = 8.4636047;
const ELEVATION_M = 690;
const FULL_ADDRESS = "Bundesstraße 6, 59955 Winterberg-Langewiese";
const ADDRESS_ENCODED = encodeURIComponent(FULL_ADDRESS);

// Universal Navi-Deep-Links. Adresse + Koordinaten kombiniert, damit
// Google/Apple/Waze die Bundesstraße 6 zuverlaessig anfahren (Adresse
// gewinnt beim Geocoding, Koordinaten als Fallback).
const NAVI_LINKS = {
  // Google: destination als Adresse (sauberstes Geocoding) + dest_place
  google: `https://www.google.com/maps/dir/?api=1&destination=${ADDRESS_ENCODED}`,
  // Apple: Adresse als address-Param + Koordinaten als ll-Fallback
  apple: `https://maps.apple.com/?address=${ADDRESS_ENCODED}&ll=${LAT},${LNG}&q=Wiesenh%C3%BCtte`,
  // Waze: Adress-Query (q) statt nur Koordinaten — robuster
  waze: `https://waze.com/ul?q=${ADDRESS_ENCODED}&navigate=yes`,
  // OSM: Marker auf den exakten Koordinaten
  osm: `https://www.openstreetmap.org/?mlat=${LAT}&mlon=${LNG}#map=16/${LAT}/${LNG}`,
};

type Copy = {
  hero: { meta: string; h1l1: string; h1l2: string; lead: string };
  address: {
    eyebrow: string;
    statement: { l1: string; l2: string; l3: string };
    metaLines: { coords: string; elevation: string; from: string };
    ctaApple: string;
    ctaGoogle: string;
    ctaWaze: string;
  };
  travelTimes: { eyebrow: string; h2: string; cities: { name: string; hours: string; sub: string }[] };
  routes: {
    eyebrow: string;
    h2: string;
    lead: string;
    car: { number: string; title: string; body: string; details: string[] };
    train: { number: string; title: string; body: string; steps: string[] };
    arrival: { number: string; title: string; body: string; details: string[] };
  };
  parking: {
    eyebrow: string;
    h2: string;
    summer: { label: string; h: string; body: string };
    winter: { label: string; h: string; body: string };
  };
  map: { eyebrow: string; h2: string; lead: string; openIn: string };
  infra: {
    eyebrow: string;
    h2: string;
    lead: string;
    cards: { icon: "bakery" | "catering" | "emergency"; title: string; distance: string; hours?: string; phone?: string; detail: string }[];
  };
  notes: {
    eyebrow: string;
    h2: string;
    items: { icon: "mountain" | "alert" | "backpack"; title: string; body: string }[];
  };
  cta: { eyebrow: string; h2: string; body: string; button: string };
};

const COPY: Record<Locale, Copy> = {
  de: {
    hero: {
      meta: `51° 09' N · 8° 28' O · ${ELEVATION_M} m ü. NHN`,
      h1l1: "Da wo der",
      h1l2: "Wald sich teilt.",
      lead: "Langewiese sitzt auf 690 Metern Höhe — auf einem Plateau zwischen dem Rothaarsteig und dem Hochsauerland. Die Hütte liegt 50 Meter unter der Bundesstraße am Hang. Eine Adresse, drei Wege herauf.",
    },
    address: {
      eyebrow: "Adresse",
      statement: { l1: "Bundesstraße 6", l2: "59955 Winterberg-Langewiese", l3: "Hochsauerland · Deutschland" },
      metaLines: {
        coords: "Koordinaten",
        elevation: "Höhe",
        from: "Erreichbar in",
      },
      ctaApple: "Apple Maps",
      ctaGoogle: "Google Maps",
      ctaWaze: "Waze",
    },
    travelTimes: {
      eyebrow: "Anfahrt",
      h2: "Wie weit Ihr Euch fühlt.",
      cities: [
        { name: "Gütersloh", hours: "1:50 h", sub: "Heimat der Skifreunde — die übliche Anreise" },
        { name: "Düsseldorf", hours: "2:00 h", sub: "Über die A46" },
        { name: "Köln", hours: "2:20 h", sub: "Über die A4 + A45" },
        { name: "Berlin", hours: "5:00 h", sub: "Über A2 + Werl" },
      ],
    },
    routes: {
      eyebrow: "Drei Wege herauf",
      h2: "Mit Auto, Bahn — oder zu Fuß.",
      lead: "Egal wie Ihr kommt, das Höhendorf ist erreichbar. Im Winter empfehlen wir Schnee-Reifen, im Sommer reicht jedes Auto.",
      car: {
        number: "01",
        title: "Mit dem Auto",
        body: "Anfahrt über A44 (Soest/Werl) oder A46 (Bestwig). Letzte Etappe über die B480 durch Winterberg ins Höhendorf Langewiese — eine schöne Strecke durch dichten Mischwald.",
        details: [
          "A44 ab Ruhrgebiet / A46 ab Düsseldorf",
          "Ausfahrt Bestwig → B480 nach Winterberg",
          "Weiter durch Winterberg nach Langewiese (8 km)",
          "Hausnummer 6 liegt 50 m unterhalb der B480",
        ],
      },
      train: {
        number: "02",
        title: "Mit Bahn & Bus",
        body: "Ohne Auto kommt Ihr trotzdem hoch — das letzte Stück ab Winterberg-Bahnhof ist eine 25-Minuten-Busfahrt. Mit Klassenfahrt-Größen funktioniert das gut.",
        steps: [
          "Bahn bis Bahnhof Winterberg (Westf)",
          "Vom anschließenden ZOB: Bus R28 Richtung Schmallenberg",
          "Ausstieg Langewiese Ortsmitte",
          "200 m zu Fuß zur Bäckerei Gerke",
          "Direkt gegenüber: Einfahrt zur Wiesenhütte",
        ],
      },
      arrival: {
        number: "03",
        title: "Letztes Stück",
        body: "Die Einfahrt liegt unterhalb der Bundesstraße — wer das erste Mal kommt, übersieht sie leicht. Achtet auf die Bäckerei Gerke gegenüber, da ist der Wegweiser.",
        details: [
          "Schotterweg, ~50 m bergab",
          "Im Winter glatt — vorsichtig fahren",
          "Direkt vor der Hütte parken (im Sommer)",
          "Schlüssel-Übergabe vor Ort bei Anreise",
        ],
      },
    },
    parking: {
      eyebrow: "Parken",
      h2: "Sommer oder Winter — der Unterschied zählt.",
      summer: {
        label: "Im Sommer",
        h: "Vor dem Haus",
        body: "Direkt vor der Hütte gibt's Stellplätze für die ganze Gruppe. Zusätzlich oben an der Bundesstraße, einseitig parken.",
      },
      winter: {
        label: "Im Winter",
        h: "Oben an der Straße",
        body: "Wenn Schnee liegt, parken alle oben an der Bundesstraße — der Schotterweg ist dann eisig und keine sichere Anfahrt mit dem Wagen.",
      },
    },
    map: {
      eyebrow: "Karte",
      h2: "Hier liegen wir.",
      lead: "Langewiese, Westhang. Drumherum: Asten-Massiv, Hochheide, Rothaarsteig.",
      openIn: "In Karten-App öffnen",
    },
    infra: {
      eyebrow: "Im Dorf",
      h2: "Was Ihr in Lauf-Distanz findet.",
      lead: "Langewiese ist klein, hat aber alles Notwendige in 200 Metern Umkreis.",
      cards: [
        {
          icon: "bakery",
          title: "Bäckerei Gerke",
          distance: "30 m gegenüber",
          hours: "Mo–Sa 6:30–12:30 · Mo–Fr 15:00–18:00",
          phone: "+49 2758 280",
          detail: "Brötchen, Kuchen, Kaffee. Vorbestellungen für Gruppen sind möglich — einfach abends vorher anrufen.",
        },
        {
          icon: "catering",
          title: "Gasthof Graberhof",
          distance: "Hoheleye, 4 km",
          phone: "+49 2758 284",
          detail: "Catering für Gruppen, Hohenleye 1, Winterberg-Hoheleye. Liefert in die Hütte oder Ihr fahrt hin — funktioniert beides. Mobil: 0160 7622508.",
        },
        {
          icon: "emergency",
          title: "St. Franziskus Hospital",
          distance: "Winterberg, 8 km",
          phone: "+49 2981 8020",
          detail: "24/7 Notaufnahme. Für nicht-akute Fälle: ärztlicher Bereitschaftsdienst 116 117. Bei akutem Notfall immer 112.",
        },
      ],
    },
    notes: {
      eyebrow: "Praktisches",
      h2: "Drei Dinge, die Ihr vor der Anreise wissen solltet.",
      items: [
        {
          icon: "mountain",
          title: "690 Meter Höhe",
          body: "Langewiese ist eines der höchsten Dörfer NRWs. Nachts wird's auch im Sommer kühl — eine Jacke nicht vergessen. Im Winter liegt oft Schnee bis April.",
        },
        {
          icon: "alert",
          title: "Letzte Tankstelle",
          body: "Die nächste 24h-Tankstelle ist in Winterberg (8 km). Wer abends spät ankommt: vorher tanken.",
        },
        {
          icon: "backpack",
          title: "Selbstversorger",
          body: "Vor der Anreise einkaufen — der nächste Supermarkt (EDEKA Löffler) ist in Winterberg, donnerstags geschlossen. Brötchen morgens beim Gerke gegenüber.",
        },
      ],
    },
    cta: {
      eyebrow: "Bereit?",
      h2: "Verfügbarkeit checken, anreisen, ankommen.",
      body: "Wenn die Lage passt und der Termin frei ist — keine drei Klicks zur Buchung.",
      button: "Verfügbarkeit prüfen",
    },
  },
  en: {
    hero: {
      meta: `51° 09' N · 8° 28' E · ${ELEVATION_M} m above sea level`,
      h1l1: "Where the",
      h1l2: "forest parts.",
      lead: "Langewiese sits at 690 metres elevation — on a plateau between the Rothaarsteig and the Hochsauerland. The cabin lies 50 metres below the main road on the hillside. One address, three ways up.",
    },
    address: {
      eyebrow: "Address",
      statement: { l1: "Bundesstraße 6", l2: "59955 Winterberg-Langewiese", l3: "Hochsauerland · Germany" },
      metaLines: { coords: "Coordinates", elevation: "Elevation", from: "Reach by" },
      ctaApple: "Apple Maps",
      ctaGoogle: "Google Maps",
      ctaWaze: "Waze",
    },
    travelTimes: {
      eyebrow: "Travel",
      h2: "How far you feel from home.",
      cities: [
        { name: "Gütersloh", hours: "1h 50", sub: "Home of the club — the usual trip" },
        { name: "Düsseldorf", hours: "2h 00", sub: "Via the A46" },
        { name: "Cologne", hours: "2h 20", sub: "Via A4 + A45" },
        { name: "Amsterdam", hours: "4h 00", sub: "Via Cologne" },
      ],
    },
    routes: {
      eyebrow: "Three ways up",
      h2: "By car, train — or on foot.",
      lead: "Whichever way you come, the highland village is reachable. We recommend winter tyres in snow; any car works in summer.",
      car: {
        number: "01",
        title: "By car",
        body: "Via A44 (Soest/Werl) or A46 (Bestwig). Final stretch on the B480 through Winterberg up to Langewiese — a beautiful drive through dense mixed forest.",
        details: [
          "A44 from the Ruhr / A46 from Düsseldorf",
          "Exit Bestwig → B480 toward Winterberg",
          "Continue 8 km through Winterberg to Langewiese",
          "Number 6 sits 50 m below the B480",
        ],
      },
      train: {
        number: "02",
        title: "By train + bus",
        body: "You can still get up without a car — the final stretch from Winterberg station is a 25-minute bus ride. Works fine for school-group sizes.",
        steps: [
          "Train to Winterberg (Westf) station",
          "From the adjacent ZOB: bus R28 toward Schmallenberg",
          "Get off at Langewiese Ortsmitte",
          "200 m on foot to bakery Gerke",
          "Directly opposite: driveway to the Wiesenhütte",
        ],
      },
      arrival: {
        number: "03",
        title: "Last metres",
        body: "The driveway sits below the main road — first-timers easily miss it. Look out for bakery Gerke across the street, that's the marker.",
        details: [
          "Gravel track, ~50 m downhill",
          "Slippery in winter — drive carefully",
          "Park right by the cabin (in summer)",
          "Key handover on site at arrival",
        ],
      },
    },
    parking: {
      eyebrow: "Parking",
      h2: "Summer or winter — it matters.",
      summer: {
        label: "Summer",
        h: "In front of the cabin",
        body: "Right in front of the cabin there's space for the whole group. Additionally one-sided parking on the main road above.",
      },
      winter: {
        label: "Winter",
        h: "Up on the main road",
        body: "When snow lies, everyone parks up on the main road — the gravel track turns icy and isn't a safe drive with a car.",
      },
    },
    map: {
      eyebrow: "Map",
      h2: "Here we are.",
      lead: "Langewiese, west-facing slope. Around: Asten massif, high moor, Rothaarsteig trail.",
      openIn: "Open in maps app",
    },
    infra: {
      eyebrow: "In the village",
      h2: "What you'll find within walking distance.",
      lead: "Langewiese is small but has everything essential within 200 metres.",
      cards: [
        { icon: "bakery", title: "Bakery Gerke", distance: "30 m across", hours: "Mon–Sat 6:30–12:30 · Mon–Fri 15:00–18:00", phone: "+49 2758 280", detail: "Rolls, cake, coffee. Pre-orders for groups possible — just call the evening before." },
        { icon: "catering", title: "Gasthof Graberhof", distance: "Hoheleye, 4 km", phone: "+49 2758 284", detail: "Catering for groups, Hohenleye 1, Winterberg-Hoheleye. Delivers to the cabin or you drive over — both work. Mobile: +49 160 7622508." },
        { icon: "emergency", title: "St. Franziskus Hospital", distance: "Winterberg, 8 km", phone: "+49 2981 8020", detail: "24/7 ER. For non-acute cases: on-call doctor 116 117. In acute emergencies always dial 112." },
      ],
    },
    notes: {
      eyebrow: "Practical",
      h2: "Three things to know before you arrive.",
      items: [
        { icon: "mountain", title: "690 metres up", body: "Langewiese is one of NRW's highest villages. Nights get cool even in summer — bring a jacket. In winter, snow often lies until April." },
        { icon: "alert", title: "Last filling station", body: "The nearest 24h station is in Winterberg (8 km). Late-evening arrivals: refuel beforehand." },
        { icon: "backpack", title: "Self-catered", body: "Shop before arriving — the nearest supermarket (EDEKA Löffler) is in Winterberg, closed Thursdays. Morning rolls at Gerke across the street." },
      ],
    },
    cta: {
      eyebrow: "Ready?",
      h2: "Check dates, travel up, settle in.",
      body: "If the location fits and the dates are free — booking is three clicks away.",
      button: "Check availability",
    },
  },
  nl: {
    hero: {
      meta: `51° 09' N · 8° 28' O · ${ELEVATION_M} m boven NAP`,
      h1l1: "Waar het bos",
      h1l2: "zich opent.",
      lead: "Langewiese ligt op 690 meter hoogte — op een plateau tussen de Rothaarsteig en het Hochsauerland. De hut ligt 50 meter onder de hoofdweg op de helling. Eén adres, drie manieren omhoog.",
    },
    address: {
      eyebrow: "Adres",
      statement: { l1: "Bundesstraße 6", l2: "59955 Winterberg-Langewiese", l3: "Hochsauerland · Duitsland" },
      metaLines: { coords: "Coördinaten", elevation: "Hoogte", from: "Bereikbaar in" },
      ctaApple: "Apple Maps",
      ctaGoogle: "Google Maps",
      ctaWaze: "Waze",
    },
    travelTimes: {
      eyebrow: "Reizen",
      h2: "Hoe ver je je voelt van huis.",
      cities: [
        { name: "Amsterdam", hours: "4u 00", sub: "Via Keulen — voor de Nederlandse gasten" },
        { name: "Düsseldorf", hours: "2u 00", sub: "Via de A46" },
        { name: "Keulen", hours: "2u 20", sub: "Via A4 + A45" },
        { name: "Brussel", hours: "4u 30", sub: "Via Aken + Keulen" },
      ],
    },
    routes: {
      eyebrow: "Drie wegen omhoog",
      h2: "Met auto, trein — of te voet.",
      lead: "Hoe je ook komt, het hooggelegen dorp is bereikbaar. Met sneeuw raden we winterbanden aan; in de zomer volstaat elke auto.",
      car: {
        number: "01",
        title: "Met de auto",
        body: "Via A44 (Soest/Werl) of A46 (Bestwig). Laatste stuk via de B480 door Winterberg naar Langewiese — een mooie rit door dicht gemengd bos.",
        details: [
          "A44 vanaf het Ruhrgebied / A46 vanaf Düsseldorf",
          "Afrit Bestwig → B480 richting Winterberg",
          "Door Winterberg verder naar Langewiese (8 km)",
          "Huisnummer 6 ligt 50 m onder de B480",
        ],
      },
      train: {
        number: "02",
        title: "Met trein + bus",
        body: "Zonder auto kun je ook omhoog — het laatste stuk vanaf station Winterberg is een busrit van 25 minuten. Werkt prima voor schoolgroepen.",
        steps: [
          "Trein tot station Winterberg (Westf)",
          "Vanaf het aansluitende ZOB: bus R28 richting Schmallenberg",
          "Uitstappen bij Langewiese Ortsmitte",
          "200 m lopen naar bakkerij Gerke",
          "Direct tegenover: oprit naar de Wiesenhütte",
        ],
      },
      arrival: {
        number: "03",
        title: "Laatste meters",
        body: "De oprit ligt onder de hoofdweg — eerste keer wordt hij makkelijk gemist. Let op bakkerij Gerke aan de overkant, dat is het herkenningspunt.",
        details: [
          "Onverharde weg, ~50 m omlaag",
          "Glad in de winter — voorzichtig rijden",
          "Direct voor de hut parkeren (in de zomer)",
          "Sleuteloverdracht ter plaatse bij aankomst",
        ],
      },
    },
    parking: {
      eyebrow: "Parkeren",
      h2: "Zomer of winter — het verschil telt.",
      summer: {
        label: "In de zomer",
        h: "Voor de hut",
        body: "Direct voor de hut is plek voor de hele groep. Daarnaast aan één kant boven aan de hoofdweg.",
      },
      winter: {
        label: "In de winter",
        h: "Boven aan de weg",
        body: "Bij sneeuw parkeert iedereen boven aan de hoofdweg — de onverharde weg wordt dan ijzig en is niet veilig met de auto.",
      },
    },
    map: {
      eyebrow: "Kaart",
      h2: "Hier liggen we.",
      lead: "Langewiese, helling op het westen. Eromheen: Asten-massief, hoogveen, Rothaarsteig.",
      openIn: "In kaarten-app openen",
    },
    infra: {
      eyebrow: "In het dorp",
      h2: "Wat je op loopafstand vindt.",
      lead: "Langewiese is klein maar heeft alles wat nodig is binnen 200 meter.",
      cards: [
        { icon: "bakery", title: "Bakkerij Gerke", distance: "30 m tegenover", hours: "Ma–Za 6:30–12:30 · Ma–Vr 15:00–18:00", phone: "+49 2758 280", detail: "Broodjes, taart, koffie. Vooraf bestellen voor groepen mogelijk — bel even de avond ervoor." },
        { icon: "catering", title: "Gasthof Graberhof", distance: "Hoheleye, 4 km", phone: "+49 2758 284", detail: "Catering voor groepen, Hohenleye 1, Winterberg-Hoheleye. Levert in de hut of je rijdt erheen — beide kan. Mobiel: +49 160 7622508." },
        { icon: "emergency", title: "St. Franziskus Hospital", distance: "Winterberg, 8 km", phone: "+49 2981 8020", detail: "24/7 spoedhulp. Voor niet-acute gevallen: huisartsenpost 116 117. Bij acuut gevaar altijd 112." },
      ],
    },
    notes: {
      eyebrow: "Praktisch",
      h2: "Drie dingen die je voor aankomst moet weten.",
      items: [
        { icon: "mountain", title: "690 meter hoogte", body: "Langewiese is een van NRW's hoogste dorpen. Ook in de zomer wordt het 's nachts koel — neem een jas mee. In de winter ligt vaak sneeuw tot april." },
        { icon: "alert", title: "Laatste tankstation", body: "Het dichtstbijzijnde 24-uurs tankstation is in Winterberg (8 km). Late aankomers: vooraf tanken." },
        { icon: "backpack", title: "Zelfvoorzienend", body: "Vóór aankomst boodschappen doen — de dichtstbijzijnde supermarkt (EDEKA Löffler) ligt in Winterberg, donderdag dicht. 's Ochtends broodjes bij Gerke tegenover." },
      ],
    },
    cta: {
      eyebrow: "Klaar?",
      h2: "Beschikbaarheid checken, omhoog rijden, aankomen.",
      body: "Als de plek past en de datum vrij is — boeken is drie klikken.",
      button: "Beschikbaarheid checken",
    },
  },
};

const INFRA_ICONS = {
  bakery: Croissant,
  catering: Utensils,
  emergency: Stethoscope,
} as const;

const NOTE_ICONS = {
  mountain: Mountain,
  alert: TriangleAlert,
  backpack: Backpack,
} as const;

export default async function LagePage() {
  const locale = await getServerLocale();
  const c = COPY[locale];

  return (
    <div className="bg-[var(--color-wh-snow)] overflow-x-clip">
      {/* ============= CINEMATIC HERO ============= */}
      <section className="relative min-h-[80vh] sm:min-h-[88vh] flex items-end overflow-hidden">
        <Image
          src="/media/photos/aerial-1.jpg"
          alt="Wiesenhütte aus der Luft — Hochsauerland-Plateau"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ filter: "saturate(0.95) contrast(1.02)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/15 to-black/75" />

        {/* Mountain silhouette overlay */}
        <svg
          className="absolute bottom-0 left-0 w-full opacity-30 pointer-events-none"
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          style={{ height: "25%" }}
          aria-hidden
        >
          <path
            fill="rgba(17,17,17,0.5)"
            d="M0,140 L180,90 L320,130 L470,70 L620,110 L780,60 L920,120 L1070,80 L1240,130 L1440,100 L1440,200 L0,200 Z"
          />
        </svg>

        <div className="relative max-w-[1280px] mx-auto px-6 sm:px-8 pb-16 sm:pb-24 pt-32 z-10 w-full">
          <ScrollReveal>
            <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-[var(--color-wh-snow)] text-[11px] uppercase tracking-[0.2em] font-semibold mb-7">
              <Compass size={13} />
              {c.hero.meta}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <h1
              className="font-display font-extrabold uppercase tracking-tight text-[var(--color-wh-snow)] m-0 leading-[0.92] drop-shadow-lg"
              style={{ fontSize: "clamp(44px, 8vw, 116px)", letterSpacing: "-0.03em" }}
            >
              {c.hero.h1l1}
              <br />
              <span className="text-[var(--color-wh-sunset)]">{c.hero.h1l2}</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={280}>
            <p className="text-[var(--color-wh-snow)]/90 text-base sm:text-[19px] leading-relaxed max-w-2xl mt-8 m-0 drop-shadow">
              {c.hero.lead}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ============= ADDRESS STATEMENT ============= */}
      <section className="px-6 sm:px-8 py-24 sm:py-32 bg-[var(--color-wh-snow)]">
        <div className="max-w-[1280px] mx-auto">
          <ScrollReveal>
            <div className="eyebrow text-[var(--color-wh-deep-green)] mb-8">{c.address.eyebrow}</div>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-20 items-end">
            {/* Big address statement */}
            <ScrollReveal delay={100}>
              <div>
                <h2
                  className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 leading-[0.96] uppercase"
                  style={{ fontSize: "clamp(32px, 5.5vw, 76px)", letterSpacing: "-0.025em" }}
                >
                  {c.address.statement.l1}
                  <br />
                  {c.address.statement.l2}
                </h2>
                <p
                  className="m-0 mt-4 text-[var(--color-wh-deep-green)]/70 text-[11px] sm:text-xs uppercase tracking-[0.3em] font-semibold"
                >
                  {c.address.statement.l3}
                </p>
              </div>
            </ScrollReveal>

            {/* Meta + Navi-Buttons */}
            <ScrollReveal delay={260}>
              <div className="space-y-6">
                <dl className="space-y-3 m-0">
                  <MetaRow icon={<MapPin size={14} />} label={c.address.metaLines.coords}>
                    {LAT.toFixed(4)}° N · {LNG.toFixed(4)}° O
                  </MetaRow>
                  <MetaRow icon={<Mountain size={14} />} label={c.address.metaLines.elevation}>
                    {ELEVATION_M} m ü. NHN
                  </MetaRow>
                </dl>
                <div className="pt-4 border-t border-[var(--color-wh-winter-grey)]">
                  <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[var(--color-wh-deep-green)]/60 m-0 mb-3">
                    {c.address.metaLines.from}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <NaviButton href={NAVI_LINKS.apple} label={c.address.ctaApple} />
                    <NaviButton href={NAVI_LINKS.google} label={c.address.ctaGoogle} primary />
                    <NaviButton href={NAVI_LINKS.waze} label={c.address.ctaWaze} />
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============= TRAVEL TIMES ============= */}
      <section className="px-6 sm:px-8 py-20 sm:py-28 bg-[var(--color-wh-beige)]">
        <div className="max-w-[1280px] mx-auto">
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10 sm:mb-14">
              <div className="md:col-span-5">
                <div className="eyebrow text-[var(--color-wh-deep-green)] mb-3">{c.travelTimes.eyebrow}</div>
                <h2
                  className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 leading-[1.02]"
                  style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-0.02em" }}
                >
                  {c.travelTimes.h2}
                </h2>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {c.travelTimes.cities.map((city, i) => (
              <ScrollReveal key={city.name} delay={i * 80}>
                <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-2xl p-5 sm:p-6 h-full flex flex-col">
                  <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-[var(--color-wh-deep-green)]/60 mb-3">
                    {city.name}
                  </div>
                  <div
                    className="font-display font-extrabold text-[var(--color-wh-deep-green)] leading-none tabular-nums mb-3"
                    style={{ fontSize: "clamp(28px, 3.5vw, 44px)" }}
                  >
                    {city.hours}
                  </div>
                  <p className="text-[12px] sm:text-[13px] text-[var(--color-wh-fg-muted)] m-0 leading-snug">
                    {city.sub}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============= ROUTES (3 Wege herauf) ============= */}
      <section className="px-6 sm:px-8 py-24 sm:py-32 bg-[var(--color-wh-snow)]">
        <div className="max-w-[1280px] mx-auto">
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12 sm:mb-16">
              <div className="md:col-span-5">
                <div className="eyebrow text-[var(--color-wh-deep-green)] mb-3">{c.routes.eyebrow}</div>
                <h2
                  className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 leading-[1.02]"
                  style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-0.02em" }}
                >
                  {c.routes.h2}
                </h2>
              </div>
              <div className="md:col-span-7 md:pt-3">
                <p className="text-base sm:text-[18px] leading-[1.7] text-[var(--color-wh-black)] m-0 max-w-2xl">
                  {c.routes.lead}
                </p>
              </div>
            </div>
          </ScrollReveal>

          <div className="space-y-10 sm:space-y-14">
            <ScrollReveal as="article">
              <RouteRow
                number={c.routes.car.number}
                icon={<Car size={28} strokeWidth={1.6} />}
                title={c.routes.car.title}
                body={c.routes.car.body}
                details={c.routes.car.details}
                imgSrc="/media/photos/anfahrt_a44.png"
                imgAlt="Anfahrt über die A44 ins Sauerland"
                imgRight={false}
              />
            </ScrollReveal>

            <ScrollReveal as="article">
              <RouteRow
                number={c.routes.train.number}
                icon={<TrainFront size={28} strokeWidth={1.6} />}
                title={c.routes.train.title}
                body={c.routes.train.body}
                stepsList={c.routes.train.steps}
                imgSrc="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/2019-04-19_Bahnhof_Winterberg_%28Westf%29_DB-Baureihe_633_109_%281%29.jpg/1280px-2019-04-19_Bahnhof_Winterberg_%28Westf%29_DB-Baureihe_633_109_%281%29.jpg"
                imgAlt="Bahnhof Winterberg (Westf) mit DB-Baureihe 633"
                imgRight={true}
                imgAttribution="Foto: Fantaglobe11 · CC BY-SA 4.0 · Wikimedia Commons"
              />
            </ScrollReveal>

            <ScrollReveal as="article">
              <RouteRow
                number={c.routes.arrival.number}
                icon={<MapPin size={28} strokeWidth={1.6} />}
                title={c.routes.arrival.title}
                body={c.routes.arrival.body}
                details={c.routes.arrival.details}
                imgSrc="/media/photos/ankunft_an_der_huette.png"
                imgAlt="Ankunft an der Wiesenhütte"
                imgRight={false}
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============= PARKING ============= */}
      <section className="px-6 sm:px-8 py-20 sm:py-28 bg-[var(--color-wh-beige)]">
        <div className="max-w-[1280px] mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
              <div className="eyebrow text-[var(--color-wh-deep-green)] mb-3 inline-flex items-center gap-2 justify-center">
                <ParkingCircle size={14} />
                {c.parking.eyebrow}
              </div>
              <h2
                className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 leading-[1.02]"
                style={{ fontSize: "clamp(44px, 7vw, 96px)", letterSpacing: "-0.025em" }}
              >
                {c.parking.h2}
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
            <ScrollReveal delay={80}>
              <ParkingCard
                icon={<Sun size={32} strokeWidth={1.5} />}
                accentClass="from-amber-400/30 via-orange-300/20 to-rose-300/10"
                label={c.parking.summer.label}
                h={c.parking.summer.h}
                body={c.parking.summer.body}
              />
            </ScrollReveal>
            <ScrollReveal delay={180}>
              <ParkingCard
                icon={<Snowflake size={32} strokeWidth={1.5} />}
                accentClass="from-sky-300/30 via-blue-200/20 to-indigo-200/10"
                label={c.parking.winter.label}
                h={c.parking.winter.h}
                body={c.parking.winter.body}
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============= MAP (custom illustrative) ============= */}
      <section className="px-6 sm:px-8 py-20 sm:py-28 bg-[var(--color-wh-snow)]">
        <div className="max-w-[1280px] mx-auto">
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 sm:mb-12">
              <div className="md:col-span-5">
                <div className="eyebrow text-[var(--color-wh-deep-green)] mb-3">{c.map.eyebrow}</div>
                <h2
                  className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 leading-[1.02]"
                  style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-0.02em" }}
                >
                  {c.map.h2}
                </h2>
              </div>
              <div className="md:col-span-7 md:pt-3">
                <p className="text-base sm:text-[18px] leading-[1.7] text-[var(--color-wh-black)] m-0 max-w-2xl">
                  {c.map.lead}
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <IllustratedMap />
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="mt-6 flex flex-wrap gap-2 sm:gap-3 items-center">
              <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-[var(--color-wh-deep-green)]/60 mr-2">
                {c.map.openIn}:
              </span>
              <MapDeepLink href={NAVI_LINKS.google} label="Google Maps" />
              <MapDeepLink href={NAVI_LINKS.apple} label="Apple Maps" />
              <MapDeepLink href={NAVI_LINKS.waze} label="Waze" />
              <MapDeepLink href={NAVI_LINKS.osm} label="OpenStreetMap" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============= INFRASTRUCTURE (Im Dorf) ============= */}
      <section className="px-6 sm:px-8 py-24 sm:py-32 bg-[var(--color-wh-beige)]">
        <div className="max-w-[1280px] mx-auto">
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12 sm:mb-16">
              <div className="md:col-span-5">
                <div className="eyebrow text-[var(--color-wh-deep-green)] mb-3">{c.infra.eyebrow}</div>
                <h2
                  className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 leading-[1.02]"
                  style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-0.02em" }}
                >
                  {c.infra.h2}
                </h2>
              </div>
              <div className="md:col-span-7 md:pt-3">
                <p className="text-base sm:text-[18px] leading-[1.7] text-[var(--color-wh-black)] m-0 max-w-2xl">
                  {c.infra.lead}
                </p>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {c.infra.cards.map((card, i) => {
              const Icon = INFRA_ICONS[card.icon];
              return (
                <ScrollReveal key={card.title} delay={i * 100}>
                  <article className="bg-white border border-[var(--color-wh-winter-grey)] rounded-2xl p-6 sm:p-7 h-full flex flex-col">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-wh-green-soft)] text-[var(--color-wh-deep-green)] flex items-center justify-center mb-5">
                      <Icon size={22} strokeWidth={1.6} />
                    </div>
                    <h3 className="font-display font-bold text-[var(--color-wh-deep-green)] text-[19px] sm:text-[22px] m-0 mb-2 leading-tight">
                      {card.title}
                    </h3>
                    <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-wh-deep-green)]/70 mb-4">
                      <MapPin size={11} />
                      {card.distance}
                    </div>
                    <p className="text-[14px] text-[var(--color-wh-black)] leading-relaxed m-0 mb-4">
                      {card.detail}
                    </p>
                    <div className="mt-auto pt-4 border-t border-[var(--color-wh-winter-grey)]/60 space-y-2 text-[12px] text-[var(--color-wh-fg-muted)]">
                      {card.hours && (
                        <div className="flex items-start gap-1.5">
                          <Clock size={11} className="mt-0.5 shrink-0" />
                          <span>{card.hours}</span>
                        </div>
                      )}
                      {card.phone && (
                        <a
                          href={`tel:${card.phone.replace(/\s/g, "")}`}
                          className="flex items-center gap-1.5 text-[var(--color-wh-deep-green)] font-semibold no-underline hover:underline"
                        >
                          <Phone size={11} />
                          {card.phone}
                        </a>
                      )}
                    </div>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============= PRACTICAL NOTES ============= */}
      <section className="px-6 sm:px-8 py-24 sm:py-32 bg-[var(--color-wh-snow)]">
        <div className="max-w-[1280px] mx-auto">
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12 sm:mb-16">
              <div className="md:col-span-5">
                <div className="eyebrow text-[var(--color-wh-deep-green)] mb-3">{c.notes.eyebrow}</div>
                <h2
                  className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 leading-[1.02]"
                  style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-0.02em" }}
                >
                  {c.notes.h2}
                </h2>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {c.notes.items.map((item, i) => {
              const Icon = NOTE_ICONS[item.icon];
              return (
                <ScrollReveal key={item.title} delay={i * 100}>
                  <article className="border-l-2 border-[var(--color-wh-sunset)] pl-5 sm:pl-6 py-2 h-full">
                    <Icon size={28} strokeWidth={1.5} className="text-[var(--color-wh-sunset)] mb-4" />
                    <h3 className="font-display font-bold text-[var(--color-wh-deep-green)] text-[18px] sm:text-[20px] m-0 mb-3 leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-[14px] sm:text-[15px] text-[var(--color-wh-black)] leading-relaxed m-0">
                      {item.body}
                    </p>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============= CTA ============= */}
      <section className="relative px-6 sm:px-8 py-24 sm:py-32 bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] overflow-hidden">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 35%, rgba(247,247,242,0.5) 0px, transparent 55%), radial-gradient(circle at 78% 70%, rgba(255,170,90,0.3) 0px, transparent 50%)",
          }}
        />
        <div className="relative max-w-[800px] mx-auto text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-[11px] uppercase tracking-[0.2em] font-semibold mb-6">
              <Bus size={12} />
              {c.cta.eyebrow}
            </div>
            <h2
              className="font-display font-bold m-0 mb-5 leading-tight text-[var(--color-wh-snow)]"
              style={{ fontSize: "clamp(28px, 4.5vw, 48px)", letterSpacing: "-0.02em" }}
            >
              {c.cta.h2}
            </h2>
            <p className="text-[var(--color-wh-snow)]/85 text-base sm:text-lg leading-relaxed m-0 mb-9 max-w-lg mx-auto">
              {c.cta.body}
            </p>
            <a
              href="/buchen"
              className="inline-flex items-center gap-2 h-13 px-7 rounded-full bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] font-semibold no-underline hover:bg-white transition-colors shadow-[var(--shadow-float)]"
            >
              {c.cta.button}
              <ArrowRight size={18} />
            </a>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

// =============================================================
// HELPER COMPONENTS
// =============================================================

const MetaRow = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-baseline gap-3">
    <span className="text-[var(--color-wh-deep-green)]/50 mt-1 shrink-0">{icon}</span>
    <div className="flex-1 min-w-0">
      <dt className="text-[10px] uppercase tracking-[0.25em] font-bold text-[var(--color-wh-deep-green)]/60 m-0 mb-0.5">
        {label}
      </dt>
      <dd className="m-0 text-[15px] sm:text-base text-[var(--color-wh-deep-green)] font-semibold tabular-nums">
        {children}
      </dd>
    </div>
  </div>
);

const NaviButton = ({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[12px] font-semibold no-underline transition-colors ${
      primary
        ? "bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] hover:opacity-90"
        : "bg-white text-[var(--color-wh-deep-green)] border border-[var(--color-wh-winter-grey)] hover:bg-[var(--color-wh-green-soft)]"
    }`}
  >
    {label}
    <ExternalLink size={11} />
  </a>
);

const MapDeepLink = ({ href, label }: { href: string; label: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[var(--color-wh-winter-grey)] text-[12px] font-semibold text-[var(--color-wh-deep-green)] no-underline hover:bg-[var(--color-wh-green-soft)] transition-colors"
  >
    {label}
    <ExternalLink size={10} />
  </a>
);

const RouteRow = ({
  number,
  icon,
  title,
  body,
  details,
  stepsList,
  imgSrc,
  imgAlt,
  imgRight,
  imgAttribution,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  details?: string[];
  stepsList?: string[];
  imgSrc: string;
  imgAlt: string;
  imgRight: boolean;
  imgAttribution?: string;
}) => (
  <div
    className={`grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center ${
      imgRight ? "md:[&>.media]:order-2" : ""
    }`}
  >
    <div className="media md:col-span-5">
      <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-[var(--color-wh-winter-grey)] shadow-[0_16px_44px_rgba(47,74,53,0.10)]">
        <Image src={imgSrc} alt={imgAlt} fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
      </div>
      {imgAttribution && (
        <p className="text-[10px] text-[var(--color-wh-fg-muted)]/70 mt-2 text-right m-0">
          {imgAttribution}
        </p>
      )}
    </div>
    <div className="md:col-span-7">
      <div className="flex items-end gap-5 mb-5">
        <div
          className="font-display font-extrabold leading-none text-transparent select-none"
          style={{
            fontSize: "clamp(56px, 8vw, 110px)",
            WebkitTextStroke: "1.5px var(--color-wh-deep-green)",
            letterSpacing: "-0.05em",
          }}
        >
          {number}
        </div>
        <div className="pb-2 flex items-center gap-3 text-[var(--color-wh-deep-green)]">
          {icon}
          <h3
            className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 leading-tight"
            style={{ fontSize: "clamp(24px, 2.8vw, 36px)", letterSpacing: "-0.015em" }}
          >
            {title}
          </h3>
        </div>
      </div>
      <p className="text-[15px] sm:text-base leading-relaxed text-[var(--color-wh-black)] m-0 mb-6 max-w-2xl">
        {body}
      </p>
      {details && (
        <ul className="list-none p-0 m-0 space-y-2 max-w-xl">
          {details.map((d, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-[13px] sm:text-[14px] text-[var(--color-wh-deep-green)]/85"
            >
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-wh-sunset)] shrink-0" aria-hidden />
              {d}
            </li>
          ))}
        </ul>
      )}
      {stepsList && (
        <ol className="list-none p-0 m-0 space-y-3 max-w-xl">
          {stepsList.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-[14px] text-[var(--color-wh-deep-green)]/90">
              <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-wh-green-soft)] text-[var(--color-wh-deep-green)] text-[11px] font-bold tabular-nums">
                {i + 1}
              </span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  </div>
);

// =============================================================
// ILLUSTRATIVE MAP — Custom SVG anstelle eines generischen OSM-Iframes.
// Vereinfachte Uebersichtskarte des Hochsauerlands rund um Langewiese.
// Stilisiert, NICHT topographisch exakt — es geht um Orientierung, nicht
// Vermessung. Wiesenhuette als pulsierender Sunset-Pin im Zentrum,
// drumherum Winterberg, Niedersfeld+Hochheide, Kahler Asten, Neuastenberg.
// =============================================================
const IllustratedMap = () => (
  <div className="relative aspect-[16/9] sm:aspect-[16/8] rounded-3xl overflow-hidden border border-[var(--color-wh-winter-grey)] shadow-[0_20px_60px_rgba(47,74,53,0.12)] bg-[#f5efe2]">
    <svg
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      className="w-full h-full"
      role="img"
      aria-label="Ubersichtskarte Hochsauerland um die Wiesenhutte"
    >
      <defs>
        {/* Hintergrund-Verlauf: warmes Beige nach kuehlerem Grün-Beige */}
        <linearGradient id="mapBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f5efe2" />
          <stop offset="100%" stopColor="#e6ddc8" />
        </linearGradient>
        {/* Wald-Patch-Farbe */}
        <radialGradient id="forest" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6FA05F" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#2F4A35" stopOpacity="0.12" />
        </radialGradient>
        {/* Pulsierender Wiesenhütten-Ring */}
        <radialGradient id="huettePulse" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#B85C38" stopOpacity="0.45" />
          <stop offset="70%" stopColor="#B85C38" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#B85C38" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect width="1200" height="600" fill="url(#mapBg)" />

      {/* Subtile Höhenlinien (topographisch angedeutet) */}
      <g stroke="#bfa980" strokeWidth="0.8" fill="none" opacity="0.35">
        <path d="M-50,180 Q300,140 600,200 T1250,180" />
        <path d="M-50,250 Q300,210 600,270 T1250,250" />
        <path d="M-50,320 Q300,280 600,340 T1250,320" />
        <path d="M-50,390 Q300,350 600,410 T1250,390" />
        <path d="M-50,460 Q300,420 600,480 T1250,460" />
      </g>

      {/* Wald-Patches (große Areale) */}
      <ellipse cx="220" cy="380" rx="170" ry="100" fill="url(#forest)" />
      <ellipse cx="970" cy="180" rx="180" ry="110" fill="url(#forest)" />
      <ellipse cx="1020" cy="450" rx="150" ry="90" fill="url(#forest)" />
      <ellipse cx="380" cy="150" rx="140" ry="80" fill="url(#forest)" />

      {/* Verstreute Tannen-Symbole */}
      {[
        [120, 380],
        [180, 420],
        [260, 360],
        [320, 410],
        [240, 300],
        [900, 160],
        [970, 130],
        [1040, 200],
        [980, 230],
        [990, 440],
        [1060, 470],
        [1020, 510],
        [340, 130],
        [400, 170],
        [460, 100],
        [60, 250],
        [60, 480],
        [1140, 280],
        [80, 100],
        [1150, 90],
        [780, 530],
        [200, 540],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y}) scale(0.9)`}>
          <path d="M0,-10 L7,4 L-7,4 Z" fill="#3a5a3f" opacity="0.7" />
          <path d="M0,-3 L9,10 L-9,10 Z" fill="#2F4A35" opacity="0.78" />
          <rect x="-1.5" y="9" width="3" height="4" fill="#5a4830" />
        </g>
      ))}

      {/* B480 — geschwungene gestrichelte Strasse */}
      <path
        d="M 100,140 Q 350,220 480,260 Q 580,290 600,300 Q 650,330 760,360 Q 920,410 1100,500"
        stroke="#5a4830"
        strokeWidth="3"
        strokeDasharray="10 7"
        fill="none"
        opacity="0.55"
      />
      <text
        x="200"
        y="220"
        fontSize="13"
        fontFamily="ui-monospace,monospace"
        fill="#5a4830"
        opacity="0.7"
        fontWeight="600"
        letterSpacing="2"
      >
        B 480
      </text>

      {/* Rothaarsteig — angedeuteter Wanderweg */}
      <path
        d="M 50,200 Q 300,160 500,230 Q 700,300 900,260 Q 1080,230 1180,290"
        stroke="#B85C38"
        strokeWidth="2"
        strokeDasharray="3 4"
        fill="none"
        opacity="0.6"
      />
      <text
        x="930"
        y="248"
        fontSize="10"
        fontFamily="var(--font-display, serif)"
        fill="#B85C38"
        opacity="0.8"
        fontStyle="italic"
      >
        Rothaarsteig
      </text>

      {/* === PINS === */}

      {/* Pin: Niedersfeld + Hochheide (Norden) */}
      <SvgPin x={480} y={110} label="Niedersfeld" sublabel="Hochheide · 6 km" />

      {/* Pin: Kahler Asten (Nordosten) */}
      <SvgPin x={760} y={200} label="Kahler Asten" sublabel="Aussichtsturm · 841 m" />

      {/* Pin: Winterberg (Sudosten) */}
      <SvgPin x={920} y={430} label="Winterberg" sublabel="Skigebiet · 8 km" />

      {/* Pin: Neuastenberg (Sudwesten) */}
      <SvgPin x={380} y={420} label="Neuastenberg" sublabel="Postwiese · 4 km" />

      {/* Pin: WIESENHUTTE — gross, zentriert, mit pulsierendem Ring */}
      <g transform="translate(600,320)">
        {/* Pulse Ring */}
        <circle cx="0" cy="0" r="60" fill="url(#huettePulse)">
          <animate
            attributeName="r"
            values="40;70;40"
            dur="3.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.7;0.1;0.7"
            dur="3.5s"
            repeatCount="indefinite"
          />
        </circle>
        {/* Pin */}
        <circle cx="0" cy="0" r="18" fill="#B85C38" />
        <circle cx="0" cy="0" r="18" fill="none" stroke="#fff" strokeWidth="3" />
        <circle cx="0" cy="0" r="6" fill="#fff" />
        {/* Label */}
        <g transform="translate(0,42)">
          <rect x="-65" y="-2" width="130" height="22" rx="3" fill="#2F4A35" />
          <text
            x="0"
            y="14"
            textAnchor="middle"
            fontSize="12"
            fontFamily="var(--font-display, sans-serif)"
            fill="#F7F7F2"
            fontWeight="700"
            letterSpacing="1"
          >
            WIESENHÜTTE
          </text>
        </g>
        <text
          x="0"
          y="78"
          textAnchor="middle"
          fontSize="10"
          fontFamily="ui-monospace,monospace"
          fill="#2F4A35"
          opacity="0.75"
          letterSpacing="1.5"
        >
          LANGEWIESE · 690 m
        </text>
      </g>

      {/* Compass-Rose oben rechts */}
      <g transform="translate(1110, 80)">
        <circle cx="0" cy="0" r="32" fill="#F7F7F2" stroke="#2F4A35" strokeOpacity="0.4" strokeWidth="1.2" />
        {/* N-Pfeil */}
        <path d="M 0,-22 L 6,4 L 0,-2 L -6,4 Z" fill="#B85C38" />
        <path d="M 0,22 L 6,-4 L 0,2 L -6,-4 Z" fill="#2F4A35" opacity="0.4" />
        <text
          x="0"
          y="-28"
          textAnchor="middle"
          fontSize="11"
          fontFamily="var(--font-display, sans-serif)"
          fill="#2F4A35"
          fontWeight="700"
        >
          N
        </text>
      </g>

      {/* Scale-bar unten links */}
      <g transform="translate(60, 540)">
        <rect x="0" y="0" width="80" height="6" fill="#2F4A35" opacity="0.7" />
        <rect x="80" y="0" width="80" height="6" fill="none" stroke="#2F4A35" strokeWidth="1.2" opacity="0.7" />
        <text x="0" y="22" fontSize="10" fontFamily="ui-monospace,monospace" fill="#2F4A35" opacity="0.65" letterSpacing="1">
          0
        </text>
        <text x="76" y="22" fontSize="10" fontFamily="ui-monospace,monospace" fill="#2F4A35" opacity="0.65" letterSpacing="1">
          2
        </text>
        <text x="156" y="22" fontSize="10" fontFamily="ui-monospace,monospace" fill="#2F4A35" opacity="0.65" letterSpacing="1">
          4 km
        </text>
      </g>

      {/* Issue-Stempel oben links */}
      <g transform="translate(60, 70)" opacity="0.6">
        <text x="0" y="0" fontSize="9" fontFamily="ui-monospace,monospace" fill="#2F4A35" letterSpacing="2" fontWeight="700">
          HOCHSAUERLAND
        </text>
        <text x="0" y="14" fontSize="9" fontFamily="ui-monospace,monospace" fill="#2F4A35" letterSpacing="2">
          51° 09′ N · 8° 28′ O
        </text>
      </g>
    </svg>
  </div>
);

// SVG-Pin (kleiner) fuer Nachbarorte — NICHT der MapPin aus lucide-react!
const SvgPin = ({ x, y, label, sublabel }: { x: number; y: number; label: string; sublabel?: string }) => (
  <g transform={`translate(${x},${y})`}>
    <circle cx="0" cy="0" r="9" fill="#2F4A35" />
    <circle cx="0" cy="0" r="9" fill="none" stroke="#fff" strokeWidth="2" />
    <circle cx="0" cy="0" r="3" fill="#fff" />
    <text
      x="14"
      y="-3"
      fontSize="13"
      fontFamily="var(--font-display, sans-serif)"
      fill="#2F4A35"
      fontWeight="700"
    >
      {label}
    </text>
    {sublabel && (
      <text
        x="14"
        y="12"
        fontSize="10"
        fontFamily="ui-monospace,monospace"
        fill="#2F4A35"
        opacity="0.65"
        letterSpacing="0.5"
      >
        {sublabel}
      </text>
    )}
  </g>
);

const ParkingCard = ({
  icon,
  accentClass,
  label,
  h,
  body,
}: {
  icon: React.ReactNode;
  accentClass: string;
  label: string;
  h: string;
  body: string;
}) => (
  <div className={`relative aspect-[5/4] sm:aspect-[3/2] rounded-3xl overflow-hidden border border-[var(--color-wh-winter-grey)] bg-gradient-to-br ${accentClass} p-8 sm:p-10 flex flex-col justify-between shadow-[0_16px_44px_rgba(47,74,53,0.08)]`}>
    <div
      className="absolute inset-0 opacity-30 pointer-events-none"
      style={{
        backgroundImage:
          "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55) 0px, transparent 45%)",
      }}
      aria-hidden
    />
    <div className="relative text-[var(--color-wh-deep-green)] opacity-85">{icon}</div>
    <div className="relative">
      <div className="text-[11px] uppercase tracking-[0.25em] font-bold text-[var(--color-wh-deep-green)]/70 mb-3">
        {label}
      </div>
      <h3
        className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 mb-4 leading-tight"
        style={{ fontSize: "clamp(24px, 2.8vw, 32px)" }}
      >
        {h}
      </h3>
      <p className="text-[14px] sm:text-[15px] text-[var(--color-wh-black)]/85 leading-relaxed m-0 max-w-md">
        {body}
      </p>
    </div>
  </div>
);
