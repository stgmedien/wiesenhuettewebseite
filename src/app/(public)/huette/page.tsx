import Link from "next/link";
import Image from "next/image";
import { DonationSection } from "@/components/public/huette/DonationSection";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";
import { FloorPlanExplorer, type Floor } from "@/components/public/huette/FloorPlanExplorer";

export const metadata = {
  title: "Die Hütte · Wiesenhütte Langewiese",
  description:
    "33 Schlafplätze in 5 Schlafzimmern, voll ausgestattete Küche, zwei Aufenthaltsräume, Skikeller, Feuerstelle. Selbstversorgerhütte für Gruppen in Langewiese, Hochsauerland.",
};

type Copy = {
  hero: { eyebrow: string; h1l1: string; h1l2: string };
  facts: { sleeps: string; rooms: string; lounges: string; occupancy: string };
  desc: { eyebrow: string; h2: string; body: string };
  rooms: {
    heading: string;
    bedNote: string;
    items: Array<{ name: string; floor: string; detail: string }>;
  };
  ausstattung: {
    heading: string;
    eg: { heading: string; items: string[] };
    og: { heading: string; items: string[] };
    ug: { heading: string; items: string[] };
    aussen: { heading: string; items: string[] };
    heat: { heading: string; items: string[] };
  };
  floorPlans: {
    eyebrow: string;
    h2: string;
    lead: string;
    sleepingLabel: string;
    sleepingWordOne: string;
    sleepingWordOther: string;
    nonSleepingLabel: string;
    roomsLabel: string;
    selectAriaLabel: string;
    floors: {
      ug: { label: string; tag: string; highlights: string[] };
      eg: { label: string; tag: string; highlights: string[] };
      og: { label: string; tag: string; highlights: string[] };
      dg: { label: string; tag: string; highlights: string[] };
    };
  };
  gallery: { eyebrow: string; h2: string };
  hub: {
    eyebrow: string;
    h2: string;
    body: string;
    list: { eye: string; title: string; body: string; cta: string };
  };
  spenden: import("@/components/public/huette/DonationSection").DonationCopy;
  cta: { eyebrow: string; h2: string; button: string };
};

