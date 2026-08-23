import { PROJEKTE } from "./data";
import { ProjektGalerie } from "./ProjektGalerie";
import { GelaendeKarte } from "./GelaendeKarte";
import { PlanungsWidget } from "./PlanungsWidget";
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
            Rund um die Wiesenhütte entsteht in den nächsten Jahren einiges – und ihr könnt dabei
            sein. Sucht euch als Klasse einen der Bausteine aus und macht daraus euer eigenes
            Projekt, von der Idee bis zur Umsetzung vor Ort. Material wie Farbe, Werkzeug oder
            Baumaterial übernimmt der Skiverein nach kurzer Abstimmung.
          </p>
        </header>

        <GelaendeKarte />

        <ProjektGalerie projekte={PROJEKTE} />

        <div className={styles.closing}>
          <p className={styles.closingText}>
            Wichtig ist nur: Nehmt euch nicht zu viele Bausteine auf einmal vor. Zu einer guten
            Fahrt gehören ein Küchenteam, eine Runde durch Winterberg, Zeit füreinander und
            Kennenlern- sowie Kooperationsspiele — das trägt genauso zu einer guten Gruppe bei wie
            die Bauprojekte selbst.
          </p>

          <div className={styles.closingGrid}>
            <aside className={styles.gdBox}>
              <div className={styles.gdBadge}>🎲</div>
              <p className={styles.gdEyebrow}>Gruppendynamik buchen</p>
              <p className={styles.gdText}>
                Kennenlern- und Kooperationsspiele für eure Gruppe, angeleitet von externen
                Teamer:innen — auf Anfrage, unabhängig von den Bau-Bausteinen.
              </p>
              <a href="/fahrten" className={styles.spendenLink}>
                Mehr erfahren &amp; anfragen →
              </a>
            </aside>

            <aside className={styles.gdBox}>
              <div className={styles.gdBadge}>🌲</div>
              <p className={styles.gdEyebrow}>Naturerleben &amp; Nachhaltigkeit</p>
              <p className={styles.gdText}>
                Geführte Waldtouren mit Ranger:innen des Regionalforstamts Oberes Sauerland —
                direkt ab der Hütte, für Schulklassen kostenfrei.
              </p>
              <a href="/fahrten" className={styles.spendenLink}>
                Mehr erfahren &amp; anfragen →
              </a>
            </aside>
          </div>
        </div>
      </div>

      <PlanungsWidget />
    </div>
  );
}
