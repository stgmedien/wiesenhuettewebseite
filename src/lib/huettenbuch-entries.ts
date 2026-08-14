/**
 * Handverlesene ECHTE Gästestimmen fürs "Hüttenbuch" auf der Startseite.
 * Jeder Eintrag ist wortgetreu aus einer echten Bewertung übernommen —
 * sourceRef verweist auf den zugehörigen Datensatz in externalReviews
 * (src/lib/db/seed-reviews.ts) bzw. den manuell im Manager erfassten
 * Eintrag unter /m/bewertungen. Keine erfundenen Namen/Zitate/Details —
 * siehe Handbuch "Keine erfundenen Bewertungen/Testimonials".
 *
 * Auswahl ändern: einfach dieses Array anpassen, aber jeder neue Eintrag
 * muss 1:1 einer echten, unter /m/bewertungen sichtbaren Bewertung
 * entsprechen.
 */

import type { Locale } from "@/lib/i18n-shared";

export type HuettenbuchEntry = {
  /** Wie Google es anzeigt, z. B. "vor 5 Monaten" — keine erfundene Präzision. */
  date: string;
  /** Autor wie in externalReviews hinterlegt. */
  author: string;
  text: Record<Locale, string>;
  /** Leichte Rotation fuer Polaroid-/Zettel-Look. Zwischen -3 und +3 */
  rotationDeg: number;
};

export const HUETTENBUCH_ENTRIES: HuettenbuchEntry[] = [
  {
    // sourceRef: google:sebastian-meschede-2025-12
    date: "vor 5 Monaten",
    author: "Sebastian Meschede",
    text: {
      de: "Gemütliche einfache Hütte für Gruppen. Selbstversorger. Gut ausgestattete Küche. Toller Blick aus dem Aufenthaltsraum. Alles sauber und in gutem Zustand.",
      en: "Cosy, simple cabin for groups. Self-catered. Well-equipped kitchen, great view from the lounge. Everything clean and in good condition.",
      nl: "Gezellige, eenvoudige hut voor groepen. Zelfvoorzienend. Goed uitgeruste keuken, mooi uitzicht vanuit de woonkamer. Alles schoon en in goede staat.",
    },
    rotationDeg: -2,
  },
  {
    // sourceRef: google:leenin-krueger-2025-05
    date: "vor einem Jahr",
    author: "Leenin Krüger",
    text: {
      de: "Wir waren mit einer Kinderfreizeit hier. Super Lage, schön ruhig und rundherum genug zu erkunden. Haus ist alt und verwinkelt aber gut ausgestattet.",
      en: "We were here with a children's camp. Great location, peaceful, plenty to explore around. The house is old and quirky but well equipped.",
      nl: "We waren hier met een kinderkamp. Super ligging, lekker rustig, genoeg te ontdekken in de omgeving. Het huis is oud en met veel hoekjes, maar goed uitgerust.",
    },
    rotationDeg: 1.5,
  },
  {
    // sourceRef: google:drh-kleinert-2023-05
    date: "vor 3 Jahren",
    author: "DRH Kleinert",
    text: {
      de: "Dass ich das nochmal sehe... In der Hütte haben wir mit unserer Schulklasse im Winter (Februar) so 1976–1978 unvergessliche Tage verbracht.",
      en: "I never thought I'd see this again... We spent unforgettable days here with our school class in winter (February), around 1976–1978.",
      nl: "Dat ik dit nog eens mag zien... We hebben hier met onze schoolklas in de winter (februari) rond 1976–1978 onvergetelijke dagen doorgebracht.",
    },
    rotationDeg: -1,
  },
  {
    // manuell erfasst, /m/bewertungen, Quelle Gruppenhaus.de
    date: "kürzlich",
    author: "Torben M.",
    text: {
      de: "Sehr netter Besitzer, gutes Haus für Fahrten wie z. B. die Wochenendfahrt unserer Landjugend. Schöne Gegend!!",
      en: "Very friendly owner, good place for trips like our youth group's weekend away. Lovely area!!",
      nl: "Zeer vriendelijke eigenaar, goed huis voor tochten zoals het weekend van onze jeugdgroep. Mooie omgeving!!",
    },
    rotationDeg: 2,
  },
  {
    // sourceRef: google:stino1958-heinz-2020-05
    date: "vor 6 Jahren",
    author: "Stino1958 Heinz",
    text: {
      de: "Vom Feinsten. Kommen schon mit den Bayern seit über zwanzig Jahren.",
      en: "First class. We've been coming up with the group from Bavaria for over twenty years.",
      nl: "Van het fijnste. We komen al meer dan twintig jaar met de groep uit Beieren.",
    },
    rotationDeg: -2.5,
  },
];

export const HUETTENBUCH_COPY: Record<Locale, { eyebrow: string; h2: string; lead: string }> = {
  de: {
    eyebrow: "Stimmen unserer Gäste",
    h2: "Was Gäste über die Wiesenhütte sagen.",
    lead: "Wir haben kein klassisches Hüttenbuch — Rückmeldungen sammeln wir online: Google-Bewertungen, Mails, Karten von Klassenfahrten. Hier eine kleine, echte Auswahl.",
  },
  en: {
    eyebrow: "Voices of our guests",
    h2: "What guests say about the Wiesenhütte.",
    lead: "We don't keep a classic guest book — we collect feedback online: Google reviews, emails, postcards from school groups. A small, genuine selection here.",
  },
  nl: {
    eyebrow: "Stemmen van onze gasten",
    h2: "Wat gasten over de Wiesenhütte zeggen.",
    lead: "We hebben geen klassiek gastenboek — feedback verzamelen we online: Google-recensies, e-mails, kaarten van schoolklassen. Een kleine, echte selectie hier.",
  },
};
