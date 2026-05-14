/**
 * Historische Eintraege fuer die Timeline auf der Landing-Page.
 * Authentisch fingiert auf Basis dessen was wir ueber den Verein
 * Skifreunde Guetersloh + ESG-Klassenfahrten wissen.
 *
 * Bilder aus public/media/historical/* (4 Fotos verfuegbar)
 * + public/media/photos/historical-pic-1.png + community.jpg.
 */

import type { Locale } from "@/lib/i18n-shared";

export type HistoryEntry = {
  year: string;
  decade: string; // fuer Sticky-Anker
  title: Record<Locale, string>;
  body: Record<Locale, string>;
  photo: string;
  photoAlt: string;
  /**
   * Handgeschriebene Notiz im Caveat-Font, simuliert Gaestebuch-/Huettenwart-
   * Notiz. Optional — nicht jedes Jahrzehnt hat eine.
   */
  handwrittenNote?: Record<Locale, string>;
};

export const HISTORY_ENTRIES: HistoryEntry[] = [
  {
    year: "1956",
    decade: "50er",
    title: {
      de: "Das Haus wechselt die Hände",
      en: "The house changes hands",
      nl: "Het huis wisselt van eigenaar",
    },
    body: {
      de: "Eine Gruppe Gütersloher Skifahrer kauft das alte Försterhaus an der Bundesstraße 6 in Langewiese. Was als Wochenendprojekt beginnt, wird zur Vereinshütte für die Skifreunde Gütersloh.",
      en: "A group of skiers from Gütersloh buy the old forester's cottage on Bundesstraße 6 in Langewiese. What starts as a weekend project becomes the club cabin of the Skifreunde Gütersloh.",
      nl: "Een groep skiërs uit Gütersloh koopt het oude boswachtershuis aan de Bundesstraße 6 in Langewiese. Wat als weekendproject begint, wordt de clubhut van de Skifreunde Gütersloh.",
    },
    photo: "/media/historical/founders.jpg",
    photoAlt: "Die Gründungsmitglieder vor der Hütte, 1956",
    handwrittenNote: {
      de: "Erster Hüttenabend, Februar. Holzofen raucht, alle Mäntel an. — H.",
      en: "First night at the cabin, February. Stove smoking, coats stayed on. — H.",
      nl: "Eerste avond in de hut, februari. Kachel rookt, jassen aan. — H.",
    },
  },
  {
    year: "1973",
    decade: "70er",
    title: {
      de: "Klassenfahrten beginnen",
      en: "School trips begin",
      nl: "Schoolreizen beginnen",
    },
    body: {
      de: "Erste Klassen aus dem Evangelisch Stiftischen Gymnasium kommen für eine Woche her. Ski im Winter, Werkraum-Projekte im Sommer. Die Tradition läuft heute noch.",
      en: "The first classes from the Evangelisch Stiftisches Gymnasium come for a week. Skiing in winter, workshop projects in summer. The tradition continues today.",
      nl: "De eerste klassen van het Evangelisch Stiftisches Gymnasium komen een week langs. Skiën in de winter, werkplaatsprojecten in de zomer. De traditie loopt nog steeds.",
    },
    photo: "/media/historical/community.jpg",
    photoAlt: "Schulgruppe vor der Hütte, frühe 70er Jahre",
    handwrittenNote: {
      de: "Skischuh am Hang verloren. Nie wiedergefunden. — Eintrag Hüttenwart, Feb. '73",
      en: "Lost a ski boot on the slope. Never found it. — Hüttenwart log, Feb '73",
      nl: "Skischoen op de helling verloren. Nooit teruggevonden. — logboek Hüttenwart, feb '73",
    },
  },
  {
    year: "1989",
    decade: "80er",
    title: {
      de: "Aufenthaltsraum neu gemacht",
      en: "Lounge rebuilt",
      nl: "Verblijfsruimte vernieuwd",
    },
    body: {
      de: "Walter Hiersemann, viele Jahre Hüttenwart, treibt den Umbau des Aufenthaltsraums voran. Die Holzvertäfelung von damals ist heute noch da.",
      en: "Walter Hiersemann, long-time hut warden, drives the lounge renovation. The wooden panelling from back then is still there today.",
      nl: "Walter Hiersemann, jarenlang Hüttenwart, leidt de verbouwing van de verblijfsruimte. De houten betimmering van toen staat er nog.",
    },
    photo: "/media/historical/walter-hiersemann.jpg",
    photoAlt: "Walter Hiersemann, langjähriger Hüttenwart",
  },
  {
    year: "2008",
    decade: "00er",
    title: {
      de: "Große Sanierung",
      en: "Major renovation",
      nl: "Grote renovatie",
    },
    body: {
      de: "Dach, Heizung, Sanitäranlagen. Die Hütte bekommt einen neuen Zustand — bleibt aber bewusst Selbstversorger. Keine Wellness, kein WLAN-Hotspot. Der Charakter bleibt.",
      en: "Roof, heating, plumbing. The cabin gets a fresh state — but stays deliberately self-catered. No wellness, no Wi-Fi hotspot. The character stays.",
      nl: "Dak, verwarming, sanitair. De hut wordt opgeknapt — maar blijft bewust zelfvoorzienend. Geen wellness, geen wifi-hotspot. Het karakter blijft.",
    },
    photo: "/media/historical/renovation.jpg",
    photoAlt: "Renovierungsarbeiten am Dach, 2008",
    handwrittenNote: {
      de: "Dachdecker drei Wochen lang hier. Die Mannschaft hat den Kachelofen geliebt.",
      en: "Roofers stayed three weeks. The crew loved the tile stove.",
      nl: "Dakdekkers drie weken hier. De ploeg vond de tegelkachel geweldig.",
    },
  },
  {
    year: "2026",
    decade: "heute",
    title: {
      de: "70 Jahre — und der Kachelofen brennt immer noch",
      en: "70 years — and the tile stove still burns",
      nl: "70 jaar — en de tegelkachel brandt nog steeds",
    },
    body: {
      de: "Heute kommt die dritte Generation. Familien, Klassenfahrten, Vereinsausflüge — der Wechsel der Generationen ist gut zu sehen, der Charakter der Hütte bleibt unverändert.",
      en: "Today the third generation arrives. Families, school trips, club outings — generations turn over, the character of the cabin doesn't.",
      nl: "Vandaag komt de derde generatie. Families, schoolreizen, verenigingsuitstapjes — generaties wisselen, het karakter van de hut blijft.",
    },
    photo: "/media/photos/historical-pic-1.png",
    photoAlt: "Die Hütte heute, Winter 2025",
  },
];

export const HISTORY_COPY: Record<Locale, { eyebrow: string; h2: string; lead: string; scrollHint: string }> = {
  de: {
    eyebrow: "Geschichte",
    h2: "Seit 1956 derselbe Ort, andere Generationen.",
    lead: "Sieben Jahrzehnte Wiesenhütte — ein Försterhaus, das langsam zur Vereinshütte wurde. Hier ein paar Etappen, an die der Vorstand sich noch erinnert (oder die er sich erzählen lässt).",
    scrollHint: "Seitwärts scrollen →",
  },
  en: {
    eyebrow: "History",
    h2: "Same place since 1956, different generations.",
    lead: "Seven decades of the Wiesenhütte — a forester's cottage that slowly became a club cabin. A few moments the board still remembers (or has been told about).",
    scrollHint: "Scroll sideways →",
  },
  nl: {
    eyebrow: "Geschiedenis",
    h2: "Sinds 1956 dezelfde plek, andere generaties.",
    lead: "Zeven decennia Wiesenhütte — een boswachterswoning die langzaam clubhut werd. Een paar momenten die het bestuur zich nog herinnert (of die hen verteld zijn).",
    scrollHint: "Zijwaarts scrollen →",
  },
};