const COPY: Record<Locale, Copy> = {
  de: {
    hero: { eyebrow: "Die Hütte", h1l1: "Echtes Hüttenleben.", h1l2: "Selbstversorgung." },
    facts: { sleeps: "Schlafplätze", rooms: "Schlafzimmer", lounges: "Aufenthaltsräume", occupancy: "Personen Belegung" },
    desc: {
      eyebrow: "Beschreibung",
      h2: "Zwei Vollgeschosse, Dachboden, Untergeschoss.",
      body: "Die Wiesenhütte liegt etwa 50 m unterhalb der Bundesstraße am Hang in Langewiese, einem Höhendorf bei Winterberg im Hochsauerland. Sie ist eine Selbstversorgerhütte für Vereins-, Schul-, Klassen- und Gruppenfahrten. Atmosphäre: bewusst entschleunigt, gemeinsames Kochen, Abende an der Feuerstelle, Natur direkt vor der Tür.",
    },
    rooms: {
      heading: "Schlafzimmer",
      bedNote: "Wichtig: Wir stellen NUR Kopfkissen (ohne Bezug). Bettdecken mit Bezug oder Schlafsäcke UND Kopfkissenbezüge bitte selbst mitbringen.",
      items: [
        { name: "Naturtraum", floor: "1. Etage", detail: "8 Schlafplätze in Etagenbetten" },
        { name: "Waldblick", floor: "Dachgeschoss", detail: "4 Schlafplätze in Bodenbetten · über Innentreppe mit Naturtraum verbunden" },
        { name: "Sonnenplatz", floor: "1. Etage", detail: `4 Schlafplätze in Etagenbetten · Sitzecke mit Tisch („Lehrerzimmer")` },
        { name: "Vogelnest", floor: "Dachgeschoss", detail: "4 Schlafplätze in Bodenbetten" },
        { name: "Baumkrone", floor: "Dachgeschoss", detail: "13 Schlafplätze in Bodenbetten" },
      ],
    },
    ausstattung: {
      heading: "Räume & Ausstattung",
      eg: {
        heading: "Erdgeschoss",
        items: [
          "Windfang mit Garderobe und Schuhregal",
          "Esszimmer mit 4 Tischen für mind. 6 Personen",
          "Küche mit 2 Herden, Backofen, Mikrowelle, Spülmaschine, Filter-Kaffeemaschine",
          "Vorratsraum mit großem und kleinem Kühlschrank (mit Gefrierfach)",
          "Allzweckraum",
        ],
      },
      og: {
        heading: "Obergeschoss",
        items: [
          "Aufenthaltsraum mit 4 Tischen",
          "Gästetoilette",
        ],
      },
      ug: {
        heading: "Untergeschoss",
        items: [
          "2 Sanitärräume mit je 2 Duschen, 2 Toiletten, 4 Waschbecken",
          "Skikeller / Radkeller von außen zugänglich",
          "Grill",
        ],
      },
      aussen: {
        heading: "Außenbereich",
        items: ["Freisitz", "Baumbank", "Selbstgebaute Feuerstelle", "Eigener Rodelhang neben der Hütte"],
      },
      heat: {
        heading: "Heizung & Verpflegung",
        items: [
          "Zentralheizung in allen Räumen",
          "Selbstversorgung — Hygieneartikel bitte mitbringen",
          "Bäckerei Gerke direkt gegenüber",
          "Catering für Gruppen nach Absprache — Gasthof Graberhof, Hohenleye 1, Winterberg-Hoheleye (Tel. 02758 / 284, mobil 0160 7622508)",
        ],
      },
    },
    floorPlans: {
      eyebrow: "Grundrisse",
      h2: "Vier Geschosse, ein Haus.",
      lead: "Klick Dich durch die vier Etagen — Untergeschoss, Erdgeschoss, Obergeschoss, Dachgeschoss. Jede Etage hat ihre eigene Funktion, ihren eigenen Charakter. Über das interne Treppenhaus sind alle verbunden.",
      sleepingLabel: "Schlafplätze",
      sleepingWordOne: "Schlafplatz",
      sleepingWordOther: "Schlafplätze",
      nonSleepingLabel: "Gemeinschaft & Versorgung",
      roomsLabel: "Auf dieser Etage",
      selectAriaLabel: "Etage auswählen",
      floors: {
        ug: {
          label: "Untergeschoss",
          tag: "UG",
          highlights: [
            "Eingang & Schlüsselübergabe",
            "Rad- und Skikeller",
            "Sanitärräume mit Duschen, WCs, Waschbecken",
          ],
        },
        eg: {
          label: "Erdgeschoss",
          tag: "EG",
          highlights: [
            "Esszimmer mit 4 Tischen",
            "Voll ausgestattete Küche",
            "Vorratsraum mit Kühl- und Gefrierfach",
            "Garderobe & Freisitz nach draußen",
          ],
        },
        og: {
          label: "Obergeschoss",
          tag: "OG",
          highlights: [
            "Naturtraum — 8 Schlafplätze",
            "Sonnenplatz — 4 Schlafplätze",
            "Aufenthaltsraum mit 4 Tischen",
            "Gästetoilette",
          ],
        },
        dg: {
          label: "Dachgeschoss",
          tag: "DG",
          highlights: [
            "Baumkrone — 13 Schlafplätze",
            "Waldblick — 4 Schlafplätze",
            "Vogelnest — 4 Schlafplätze",
            "Eigene Dach-Toilette",
          ],
        },
      },
    },
    gallery: { eyebrow: "Galerie", h2: "Innen, außen, Natur." },
    hub: {
      eyebrow: "Für Deinen Aufenthalt",
      h2: "Damit Du gut vorbereitet bist.",
      body: "Ein kleines Tool, das wir Gästen vor der Anreise an die Hand geben: einen persönlichen Packlisten-Generator, der zu Saison und Plan passt.",
      list: {
        eye: "Vor der Anreise · Persönlich",
        title: "Persönliche Packliste.",
        body: `Saison + geplante Aktivitäten eintragen, und Du bekommst eine maßgeschneiderte Liste für Dich selbst — inklusive einer Sektion „Gruppen-Items zum Absprechen". Druckbar als PDF mit Häkchen-Boxen.`,
        cta: "Packliste erstellen →",
      },
    },
    spenden: {
      eyebrow: "Mitmachen · Crowdfunding",
      h2: "Spendet für das Zeltpodest.",
      body: "Direkt neben der Hütte soll ein ebenes Holzpodest zum Zelten entstehen — ein fester, gerader Untergrund, auf dem Zelte trocken und bequem stehen. Gebaut wird es, wie an der Wiese alles entsteht: gemeinsam, mit vielen helfenden Händen und vielen kleinen Beiträgen. Jede Spende bringt das Podest ein Stück näher; über den Baufortschritt halten wir Euch hier auf dem Laufenden.",
      amountLabel: "Betrag wählen",
      customLabel: "Eigener Betrag in €",
      cta: "Jetzt spenden",
      secure: "Sichere Zahlung über Stripe · Empfänger: Skifreunde Gütersloh e.V. · Zweck: Zeltpodest",
      thanks: "Danke für Deine Spende — das Zeltpodest rückt ein Stück näher!",
      error: "Bitte wähle einen Betrag zwischen 2 € und 5.000 €.",
    },
    cta: { eyebrow: "Bereit?", h2: "Termin auswählen, Personen eintragen, buchen.", button: "Verfügbarkeit prüfen" },
  },
  en: {
    hero: { eyebrow: "The Cabin", h1l1: "Real cabin life.", h1l2: "Self-catering." },
    facts: { sleeps: "Sleeping spots", rooms: "Bedrooms", lounges: "Common rooms", occupancy: "Guest capacity" },
    desc: {
      eyebrow: "Description",
      h2: "Two full floors, attic, basement.",
      body: "The Wiesenhütte sits about 50 m below the main road on a hillside in Langewiese, a highland village near Winterberg in the Hochsauerland. It is a self-catering cabin for clubs, schools, classes and groups. The atmosphere is intentionally slow: cooking together, evenings at the fire pit, nature right outside the door.",
    },
    rooms: {
      heading: "Bedrooms",
      bedNote: "Important: We provide PILLOWS ONLY (no covers). Please bring your own duvet with cover or sleeping bag — plus pillowcases for the pillows we provide.",
      items: [
        { name: "Naturtraum (\"Nature dream\")", floor: "1st floor", detail: "8 beds in bunk beds" },
        { name: "Waldblick (\"Forest view\")", floor: "Attic", detail: "4 beds on the floor · connected to Naturtraum by an internal staircase" },
        { name: "Sonnenplatz (\"Sunny spot\")", floor: "1st floor", detail: `4 beds in bunk beds · seating corner with table ("teacher's room")` },
        { name: "Vogelnest (\"Bird's nest\")", floor: "Attic", detail: "4 beds on the floor" },
        { name: "Baumkrone (\"Treetop\")", floor: "Attic", detail: "13 beds on the floor" },
      ],
    },
    ausstattung: {
      heading: "Rooms & equipment",
      eg: {
        heading: "Ground floor",
        items: [
          "Entryway with wardrobe and shoe rack",
          "Dining room with 4 tables for at least 6 people each",
          "Kitchen with 2 stoves, oven, microwave, dishwasher, drip coffee maker",
          "Pantry with large and small fridge (with freezer)",
          "Multi-purpose room",
        ],
      },
      og: {
        heading: "Upper floor",
        items: [
          "Common room with 4 tables",
          "Guest toilet",
        ],
      },
      ug: {
        heading: "Basement",
        items: [
          "2 bathrooms each with 2 showers, 2 toilets, 4 sinks",
          "Ski / bike cellar accessible from outside",
          "BBQ grill",
        ],
      },
      aussen: {
        heading: "Outdoors",
        items: ["Patio seating", "Log bench", "Self-built fire pit", "Private sledding slope next to the cabin"],
      },
      heat: {
        heading: "Heating & catering",
        items: [
          "Central heating in all rooms",
          "Self-catering — please bring your own hygiene items",
          "Bakery Gerke directly across the road",
          "Catering for groups on request — Gasthof Graberhof, Hohenleye 1, Winterberg-Hoheleye (phone 02758 / 284, mobile 0160 7622508)",
        ],
      },
    },
    floorPlans: {
      eyebrow: "Floor plans",
      h2: "Four floors, one house.",
      lead: "Step through all four floors — basement, ground floor, upper floor, attic. Each level has its own purpose and character, all connected by the internal staircase.",
      sleepingLabel: "Beds",
      sleepingWordOne: "bed",
      sleepingWordOther: "beds",
      nonSleepingLabel: "Common areas & services",
      roomsLabel: "On this floor",
      selectAriaLabel: "Select floor",
      floors: {
        ug: {
          label: "Basement",
          tag: "B",
          highlights: [
            "Entrance & key handover",
            "Bike and ski cellar",
            "Bathrooms with showers, toilets, sinks",
          ],
        },
        eg: {
          label: "Ground floor",
          tag: "GF",
          highlights: [
            "Dining room with 4 tables",
            "Fully equipped kitchen",
            "Pantry with fridge and freezer",
            "Wardrobe & outdoor patio",
          ],
        },
        og: {
          label: "Upper floor",
          tag: "UF",
          highlights: [
            "Naturtraum — 8 beds",
            "Sonnenplatz — 4 beds",
            "Common room with 4 tables",
            "Guest toilet",
          ],
        },
        dg: {
          label: "Attic",
          tag: "A",
          highlights: [
            "Baumkrone — 13 beds",
            "Waldblick — 4 beds",
            "Vogelnest — 4 beds",
            "Own attic toilet",
          ],
        },
      },
    },
    gallery: { eyebrow: "Gallery", h2: "Inside, outside, nature." },
    hub: {
      eyebrow: "For your stay",
      h2: "So you're well prepared.",
      body: "One small tool we hand to guests before arrival: a personal packing-list generator that matches season and plan.",
      list: {
        eye: "Before arrival · Personal",
        title: "Personal packing list.",
        body: "Enter season + planned activities and you get a tailor-made list for yourself — including a \"group items to coordinate\" section. Printable as PDF with checkboxes.",
        cta: "Create packing list →",
      },
    },
    spenden: {
      eyebrow: "Join in · Crowdfunding",
      h2: "Donate for the tent deck.",
      body: "Right next to the cabin, we want to build a level wooden deck for tents — a firm, even base where tents stand dry and comfortable. It will come together the way everything here does: as a group, with many helping hands and many small contributions. Every donation brings the deck a step closer; we'll keep you posted on the progress here.",
      amountLabel: "Choose an amount",
      customLabel: "Custom amount in €",
      cta: "Donate now",
      secure: "Secure payment via Stripe · Recipient: Skifreunde Gütersloh e.V. · Purpose: tent deck",
      thanks: "Thank you for your donation — the tent deck just moved a step closer!",
      error: "Please choose an amount between €2 and €5,000.",
    },
    cta: { eyebrow: "Ready?", h2: "Pick dates, enter guests, book.", button: "Check availability" },
  },
  nl: {
    hero: { eyebrow: "De hut", h1l1: "Echt huttenleven.", h1l2: "Zelfvoorzienend." },
    facts: { sleeps: "Slaapplaatsen", rooms: "Slaapkamers", lounges: "Verblijfsruimtes", occupancy: "Personen capaciteit" },
    desc: {
      eyebrow: "Beschrijving",
      h2: "Twee volledige verdiepingen, zolder, kelder.",
      body: "De Wiesenhütte ligt ongeveer 50 m onder de hoofdweg op een helling in Langewiese, een hooggelegen dorp bij Winterberg in het Hochsauerland. Het is een zelfvoorzienende hut voor verenigingen, scholen, klassen en groepen. De sfeer is bewust rustig: samen koken, avonden bij de vuurplaats, natuur direct voor de deur.",
    },
    rooms: {
      heading: "Slaapkamers",
      bedNote: "Belangrijk: Wij voorzien ALLEEN kopkussens (zonder sloop). Dekbedden met overtrek of slaapzakken graag zelf meenemen — plus kussenslopen voor de kussens die wij leveren.",
      items: [
        { name: "Naturtraum (\"Natuurdroom\")", floor: "1e verdieping", detail: "8 slaapplaatsen in stapelbedden" },
        { name: "Waldblick (\"Bosuitzicht\")", floor: "Zolder", detail: "4 slaapplaatsen op de vloer · via interne trap verbonden met Naturtraum" },
        { name: "Sonnenplatz (\"Zonnige plek\")", floor: "1e verdieping", detail: `4 slaapplaatsen in stapelbedden · zithoek met tafel ("lerarenkamer")` },
        { name: "Vogelnest (\"Vogelnest\")", floor: "Zolder", detail: "4 slaapplaatsen op de vloer" },
        { name: "Baumkrone (\"Boomkruin\")", floor: "Zolder", detail: "13 slaapplaatsen op de vloer" },
      ],
    },
    ausstattung: {
      heading: "Ruimtes & voorzieningen",
      eg: {
        heading: "Begane grond",
        items: [
          "Entree met garderobe en schoenenrek",
          "Eetkamer met 4 tafels voor minimaal 6 personen",
          "Keuken met 2 fornuizen, oven, magnetron, vaatwasser, filterkoffieapparaat",
          "Voorraadkamer met grote en kleine koelkast (met vriesvak)",
          "Multifunctionele ruimte",
        ],
      },
      og: {
        heading: "Eerste verdieping",
        items: [
          "Verblijfsruimte met 4 tafels",
          "Gastentoilet",
        ],
      },
      ug: {
        heading: "Kelder",
        items: [
          "2 sanitaire ruimtes met elk 2 douches, 2 toiletten, 4 wastafels",
          "Ski- / fietskelder van buiten toegankelijk",
          "Grill",
        ],
      },
      aussen: {
        heading: "Buitengebied",
        items: ["Terras", "Boombank", "Zelfgebouwde vuurplaats", "Eigen sleehelling naast de hut"],
      },
      heat: {
        heading: "Verwarming & maaltijden",
        items: [
          "Centrale verwarming in alle ruimtes",
          "Zelfvoorzienend — hygiëne-artikelen graag zelf meenemen",
          "Bakkerij Gerke direct tegenover",
          "Catering voor groepen op aanvraag — Gasthof Graberhof, Hohenleye 1, Winterberg-Hoheleye (tel. 02758 / 284, mobiel 0160 7622508)",
        ],
      },
    },
    floorPlans: {
      eyebrow: "Plattegronden",
      h2: "Vier verdiepingen, één huis.",
      lead: "Klik door alle vier de verdiepingen — kelder, begane grond, eerste verdieping, zolder. Elke verdieping heeft zijn eigen functie en karakter; ze zijn verbonden via het interne trappenhuis.",
      sleepingLabel: "Slaapplaatsen",
      sleepingWordOne: "slaapplaats",
      sleepingWordOther: "slaapplaatsen",
      nonSleepingLabel: "Gemeenschap & service",
      roomsLabel: "Op deze verdieping",
      selectAriaLabel: "Verdieping kiezen",
      floors: {
        ug: {
          label: "Kelder",
          tag: "KL",
          highlights: [
            "Ingang & sleuteloverdracht",
            "Fietsen- en skikelder",
            "Sanitair met douches, wc's, wasbakken",
          ],
        },
        eg: {
          label: "Begane grond",
          tag: "BG",
          highlights: [
            "Eetkamer met 4 tafels",
            "Volledig ingerichte keuken",
            "Voorraadkast met koel- en vriesvak",
            "Garderobe & buitenterras",
          ],
        },
        og: {
          label: "Eerste verdieping",
          tag: "1e",
          highlights: [
            "Naturtraum — 8 slaapplaatsen",
            "Sonnenplatz — 4 slaapplaatsen",
            "Verblijfsruimte met 4 tafels",
            "Gastentoilet",
          ],
        },
        dg: {
          label: "Zolder",
          tag: "ZL",
          highlights: [
            "Baumkrone — 13 slaapplaatsen",
            "Waldblick — 4 slaapplaatsen",
            "Vogelnest — 4 slaapplaatsen",
            "Eigen zoldertoilet",
          ],
        },
      },
    },
    gallery: { eyebrow: "Galerij", h2: "Binnen, buiten, natuur." },
    hub: {
      eyebrow: "Voor je verblijf",
      h2: "Zodat je goed voorbereid bent.",
      body: "Eén kleine tool die we gasten vóór aankomst meegeven: een persoonlijke paklijst-generator op maat van seizoen en plan.",
      list: {
        eye: "Voor aankomst · Persoonlijk",
        title: "Persoonlijke paklijst.",
        body: "Seizoen + geplande activiteiten invoeren en je krijgt een lijst op maat voor jezelf — inclusief een sectie \"groepsitems om af te stemmen\". Afdrukbaar als PDF met aanvinkvakjes.",
        cta: "Paklijst maken →",
      },
    },
    spenden: {
      eyebrow: "Doe mee · Crowdfunding",
      h2: "Doneer voor de tentvlonder.",
      body: "Direct naast de hut moet een vlakke houten vlonder voor tenten komen — een stevige, egale ondergrond waarop tenten droog en comfortabel staan. Het wordt gebouwd zoals alles hier ontstaat: samen, met veel helpende handen en veel kleine bijdragen. Elke donatie brengt de vlonder een stap dichterbij; over de voortgang houden we jullie hier op de hoogte.",
      amountLabel: "Kies een bedrag",
      customLabel: "Eigen bedrag in €",
      cta: "Nu doneren",
      secure: "Veilig betalen via Stripe · Ontvanger: Skifreunde Gütersloh e.V. · Doel: tentvlonder",
      thanks: "Bedankt voor je donatie — de vlonder komt een stap dichterbij!",
      error: "Kies een bedrag tussen € 2 en € 5.000.",
    },
    cta: { eyebrow: "Klaar?", h2: "Datum kiezen, personen invoeren, boeken.", button: "Beschikbaarheid bekijken" },
  },
};

