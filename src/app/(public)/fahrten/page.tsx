import Link from "next/link";
import { DeOnlyBanner } from "@/components/public/DeOnlyBanner";
import { getServerLocale } from "@/lib/i18n";
import { BADGE_LABEL, BADGE_DESC, type FahrtBadge } from "./data";
import { FahrtenBaukasten } from "./FahrtenBaukasten";

export const metadata = {
  title: "Fahrten & Erlebnisse · Wiesenhütte",
  description:
    "Was ihr von der Wiesenhütte aus unternehmt — Ranger-Touren, Erlebnispädagogik, ein Tag in Winterberg und Ideen für die eigene Fahrt. Stellt euch eure Fahrt im Baukasten zusammen.",
};

const BADGE_ORDER: FahrtBadge[] = ["schule", "extern", "selbst"];

export default async function FahrtenPage() {
  const locale = await getServerLocale();
  return (
    <div>
      <DeOnlyBanner locale={locale} />

      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow mb-3">Fahrten &amp; Erlebnisse</div>
          <h1 className="text-[36px] sm:text-[56px] m-0 mb-4 leading-[1.05] font-display font-bold text-[var(--color-wh-deep-green)]">
            Was ihr von der Hütte aus unternehmt.
          </h1>
          <p className="text-[16px] sm:text-[18px] leading-relaxed max-w-2xl text-[var(--color-wh-black)] m-0">
            Rund um die Wiesenhütte liegt ein ganzes Erlebnisgebiet — vom Wald direkt vor der Tür
            bis zu den Freizeitzielen in Winterberg. Wählt unten aus, was zu eurer Fahrt passt —
            der Baukasten zeigt euch direkt, wie viel davon in den Rahmen passt.
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-12 sm:py-14">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 items-start">
          <div>
            <h2 className="font-display font-bold text-[22px] text-[var(--color-wh-deep-green)] mt-0 mb-3">
              Eine gute Fahrt ist mehr als ein Ausflug.
            </h2>
            <p className="text-[15px] leading-relaxed text-[var(--color-wh-black)] m-0 mb-3">
              Zu einer gelungenen Klassenfahrt gehören Bewegung, Naturerfahrung, Zeit füreinander —
              und ein, zwei gemeinsame Erlebnisse, die im Kopf bleiben. Die Angebote hier lassen
              sich mit den{" "}
              <Link href="/projekte" className="text-[var(--color-wh-sunset)] font-semibold">
                Bau-Bausteinen
              </Link>{" "}
              auf dem Gelände kombinieren.
            </p>
            <p className="text-[15px] leading-relaxed text-[var(--color-wh-black)] m-0">
              Nehmt euch nicht zu viel auf einmal vor: lieber ein Angebot richtig erleben als drei
              nur streifen. Bei den angeleiteten Formaten läuft die Anfrage über die Schule oder
              den Verein — Vorlauf einplanen. Für Wandertouren (u. a. zum Kahlen Asten) und
              weitere Ausflugsziele:{" "}
              <Link href="/wandertouren" className="text-[var(--color-wh-deep-green)] font-semibold">
                Wandertouren
              </Link>{" "}
              und{" "}
              <Link href="/empfehlungen" className="text-[var(--color-wh-deep-green)] font-semibold">
                Empfehlungen
              </Link>
              .
            </p>
          </div>
          <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)] m-0 mb-3">
              So sind die Angebote markiert
            </p>
            <div className="flex flex-col gap-3">
              {BADGE_ORDER.map((k) => (
                <div key={k} className="flex items-start gap-2.5 text-sm">
                  <span
                    className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                      k === "schule"
                        ? "bg-[var(--color-wh-deep-green)]"
                        : k === "extern"
                          ? "bg-[var(--color-wh-sunset)]"
                          : "bg-white border-2 border-[var(--color-wh-fg-muted)]"
                    }`}
                  />
                  <span>
                    <strong>{BADGE_LABEL[k]}</strong> — {BADGE_DESC[k]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-8 sm:py-10">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow mb-2">Fahrt-Baukasten</div>
          <h2 className="font-display font-bold text-[26px] sm:text-[32px] text-[var(--color-wh-deep-green)] mt-0 mb-2">
            Stellt euch eure Fahrt zusammen.
          </h2>
          <p className="text-[15px] text-[var(--color-wh-fg-muted)] max-w-2xl mb-8">
            Wählt an, was zu eurer Gruppe passt — die Auslastungsanzeige unten hilft bei der
            Einschätzung, ob es sich in eure Fahrt ausgeht. Details für die Planung stehen
            jeweils unter &bdquo;Für Lehrkräfte&rdquo;.
          </p>
          <FahrtenBaukasten />
        </div>
      </section>

      <section className="px-6 sm:px-8 py-12 sm:py-14">
        <div className="max-w-[1080px] mx-auto bg-[var(--color-wh-deep-green)] text-white rounded-[var(--radius-card)] p-8 sm:p-10 grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-6 items-center">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-wh-sunset)] mb-2">
              Mitmachen
            </div>
            <h2 className="font-display font-bold text-[24px] sm:text-[28px] m-0 mb-2">
              Teamer:in werden
            </h2>
            <p className="text-[15px] text-white/85 max-w-xl m-0">
              Für die erlebnispädagogischen Angebote suchen wir Teamer:innen und
              Erlebnispädagog:innen, die Gruppen an der Hütte anleiten. Zuschnitt, Umfang und
              Vergütung nach Absprache — von einzelnen Einheiten bis zu ganzen Fahrttagen.
            </p>
          </div>
          <div className="md:justify-self-end">
            <Link
              href="/kontakt"
              className="inline-flex h-11 px-6 items-center rounded-full bg-white text-[var(--color-wh-deep-green)] font-semibold no-underline hover:bg-[var(--color-wh-beige)] transition-colors"
            >
              Interesse melden
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
