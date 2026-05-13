/**
 * Client-safe i18n-Helpers (KEINE Server-Only-Imports wie cookies()).
 * Server-side Cookie-Lookup → lib/i18n.ts (getServerLocale).
 */

export type Locale = "de" | "en" | "nl";

export const LOCALES: Locale[] = ["de", "en", "nl"];

export const LOCALE_LABELS: Record<Locale, { native: string; flag: string }> = {
  de: { native: "Deutsch", flag: "🇩🇪" },
  en: { native: "English", flag: "🇬🇧" },
  nl: { native: "Nederlands", flag: "🇳🇱" },
};

export const translations: Record<Locale, Record<string, string>> = {
  de: {
    "nav.huette": "Hütte",
    "nav.verein": "Verein",
    "nav.schulprojekt": "Schulprojekt",
    "nav.lage": "Lage",
    "nav.kontakt": "Kontakt",
    "nav.account": "Konto",
    "nav.login": "Anmelden",
    "nav.book": "Verfügbarkeit prüfen",

    "footer.huette.heading": "Hütte",
    "footer.huette.ausstattung": "Ausstattung",
    "footer.huette.lage": "Lage & Anfahrt",
    "footer.huette.wandertouren": "Wandertouren",
    "footer.huette.empfehlungen": "Empfehlungen",
    "footer.huette.packliste": "Packliste",
    "footer.huette.geschenk": "Geschenk-Gutschein",
    "footer.huette.hausordnung": "Hausordnung",
    "footer.verein.heading": "Verein",
    "footer.verein.skifreunde": "Skifreunde Gütersloh",
    "footer.verein.schulprojekt": "Schulprojekt mit dem ESG",
    "footer.verein.blog": "Blog",
    "footer.verein.kontakt": "Kontakt",
    "footer.legal.heading": "Rechtliches",
    "footer.legal.impressum": "Impressum",
    "footer.legal.agb": "AGB",
    "footer.legal.datenschutz": "Datenschutz",

    "home.eyebrow": "Wiesenhütte · seit 1956",
    "home.hero.h1": "Wo das Sauerland heimisch wird.",
    "home.hero.lead":
      "Eine Selbstversorger-Hütte mitten in der Natur, getragen von einem Verein, geöffnet für Familien, Freunde und Schulklassen.",
    "home.cta.book": "Verfügbarkeit prüfen",
    "home.cta.explore": "Hütte erkunden",

    "huette.eyebrow": "Die Hütte",
    "huette.lead":
      "Acht Zimmer, 26 Betten, eine große Küche, ein Kachelofen, eine Feuerstelle vor der Tür. Mehr braucht es nicht.",

    "buchen.step.dates": "Zeitraum",
    "buchen.step.persons": "Personen",
    "buchen.step.contact": "Kontakt",
    "buchen.step.summary": "Übersicht",
    "buchen.cta.next": "Weiter",
    "buchen.cta.back": "Zurück",
    "buchen.cta.pay": "Jetzt zahlen",

    "common.de_only_banner.title": "Diese Seite ist aktuell nur auf Deutsch verfügbar.",
    "common.de_only_banner.body":
      "Wir arbeiten daran. In der Zwischenzeit hilft Dir der Browser-Übersetzer oder Google Translate weiter.",
    "common.language": "Sprache",
  },
  en: {
    "nav.huette": "The Hut",
    "nav.verein": "Our Club",
    "nav.schulprojekt": "School Project",
    "nav.lage": "Location",
    "nav.kontakt": "Contact",
    "nav.account": "Account",
    "nav.login": "Sign in",
    "nav.book": "Check availability",

    "footer.huette.heading": "The Hut",
    "footer.huette.ausstattung": "Amenities",
    "footer.huette.lage": "Location & Directions",
    "footer.huette.wandertouren": "Hiking routes",
    "footer.huette.empfehlungen": "Recommendations",
    "footer.huette.packliste": "Packing list",
    "footer.huette.geschenk": "Gift voucher",
    "footer.huette.hausordnung": "House rules",
    "footer.verein.heading": "Our Club",
    "footer.verein.skifreunde": "Skifreunde Gütersloh",
    "footer.verein.schulprojekt": "School project with ESG",
    "footer.verein.blog": "Blog",
    "footer.verein.kontakt": "Contact",
    "footer.legal.heading": "Legal",
    "footer.legal.impressum": "Imprint",
    "footer.legal.agb": "Terms",
    "footer.legal.datenschutz": "Privacy",

    "home.eyebrow": "Wiesenhütte · since 1956",
    "home.hero.h1": "Where the Sauerland becomes home.",
    "home.hero.lead":
      "A self-catering mountain cabin in the middle of the woods, run by a club, open to families, friends, and school groups.",
    "home.cta.book": "Check availability",
    "home.cta.explore": "Explore the cabin",

    "huette.eyebrow": "The cabin",
    "huette.lead":
      "Eight rooms, 26 beds, a large kitchen, a tiled stove, a fire pit out front. That's all you need.",

    "buchen.step.dates": "Dates",
    "buchen.step.persons": "People",
    "buchen.step.contact": "Contact",
    "buchen.step.summary": "Summary",
    "buchen.cta.next": "Next",
    "buchen.cta.back": "Back",
    "buchen.cta.pay": "Pay now",

    "common.de_only_banner.title": "This page is currently only available in German.",
    "common.de_only_banner.body":
      "We're working on it. Meanwhile, your browser's translate function or Google Translate should help.",
    "common.language": "Language",
  },
  nl: {
    "nav.huette": "De Hut",
    "nav.verein": "Onze Vereniging",
    "nav.schulprojekt": "Schoolproject",
    "nav.lage": "Ligging",
    "nav.kontakt": "Contact",
    "nav.account": "Account",
    "nav.login": "Inloggen",
    "nav.book": "Beschikbaarheid",

    "footer.huette.heading": "De Hut",
    "footer.huette.ausstattung": "Voorzieningen",
    "footer.huette.lage": "Ligging & Route",
    "footer.huette.wandertouren": "Wandelroutes",
    "footer.huette.empfehlungen": "Aanbevelingen",
    "footer.huette.packliste": "Paklijst",
    "footer.huette.geschenk": "Cadeaubon",
    "footer.huette.hausordnung": "Huisregels",
    "footer.verein.heading": "Onze Vereniging",
    "footer.verein.skifreunde": "Skifreunde Gütersloh",
    "footer.verein.schulprojekt": "Schoolproject met ESG",
    "footer.verein.blog": "Blog",
    "footer.verein.kontakt": "Contact",
    "footer.legal.heading": "Juridisch",
    "footer.legal.impressum": "Colofon",
    "footer.legal.agb": "Voorwaarden",
    "footer.legal.datenschutz": "Privacy",

    "home.eyebrow": "Wiesenhütte · sinds 1956",
    "home.hero.h1": "Waar het Sauerland thuis voelt.",
    "home.hero.lead":
      "Een zelfvoorzienende berghut midden in het bos, gerund door een vereniging, open voor families, vrienden en schoolgroepen.",
    "home.cta.book": "Beschikbaarheid bekijken",
    "home.cta.explore": "Bekijk de hut",

    "huette.eyebrow": "De hut",
    "huette.lead":
      "Acht kamers, 26 bedden, een grote keuken, een tegelkachel, een vuurplaats buiten. Meer heb je niet nodig.",

    "buchen.step.dates": "Periode",
    "buchen.step.persons": "Personen",
    "buchen.step.contact": "Contact",
    "buchen.step.summary": "Overzicht",
    "buchen.cta.next": "Volgende",
    "buchen.cta.back": "Terug",
    "buchen.cta.pay": "Nu betalen",

    "common.de_only_banner.title": "Deze pagina is momenteel alleen in het Duits beschikbaar.",
    "common.de_only_banner.body":
      "We werken eraan. Je browser-vertaler of Google Translate kan ondertussen helpen.",
    "common.language": "Taal",
  },
};

export function t(key: string, locale: Locale): string {
  return translations[locale]?.[key] ?? translations.de[key] ?? key;
}

export function makeT(locale: Locale): (key: string) => string {
  return (key: string) => t(key, locale);
}
