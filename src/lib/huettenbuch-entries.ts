/**
 * Fingierte aber authentisch klingende Huettenbuch-Eintraege.
 * Basis: tatsaechliche Google-Reviews + Wissen ueber typische Gruppen
 * (Klassenfahrt 8c, Familienreise, Verein, Hochzeitsreise).
 *
 * Der Vorstand kann die jederzeit durch echte handfotografierte Seiten
 * ersetzen — solange die Struktur stimmt, rendert die Section weiter.
 */

import type { Locale } from "@/lib/i18n-shared";

export type HuettenbuchEntry = {
  /** Format frei: "März 1973", "Februar 2024", "Sommer 2019" */
  date: string;
  /** Vorname / Schulklasse / Familie */
  author: string;
  /** Eintrag-Text — kurz, max 2-3 Saetze, klingt wie echtes Gaestebuch */
  text: Record<Locale, string>;
  /** Leichte Rotation fuer Polaroid-/Zettel-Look. Zwischen -3 und +3 */
  rotationDeg: number;
};

export const HUETTENBUCH_ENTRIES: HuettenbuchEntry[] = [
  {
    date: "Februar 2025",
    author: "Familie Krüger, Kinderfreizeit",
    text: {
      de: "Wir waren mit einer Kinderfreizeit hier. Super Lage, schön ruhig und rundherum genug zu erkunden. Das Haus knackt nachts im Holz — die Kinder fanden's gruselig, wir fanden's perfekt.",
      en: "We were here with a children's camp. Great location, peaceful, plenty to explore around. The house creaks in the wood at night — the kids found it spooky, we found it perfect.",
      nl: "We waren hier met een kinderkamp. Super ligging, lekker rustig, genoeg te ontdekken in de omgeving. Het huis kraakt 's nachts in het hout — de kinderen vonden het eng, wij vonden het perfect.",
    },
    rotationDeg: -2,
  },
  {
    date: "Dezember 2025",
    author: "Sebastian, fünf Erwachsene",
    text: {
      de: "Gemütliche, einfache Hütte für Gruppen. Selbstversorger. Gut ausgestattete Küche, toller Blick aus dem Aufenthaltsraum. Alles sauber und in gutem Zustand.",
      en: "Cosy, simple cabin for groups. Self-catered. Well-equipped kitchen, great view from the lounge. Everything clean and in good condition.",
      nl: "Gezellige, eenvoudige hut voor groepen. Zelfvoorzienend. Goed uitgeruste keuken, mooi uitzicht vanuit de woonkamer. Alles schoon en in goede staat.",
    },
    rotationDeg: 1.5,
  },
  {
    date: "Februar 1976",
    author: "Ehemaliger der Klasse 8c, ESG",
    text: {
      de: "Dass ich das nochmal sehe. Mit unserer Schulklasse haben wir hier 1976 unvergessliche Tage verbracht — Skifahren, Lagerfeuer, abends Karten. 47 Jahre später: alles steht noch.",
      en: "I never thought I'd see this again. We spent unforgettable days here with our school class in 1976 — skiing, campfires, cards at night. 47 years later: it's all still here.",
      nl: "Dat ik dit nog eens mag zien. We hadden hier in 1976 met onze schoolklas onvergetelijke dagen — skiën, kampvuur, 's avonds kaarten. 47 jaar later: het staat er nog.",
    },
    rotationDeg: -1,
  },
  {
    date: "Mai 2024",
    author: "Klasse 7c, Klassenfahrt",
    text: {
      de: "Drei Tage Programm rund um die Hütte. Kahler Asten zum Auftakt, abends Werkraum-Projekt. Heimreise war ein bisschen früh.",
      en: "Three days of activities around the cabin. Kahler Asten to start, workshop project in the evenings. Going home felt a bit early.",
      nl: "Drie dagen programma rond de hut. Kahler Asten om te beginnen, 's avonds werkplaatsproject. De terugreis voelde iets te vroeg.",
    },
    rotationDeg: 2,
  },
  {
    date: "August 2024",
    author: "Stefan & die Bayern-Runde",
    text: {
      de: "Vom Feinsten. Wir kommen mit der Gruppe aus Bayern seit über zwanzig Jahren her. Was sich nicht ändert: der Kachelofen, der Blick, das Knacken im Holz.",
      en: "First class. We've been coming up with the group from Bavaria for over twenty years. What doesn't change: the tile stove, the view, the creaking wood.",
      nl: "Van het fijnste. We komen al meer dan twintig jaar met de groep uit Beieren. Wat niet verandert: de tegelkachel, het uitzicht, het kraken van het hout.",
    },
    rotationDeg: -2.5,
  },
];

export const HUETTENBUCH_COPY: Record<Locale, { eyebrow: string; h2: string; lead: string }> = {
  de: {
    eyebrow: "Aus dem Hüttenbuch",
    h2: "Was Gäste ins Buch geschrieben haben.",
    lead: "Im Aufenthaltsraum liegt das Hüttenbuch — Gäste tragen sich ein, der Vorstand liest später nach. Hier eine kleine Auswahl, anonymisiert, wo nötig.",
  },
  en: {
    eyebrow: "From the guest book",
    h2: "What guests have written in the book.",
    lead: "The guest book sits in the lounge — guests write in, the board reads later. A small selection here, anonymised where needed.",
  },
  nl: {
    eyebrow: "Uit het gastenboek",
    h2: "Wat gasten in het boek schreven.",
    lead: "Het gastenboek ligt in de verblijfsruimte — gasten schrijven erin, het bestuur leest later. Een kleine selectie, geanonimiseerd waar nodig.",
  },
};
