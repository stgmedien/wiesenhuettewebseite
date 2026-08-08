import { Share2, FileText, Clock } from "lucide-react";
import { OfferForm } from "./OfferForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Angebot erstellen · Wiesenhütte",
  description:
    "Erstellt in 30 Sekunden ein teilbares Angebot für die Wiesenhütte — als Link und PDF, mit eingefrorener Preis-Kalkulation, 14 Tage gültig. Perfekt für Lehrerkonferenz und Vereinsvorstand.",
};

// Drei-Schritte-Erklärung über dem Formular
const STEPS = [
  {
    icon: FileText,
    title: "Zeitraum & Gruppe eingeben",
    body: "Wir rechnen mit der gleichen Preis-Engine wie das Buchungstool — auf den Cent genau.",
  },
  {
    icon: Share2,
    title: "Link & PDF teilen",
    body: "Ihr bekommt einen teilbaren Link und ein PDF — perfekt fürs Lehrerzimmer oder die Vorstandsrunde.",
  },
  {
    icon: Clock,
    title: "14 Tage eingefroren",
    body: "Die Kalkulation bleibt 14 Tage stehen. Genug Zeit, um alle zu überzeugen.",
  },
];

export default function AngebotPage() {
  return (
    <div className="bg-[var(--color-wh-snow)]">
      {/* HERO */}
      <section className="px-6 sm:px-8 pt-16 sm:pt-24 pb-10">
        <div className="max-w-[900px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold text-[var(--color-wh-deep-green)]">
            <Share2 size={15} aria-hidden />
            Zum Teilen & Abstimmen
          </div>
          <h1 className="text-[36px] sm:text-[56px] leading-[1.04] mt-4 mb-5">
            Euer Angebot — in 30 Sekunden.
          </h1>
          <p className="text-base sm:text-[18px] leading-relaxed text-[var(--color-wh-fg-muted)] max-w-2xl mx-auto m-0">
            Ihr müsst erst die Lehrerkonferenz oder den Vereinsvorstand überzeugen? Erstellt ein
            unverbindliches Angebot mit fester Preis-Kalkulation — als Link und PDF, 14 Tage
            gültig. Ganz ohne Anmeldung.
          </p>
        </div>
      </section>

      {/* SO FUNKTIONIERT'S */}
      <section className="px-6 sm:px-8 pb-10">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map((s) => (
            <div
              key={s.title}
              className="rounded-[var(--radius-card)] bg-white border border-[var(--color-wh-winter-grey)] p-5"
            >
              <s.icon size={18} className="text-[var(--color-wh-deep-green)]" aria-hidden />
              <div className="font-semibold text-[15px] text-[var(--color-wh-black)] mt-2">
                {s.title}
              </div>
              <p className="text-[13px] text-[var(--color-wh-fg-muted)] leading-relaxed m-0 mt-1">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FORMULAR */}
      <section className="px-6 sm:px-8 pb-20">
        <div className="max-w-[760px] mx-auto">
          <OfferForm />
        </div>
      </section>
    </div>
  );
}
