import { PacklisteClient } from "./PacklisteClient";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

export const metadata = {
  title: "Packliste-Generator · Wiesenhütte",
  description:
    "Personalisierte Packliste für Deinen Aufenthalt in der Wiesenhütte — passend zu Saison, Personenanzahl und Aktivitäten. Mit Druck-PDF zum Abhaken.",
};

const COPY: Record<Locale, { eyebrow: string; h1: string; lead: string; disclaimer: string }> = {
  de: {
    eyebrow: "Vor der Anreise",
    h1: "Deine persönliche Packliste.",
    lead: "Erzähl uns kurz, was Du vorhast — wir bauen die passende Packliste für Dich. Die Liste ist für eine Person; Gruppen-Items zum Absprechen findest Du in einer eigenen Sektion. Druckfreundlich als PDF zum Abhaken.",
    disclaimer: "Hinweis: Die Liste ist eine sehr gute Basis — aber jede Gruppe ist anders. Wenn Ihr spezielle Bedürfnisse habt (Allergien, Babys, Hunde), ergänzt frei. Bei Fragen vor der Anreise meldet Euch gern bei uns.",
  },
  en: {
    eyebrow: "Before arrival",
    h1: "Your personal packing list.",
    lead: "Tell us briefly what you're planning — we'll build the right packing list for you. The list is for one person; group items to coordinate are in their own section. Print-friendly as PDF with checkboxes.",
    disclaimer: "Note: This list is a strong baseline — but every group is different. If you have special needs (allergies, babies, dogs), feel free to add. For questions before arrival, just reach out.",
  },
  nl: {
    eyebrow: "Voor aankomst",
    h1: "Jouw persoonlijke paklijst.",
    lead: "Vertel ons kort wat je van plan bent — wij bouwen de juiste paklijst voor je. De lijst is voor één persoon; groepsitems vind je in een eigen sectie. Afdrukbaar als PDF met aanvinkvakjes.",
    disclaimer: "Let op: De lijst is een sterke basis — maar elke groep is anders. Bij speciale wensen (allergieën, baby's, honden) gerust aanvullen. Bij vragen vóór aankomst graag contact opnemen.",
  },
};

export default async function PacklistePage() {
  const locale = await getServerLocale();
  const c = COPY[locale];
  return (
    <div>
      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow mb-3">{c.eyebrow}</div>
          <h1 className="text-[36px] sm:text-[56px] m-0 mb-4 leading-[1.05] font-display font-bold text-[var(--color-wh-deep-green)]">
            {c.h1}
          </h1>
          <p className="text-[16px] sm:text-[18px] leading-relaxed max-w-2xl text-[var(--color-wh-black)] m-0">
            {c.lead}
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-12 sm:py-16">
        <div className="max-w-[1180px] mx-auto">
          <PacklisteClient locale={locale} />
        </div>
      </section>

      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-10">
        <div className="max-w-[760px] mx-auto">
          <p className="text-[13px] text-[var(--color-wh-fg-muted)] italic m-0 text-center">
            {c.disclaimer}
          </p>
        </div>
      </section>
    </div>
  );
}
