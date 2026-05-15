/**
 * Kuratierte Foto-Auswahl fuer die Bento-Galerie auf der Landing-Page.
 *
 * 9 Tiles in einem asymmetrischen Grid (grid-template-areas), so dass
 * Layout NICHT zufaellig wirkt sondern bewusst komponiert.
 *
 * Aspect-Verhaeltnis pro Area:
 *   - "feature"  : 16:10  (Hero-Tile, doppelt breit)
 *   - "atmos"    : 4:5    (hochformatig, Lagerfeuer)
 *   - "wide"     : 16:9   (Landschafts-Format)
 *   - "portrait" : 3:4    (eher hoch)
 *   - "square"   : 1:1
 *   - "small"    : 1:1    (kleine Tiles unten)
 */

import type { Locale } from "@/lib/i18n-shared";

export type GalleryTile = {
  src: string;
  alt: string;
  caption: Record<Locale, { lead: string; sub?: string }>;
  area:
    | "feature"
    | "atmos"
    | "wide"
    | "portrait"
    | "square"
    | "small-1"
    | "small-2"
    | "small-3"
    | "small-4";
};

export const BENTO_TILES: GalleryTile[] = [
  {
    src: "/media/photos/exterior-main.jpg",
    alt: "Wiesenhuette von vorne, Fachwerk in der Wintersonne",
    area: "feature",
    caption: {
      de: { lead: "Das Haus", sub: "Bundesstraße 6, Langewiese — seit 1956" },
      en: { lead: "The house", sub: "Bundesstraße 6, Langewiese — since 1956" },
      nl: { lead: "Het huis", sub: "Bundesstraße 6, Langewiese — sinds 1956" },
    },
  },
  {
    src: "/media/photos/feuerstelle_8.jpg",
    alt: "Lagerfeuer mit Funkenflug am Abend",
    area: "atmos",
    caption: {
      de: { lead: "Abendrunde", sub: "Feuer, Funken, lange Gespräche" },
      en: { lead: "Evening fire", sub: "Flames, sparks, long conversations" },
      nl: { lead: "Avondvuur", sub: "Vuur, vonken, lange gesprekken" },
    },
  },
  {
    src: "/media/photos/interior-7593.jpg",
    alt: "Aufenthaltsraum mit Holzvertaefelung",
    area: "wide",
    caption: {
      de: { lead: "Aufenthaltsraum", sub: "Holz, langer Tisch, viel Platz" },
      en: { lead: "Lounge", sub: "Wood, a long table, room to spread out" },
      nl: { lead: "Verblijfsruimte", sub: "Hout, lange tafel, veel ruimte" },
    },
  },
  {
    src: "/media/photos/projektfahrten/zusammen_essen_kochen.jpeg",
    alt: "Gemeinsames Kochen mit Schulgruppe",
    area: "portrait",
    caption: {
      de: { lead: "Selbstversorger", sub: "33 Personen, eine Küche, genug Platz" },
      en: { lead: "Self-catered", sub: "33 people, one kitchen, room enough" },
      nl: { lead: "Zelfvoorzienend", sub: "33 personen, één keuken, ruimte genoeg" },
    },
  },
  {
    src: "/media/photos/landscape.jpg",
    alt: "Sauerland-Hoehenzug im sanften Licht",
    area: "square",
    caption: {
      de: { lead: "Drumherum", sub: "Kahler Asten, Hochheide, Rothaarsteig" },
      en: { lead: "Around", sub: "Kahler Asten, high moor, Rothaarsteig trail" },
      nl: { lead: "Eromheen", sub: "Kahler Asten, hoogveen, Rothaarsteig" },
    },
  },
  {
    src: "/media/photos/aerial-1.jpg",
    alt: "Luftbild der Wiesenhuette mit umliegenden Waeldern",
    area: "small-1",
    caption: {
      de: { lead: "Von oben" },
      en: { lead: "From above" },
      nl: { lead: "Van bovenaf" },
    },
  },
  {
    src: "/media/photos/projektfahrten/bank_wird_gebaut_2.jpeg",
    alt: "Schueler bauen eine Holzbank im Werkraum",
    area: "small-2",
    caption: {
      de: { lead: "Klassenfahrt", sub: "Werkraum, Schraubzwingen, echte Arbeit" },
      en: { lead: "School trip", sub: "Workshop, clamps, real work" },
      nl: { lead: "Schoolreis", sub: "Werkplaats, klemmen, echt werk" },
    },
  },
  {
    src: "/media/photos/feuerstelle_6.jpg",
    alt: "Funken steigen vom Lagerfeuer in den dunklen Himmel",
    area: "small-3",
    caption: {
      de: { lead: "Funkenflug" },
      en: { lead: "Sparks" },
      nl: { lead: "Vonken" },
    },
  },
  {
    src: "/media/photos/nature-2.jpg",
    alt: "Detail im Wald rund um die Huette",
    area: "small-4",
    caption: {
      de: { lead: "Wald" },
      en: { lead: "Forest" },
      nl: { lead: "Bos" },
    },
  },
];

export const GALLERY_COPY: Record<Locale, { eyebrow: string; h2: string; lead: string }> = {
  de: {
    eyebrow: "Visuell",
    h2: "Wie es aussieht, wenn Ihr da seid.",
    lead: "Kein Stock-Foto, kein Render. Die Bilder hier sind aus den letzten Jahren, fotografiert vom Vorstand und von Gästen.",
  },
  en: {
    eyebrow: "Visually",
    h2: "What it looks like when you're here.",
    lead: "No stock photo, no render. These shots are from the last few years, taken by the board and by guests.",
  },
  nl: {
    eyebrow: "Visueel",
    h2: "Hoe het eruitziet als jullie er zijn.",
    lead: "Geen stockfoto, geen render. Deze beelden komen uit de afgelopen jaren, gemaakt door bestuur en gasten.",
  },
};
