import type { Locale } from "./i18n-shared";

/** Meteorologische Jahreszeiten: Mär–Mai, Jun–Aug, Sep–Nov, Dez–Feb. */
export type Season = "fruehling" | "sommer" | "herbst" | "winter";

export const getSeason = (d: Date = new Date()): Season => {
  const m = d.getMonth() + 1;
  if (m >= 3 && m <= 5) return "fruehling";
  if (m >= 6 && m <= 8) return "sommer";
  if (m >= 9 && m <= 11) return "herbst";
  return "winter";
};

/**
 * Saisonale Hero-Claims — gleiche Bauart wie der Winter-Klassiker
 * „Draußen kalt. Drinnen gemeinsam." Die Startseite ist force-dynamic,
 * dadurch schaltet der Claim automatisch zu Beginn jeder Jahreszeit um.
 */
export const SEASON_CLAIMS: Record<Locale, Record<Season, { l1: string; l2: string }>> = {
  de: {
    winter: { l1: "Draußen kalt.", l2: "Drinnen gemeinsam." },
    fruehling: { l1: "Draußen grünt's.", l2: "Drinnen gemeinsam." },
    sommer: { l1: "Draußen Sonne.", l2: "Drinnen gemeinsam." },
    herbst: { l1: "Draußen stürmt's.", l2: "Drinnen gemeinsam." },
  },
  en: {
    winter: { l1: "Cold outside.", l2: "Warm together inside." },
    fruehling: { l1: "Green outside.", l2: "Together inside." },
    sommer: { l1: "Sun outside.", l2: "Together inside." },
    herbst: { l1: "Storms outside.", l2: "Together inside." },
  },
  nl: {
    winter: { l1: "Buiten koud.", l2: "Binnen samen." },
    fruehling: { l1: "Buiten groen.", l2: "Binnen samen." },
    sommer: { l1: "Buiten zon.", l2: "Binnen samen." },
    herbst: { l1: "Buiten stormt het.", l2: "Binnen samen." },
  },
};
