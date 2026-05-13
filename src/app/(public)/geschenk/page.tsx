import { PurchaseClient } from "./PurchaseClient";

export const metadata = {
  title: "Geschenk-Gutschein · Wiesenhütte",
  description:
    "Verschenke einen Aufenthalt in der Wiesenhütte. Online kaufen, sofort per E-Mail an die Beschenkten — oder ausdrucken und persönlich überreichen.",
};

export default function GeschenkPage() {
  return (
    <div>
      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[760px] mx-auto">
          <div className="eyebrow mb-3">Verschenken</div>
          <h1 className="text-[36px] sm:text-[56px] m-0 mb-4 leading-[1.05] font-display font-bold text-[var(--color-wh-deep-green)]">
            Drei Tage Sauerland verschenken.
          </h1>
          <p className="text-[16px] sm:text-[18px] leading-relaxed text-[var(--color-wh-black)] m-0">
            Statt schon wieder Socken: eine Hüttennacht. Du wählst den Betrag, wir kümmern uns
            um den Rest — Versand per E-Mail an die Beschenkten oder als druckbares PDF zum
            persönlichen Überreichen.
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-12 sm:py-16">
        <div className="max-w-[760px] mx-auto bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 sm:p-8">
          <PurchaseClient />
        </div>
      </section>
    </div>
  );
}
