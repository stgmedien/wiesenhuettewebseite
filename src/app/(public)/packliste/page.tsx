import { PacklisteClient } from "./PacklisteClient";

export const metadata = {
  title: "Packliste-Generator · Wiesenhütte",
  description:
    "Personalisierte Packliste für Deinen Aufenthalt in der Wiesenhütte — passend zu Saison, Personenanzahl und Aktivitäten. Mit Druck-PDF zum Abhaken.",
};

export default function PacklistePage() {
  return (
    <div>
      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow mb-3">Vor der Anreise</div>
          <h1 className="text-[36px] sm:text-[56px] m-0 mb-4 leading-[1.05] font-display font-bold text-[var(--color-wh-deep-green)]">
            Packliste-Generator.
          </h1>
          <p className="text-[16px] sm:text-[18px] leading-relaxed max-w-2xl text-[var(--color-wh-black)] m-0">
            Erzähl uns kurz, was Ihr vorhabt — wir bauen die passende Packliste. Mengen je nach
            Personenanzahl und Saison, mit allem was die Hütte selbst nicht bereitstellt.
            Druckfreundlich als PDF zum Abhaken.
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-12 sm:py-16">
        <div className="max-w-[1180px] mx-auto">
          <PacklisteClient />
        </div>
      </section>

      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-10">
        <div className="max-w-[760px] mx-auto">
          <p className="text-[13px] text-[var(--color-wh-fg-muted)] italic m-0 text-center">
            Hinweis: Die Liste ist eine sehr gute Basis — aber jede Gruppe ist anders. Wenn Ihr
            spezielle Bedürfnisse habt (Allergien, Babys, Hunde), ergänzt frei. Bei Fragen vor
            der Anreise meldet Euch gern bei uns.
          </p>
        </div>
      </section>
    </div>
  );
}
