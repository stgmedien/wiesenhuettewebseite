import { PurchaseClient } from "./PurchaseClient";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

export const metadata = {
  title: "Geschenk-Gutschein · Wiesenhütte",
  description:
    "Verschenke einen Aufenthalt in der Wiesenhütte. Online kaufen, sofort per E-Mail an die Beschenkten — oder ausdrucken und persönlich überreichen.",
};

const COPY: Record<Locale, { eyebrow: string; h1: string; lead: string }> = {
  de: {
    eyebrow: "Verschenken",
    h1: "Drei Tage Sauerland verschenken.",
    lead: "Statt schon wieder Socken: eine Hüttennacht. Du wählst den Betrag, wir kümmern uns um den Rest — Versand per E-Mail an die Beschenkten oder als druckbares PDF zum persönlichen Überreichen.",
  },
  en: {
    eyebrow: "Gifting",
    h1: "Give three days of Sauerland.",
    lead: "Instead of socks again: a cabin stay. You choose the amount, we handle the rest — delivered by email to the recipient or as a printable PDF to hand over in person.",
  },
  nl: {
    eyebrow: "Cadeau",
    h1: "Geef drie dagen Sauerland cadeau.",
    lead: "In plaats van weer sokken: een hutnacht. Jij kiest het bedrag, wij regelen de rest — per e-mail naar de ontvanger of als afdrukbare PDF om persoonlijk te overhandigen.",
  },
};

export default async function GeschenkPage() {
  const locale = await getServerLocale();
  const c = COPY[locale];
  return (
    <div>
      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[760px] mx-auto">
          <div className="eyebrow mb-3">{c.eyebrow}</div>
          <h1 className="text-[36px] sm:text-[56px] m-0 mb-4 leading-[1.05] font-display font-bold text-[var(--color-wh-deep-green)]">
            {c.h1}
          </h1>
          <p className="text-[16px] sm:text-[18px] leading-relaxed text-[var(--color-wh-black)] m-0">
            {c.lead}
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-12 sm:py-16">
        <div className="max-w-[760px] mx-auto bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 sm:p-8">
          <PurchaseClient locale={locale} />
        </div>
      </section>
    </div>
  );
}