const FACT_KPIS = [
  { kpi: "33", labelKey: "sleeps" as const },
  { kpi: "5", labelKey: "rooms" as const },
  { kpi: "2", labelKey: "lounges" as const },
  { kpi: "15–33", labelKey: "occupancy" as const },
];

const GALLERY = [
  { src: "/media/photos/exterior-main.jpg" },
  { src: "/media/photos/interior-7496.jpg" },
  { src: "/media/photos/interior-7517.jpg" },
  { src: "/media/photos/interior-7547.jpg" },
  { src: "/media/photos/interior-7593.jpg" },
  { src: "/media/photos/aerial-1.jpg" },
  { src: "/media/photos/nature-1.jpg" },
];

export default async function HuettePage({
  searchParams,
}: {
  searchParams: Promise<{ spende?: string }>;
}) {
  const locale = await getServerLocale();
  const c = COPY[locale];
  const sp = await searchParams;
  const spendeStatus =
    sp.spende === "danke" ? ("danke" as const) : sp.spende === "fehler" ? ("fehler" as const) : null;

  // Floor-Plan-Daten zentral, damit der Client-Component keinen Locale-Branch
  // braucht — wir füllen die Anzeige-Texte aus c.floorPlans.floors[key].
  const FLOORS: Floor[] = [
    {
      key: "ug",
      label: c.floorPlans.floors.ug.label,
      tag: c.floorPlans.floors.ug.tag,
      src: "/media/photos/grundrisse/untergeschoss.png",
      sleeps: 0,
      highlights: c.floorPlans.floors.ug.highlights,
    },
    {
      key: "eg",
      label: c.floorPlans.floors.eg.label,
      tag: c.floorPlans.floors.eg.tag,
      src: "/media/photos/grundrisse/erdgeschoss.png",
      sleeps: 0,
      highlights: c.floorPlans.floors.eg.highlights,
    },
    {
      key: "og",
      label: c.floorPlans.floors.og.label,
      tag: c.floorPlans.floors.og.tag,
      src: "/media/photos/grundrisse/obergeschoss.png",
      sleeps: 12,
      highlights: c.floorPlans.floors.og.highlights,
    },
    {
      key: "dg",
      label: c.floorPlans.floors.dg.label,
      tag: c.floorPlans.floors.dg.tag,
      src: "/media/photos/grundrisse/dachgeschoss.png",
      sleeps: 21,
      highlights: c.floorPlans.floors.dg.highlights,
    },
  ];

  return (
    <div>
      <section className="relative h-[420px] sm:h-[520px] overflow-hidden">
        <Image
          src="/media/photos/aerial-1.jpg"
          alt="Wiesenhütte"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative max-w-[1080px] mx-auto h-full px-6 sm:px-8 flex flex-col justify-end pb-10 sm:pb-12">
          <div className="eyebrow text-[var(--color-wh-snow)]/85">{c.hero.eyebrow}</div>
          <h1 className="text-[var(--color-wh-snow)] font-display font-bold text-[44px] sm:text-[64px] leading-tight m-0 mt-3 sm:mt-4">
            {c.hero.h1l1}
            <br />
            {c.hero.h1l2}
          </h1>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {FACT_KPIS.map((f) => (
              <div key={f.labelKey}>
                <div className="font-display text-[40px] sm:text-[48px] leading-none text-[var(--color-wh-deep-green)] font-bold">
                  {f.kpi}
                </div>
                <div className="mt-2 text-sm sm:text-base text-[var(--color-wh-fg-muted)]">{c.facts[f.labelKey]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[920px] mx-auto">
          <div className="eyebrow">{c.desc.eyebrow}</div>
          <h2 className="text-[32px] sm:text-[40px] mt-3 sm:mt-4">{c.desc.h2}</h2>
          <p className="text-base sm:text-[17px] leading-relaxed text-[var(--color-wh-black)] mt-4">{c.desc.body}</p>

          <h3 className="mt-12 mb-4 text-[22px] sm:text-[26px]">{c.rooms.heading}</h3>
          {/* Sehr prominenter Hinweis: nur Kopfkissen vorhanden — Bettdecken
              müssen mitgebracht werden (immer wieder Missverständnis bei Gästen). */}
          <div
            role="note"
            className="mb-5 rounded-[var(--radius-md)] border-l-4 border-[var(--color-wh-sunset)] bg-[var(--color-wh-beige)] px-4 py-3 text-[15px] sm:text-base leading-relaxed text-[var(--color-wh-black)]"
          >
            <strong className="text-[var(--color-wh-sunset)]">⚠ {c.rooms.bedNote}</strong>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0">
            {c.rooms.items.map((r) => (
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

          <h3 className="mt-12 mb-4 text-[22px] sm:text-[26px]">{c.ausstattung.heading}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-base">
            <Block heading={c.ausstattung.eg.heading} items={c.ausstattung.eg.items} />
            <Block heading={c.ausstattung.og.heading} items={c.ausstattung.og.items} />
            <Block heading={c.ausstattung.ug.heading} items={c.ausstattung.ug.items} />
            <Block heading={c.ausstattung.aussen.heading} items={c.ausstattung.aussen.items} />
            <Block heading={c.ausstattung.heat.heading} items={c.ausstattung.heat.items} />
          </div>
        </div>
      </section>

      <FloorPlanExplorer
        floors={FLOORS}
        texts={{
          eyebrow: c.floorPlans.eyebrow,
          h2: c.floorPlans.h2,
          lead: c.floorPlans.lead,
          sleepingLabel: c.floorPlans.sleepingLabel,
          sleepingWordOne: c.floorPlans.sleepingWordOne,
          sleepingWordOther: c.floorPlans.sleepingWordOther,
          nonSleepingLabel: c.floorPlans.nonSleepingLabel,
          roomsLabel: c.floorPlans.roomsLabel,
          selectAriaLabel: c.floorPlans.selectAriaLabel,
        }}
      />

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1280px] mx-auto">
          <div className="eyebrow">{c.gallery.eyebrow}</div>
          <h2 className="text-[32px] sm:text-[40px] mt-3 sm:mt-4 mb-10">{c.gallery.h2}</h2>
          {/* flex+wrap+justify-center → unvollstaendige letzte Zeile wird automatisch zentriert. */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {GALLERY.map((g) => (
              <div
                key={g.src}
                className="relative aspect-[4/3] w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.667rem)] rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-wh-beige)]"
              >
                <Image
                  src={g.src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow">{c.hub.eyebrow}</div>
          <h2 className="text-[32px] sm:text-[44px] mt-3 mb-3 leading-tight">{c.hub.h2}</h2>
          <p className="text-[var(--color-wh-fg-muted)] text-[16px] max-w-2xl mb-10">{c.hub.body}</p>

          <div className="max-w-xl">
            <Link
              href="/packliste"
              className="group relative block bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 sm:p-8 no-underline hover:shadow-md transition-shadow overflow-hidden"
            >
              <div
                aria-hidden
                className="absolute -top-4 -right-2 text-[120px] leading-none text-[var(--color-wh-deep-green)]/[0.07] font-display font-bold pointer-events-none select-none"
              >
                ✓
              </div>
              <div className="relative">
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-wh-deep-green)]/80 font-bold mb-2">
                  {c.hub.list.eye}
                </div>
                <h3 className="font-display font-bold text-[24px] sm:text-[26px] text-[var(--color-wh-deep-green)] mt-0 mb-3 leading-tight">
                  {c.hub.list.title}
                </h3>
                <p className="text-[14px] sm:text-[15px] leading-relaxed text-[var(--color-wh-black)] m-0 mb-4">
                  {c.hub.list.body}
                </p>
                <span className="inline-flex items-center gap-1 text-[14px] text-[var(--color-wh-deep-green)] font-semibold group-hover:gap-2 transition-all">
                  {c.hub.list.cta}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Crowdfunding: Zeltpodest */}
      <DonationSection copy={c.spenden} status={spendeStatus} />

      <section className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-20 border-t border-[var(--color-wh-snow)]/15">
        <div className="max-w-[820px] mx-auto text-center">
          <div className="eyebrow text-[var(--color-wh-snow)]/80">{c.cta.eyebrow}</div>
          <h2 className="text-[var(--color-wh-snow)] text-[32px] sm:text-[40px] mt-3">{c.cta.h2}</h2>
          <Link
            href="/buchen"
            className="inline-flex mt-6 h-12 px-6 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] no-underline font-semibold hover:bg-white transition-colors"
          >
            {c.cta.button}
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
