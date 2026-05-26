/**
 * History-Timeline auf der Landing-Page — bewusst angerissen, nicht
 * dramatisch breitgetreten. Drei Etappen: alte Garde, Umbau, neuer Vorstand.
 *
 * Alle Fotos aus public/media/historical/* (sonst nichts).
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
    year: "Damals",
    decade: "frueher",
    title: {
      de: "Die alte Garde",
      en: "The old guard",
      nl: "De oude garde",
    },
    body: {
      de: "Über Jahrzehnte hat Walter Hiersemann die Hütte geführt — Schlüssel, Holzofen, Hüttenwart-Buch in einer Hand. Was heute steht, hat er mitgetragen.",
      en: "For decades, Walter Hiersemann ran the place — keys, wood stove, log book in one hand. What stands today, he helped carry.",
      nl: "Tientallen jaren leidde Walter Hiersemann de hut — sleutels, houtkachel, logboek in één hand. Wat er vandaag staat, is mede dankzij hem.",
    },
    photo: "/media/historical/walter-hiersemann.jpg",
    photoAlt: "Walter Hiersemann, langjähriger Hüttenwart",
    handwrittenNote: {
      de: "Schlüssel hängen rechts neben der Tür. Holz unten links. — W.",
      en: "Keys hang to the right of the door. Wood bottom-left. — W.",
      nl: "Sleutels hangen rechts naast de deur. Hout linksonder. — W.",
    },
  },
  {
    year: "Umbau",
    decade: "zwischen",
    title: {
      de: "Sanierung",
      en: "Renovation",
      nl: "Renovatie",
    },
    body: {
      de: "Dach, Heizung, Sanitäranlagen. Frischer Zustand — aber bewusst weiterhin Selbstversorgerhütte. Keine Wellness, kein WLAN-Hotspot. Der Charakter bleibt.",
      en: "Roof, heating, plumbing. Refreshed — but deliberately still self-catered. No wellness, no Wi-Fi hotspot. The character stays.",
      nl: "Dak, verwarming, sanitair. Opgeknapt — maar bewust nog steeds zelfvoorzienend. Geen wellness, geen wifi-hotspot. Het karakter blijft.",
    },
    photo: "/media/historical/renovation.jpg",
    photoAlt: "Renovierungsarbeiten an der Hütte",
  },
  {
    year: "Heute",
    decade: "heute",
    title: {
      de: "Der neue Vorstand",
      en: "The new board",
      nl: "Het nieuwe bestuur",
    },
    body: {
      de: "Heute übernimmt die nächste Generation — gleicher Verein, gleicher Ort. Was bleibt: der lange Tisch im Aufenthaltsraum, die selbstgebaute Feuerstelle, der Blick aus dem Fenster.",
      en: "Today the next generation takes over — same club, same place. What stays: the long table in the lounge, the self-built fire pit, the view from the window.",
      nl: "Vandaag neemt de volgende generatie het over — dezelfde vereniging, dezelfde plek. Wat blijft: de lange tafel in de woonkamer, de zelfgebouwde vuurplaats, het uitzicht uit het raam.",
    },
    photo: "/media/historical/neuer_vorstand.jpg",
    photoAlt: "Der neue Vorstand der Skifreunde Gütersloh",
  },
];

export const HISTORY_COPY: Record<Locale, { eyebrow: string; h2: string; lead: string; scrollHint: string }> = {
  de: {
    eyebrow: "Drei Etappen",
    h2: "Andere Hände, gleiches Haus.",
    lead: "Eine kurze Übergabe — vom langjährigen Hüttenwart über die Sanierung zum heutigen Vorstand. Mehr braucht's hier nicht.",
    scrollHint: "Seitwärts scrollen →",
  },
  en: {
    eyebrow: "Three chapters",
    h2: "Different hands, same house.",
    lead: "A short handover — from the long-time hut warden through the renovation to today's board. That's all the page needs.",
    scrollHint: "Scroll sideways →",
  },
  nl: {
    eyebrow: "Drie etappes",
    h2: "Andere handen, hetzelfde huis.",
    lead: "Een korte overgang — van de langjarige Hüttenwart via de renovatie naar het huidige bestuur. Meer hoeft niet.",
    scrollHint: "Zijwaarts scrollen →",
  },
};
