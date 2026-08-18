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
              Die Wiesenhütte ist nicht nur zum Skifahren oder Wandern da — sie lässt sich mit
              einer Klasse auch als Ort für gemeinsames Lernen und Anpacken nutzen. Einen der
              folgenden Bausteine auszuwählen ist eine Möglichkeit, eine Klassenfahrt zu gestalten:
              von der Idee über den Kostenvoranschlag bis zur Umsetzung vor Ort.
            </p>
            <p>
              Material für die Umsetzung — Farbe, Werkzeug, Baumaterial — übernimmt der Skiverein,
              nach vorherigem Kostenvoranschlag und Abstimmung.
            </p>
            <p>
              Wichtig dabei: nicht zu viele Bausteine auf einmal. Jede Fahrt braucht ein
              Küchenteam und Zeit für Winterberg — Mountainbike-Trail, Rodelbahn, Fußball.
            </p>
            <p>
              Genauso wichtig: Themen für Gruppendynamik sind selbst ein eigener Baustein, kein
              Beiwerk — Kennenlern- und Kooperationsspiele, die eine Klasse als Gruppe
              zusammenwachsen lassen, unabhängig davon, ob nebenbei gewerkelt wird.
            </p>
            <p className={styles.leadIn}>Aktuell stehen diese Bausteine zur Auswahl:</p>
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
