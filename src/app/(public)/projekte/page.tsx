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
        <div className={styles.headerGrid}>
          <header className={styles.masthead}>
            <p className={styles.eyebrow}>Wiesenhütte &middot; Projekte</p>
            <h1>Was rund um die Hütte entsteht.</h1>
            <p>
              Rund um die Wiesenhütte entsteht in den nächsten Jahren einiges — und ihr könnt
              dabei sein. Die Hütte ist nicht nur ein Ort zum Skifahren oder Wandern, sie eignet
              sich genauso gut fürs gemeinsame Anpacken. Sucht euch als Klasse einen der Bausteine
              hier aus und macht daraus euer eigenes kleines Projekt: von der ersten Idee über den
              Kostenvoranschlag bis zur Umsetzung vor Ort.
            </p>
            <p>
              Ums Geld müsst ihr euch dabei keine Sorgen machen: Material wie Farbe, Werkzeug oder
              Baumaterial übernimmt der Skiverein — vorher braucht&apos;s nur einen kurzen
              Kostenvoranschlag und unsere Abstimmung.
            </p>
            <p>
              Wichtig ist nur: Nehmt euch nicht zu viele Bausteine auf einmal vor. Zu einer guten
              Fahrt gehören genauso ein Küchenteam, eine Runde durch Winterberg und einfach Zeit
              füreinander.
            </p>
            <p>
              Genauso wichtig wie das Werkeln: Zeit, in der ihr als Gruppe zusammenwachst.
              Kennenlern- und Kooperationsspiele gehören für uns mit dazu, nicht nur das Bauen und
              Anpacken.
            </p>
            <p className={styles.leadIn}>Das steht gerade zur Auswahl:</p>
          </header>

          <aside className={styles.gdBox}>
            <p className={styles.gdEyebrow}>Gruppendynamik buchen</p>
            <p className={styles.gdText}>
              Kennenlern- und Kooperationsspiele für die Gruppe — auf Anfrage, unabhängig von den
              Bau-Bausteinen.
            </p>
            <ul className={styles.gdList}>
              <li>
                <span className={styles.gdName}>[Name]</span>
                <span className={styles.gdPhone}>[Telefonnummer]</span>
              </li>
              <li>
                <span className={styles.gdName}>[Name]</span>
                <span className={styles.gdPhone}>[Telefonnummer]</span>
              </li>
            </ul>
          </aside>
        </div>

        <ProjektGalerie projekte={PROJEKTE} />
      </div>
    </div>
  );
}
