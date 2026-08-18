import { PROJEKTE } from "./data";
import { ProjektGalerie } from "./ProjektGalerie";
import { fraunces } from "./fonts";
import styles from "./projekte.module.css";

// Versteckte Seite: nicht in Navigation/Sitemap, zusätzlich noindex/nofollow —
// nur über den direkt geteilten Link erreichbar (z. B. Elternabend-Beamer,
// WhatsApp an die Klasse). Siehe /wapelbad für das gleiche Muster.
export const metadata = {
  title: "Projekte rund um die Hütte · Wiesenhütte",
  description:
    "Was in den nächsten Jahren rund um die Wiesenhütte entsteht — zum Anklicken, Aussuchen und Anpacken.",
  robots: { index: false, follow: false },
};

export default function ProjektePage() {
  return (
    <div className={`${styles.page} ${fraunces.variable}`}>
      <div className={styles.wrap}>
        <header className={styles.masthead}>
          <p className={styles.eyebrow}>Wiesenhütte &middot; Projekte</p>
          <h1>Was rund um die Hütte entsteht.</h1>
          <p>
            In den nächsten Jahren wächst einiges auf unserem Gelände — vom Zelt-Plateau bis zur
            Blühwiese. Die 8er-Projektfahrten übernehmen einzelne Bausteine: Karte anklicken,
            reinlesen und entscheiden, was zur eigenen Fahrt passt.
          </p>
        </header>

        <ProjektGalerie projekte={PROJEKTE} />
      </div>
    </div>
  );
}
