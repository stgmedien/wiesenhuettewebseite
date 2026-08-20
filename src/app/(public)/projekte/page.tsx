import { PROJEKTE } from "./data";
import { ProjektGalerie } from "./ProjektGalerie";
import { GelaendeKarte } from "./GelaendeKarte";
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
          <p className={styles.leadIn}>Das steht gerade zur Auswahl:</p>
        </header>

        <GelaendeKarte />

        <ProjektGalerie projekte={PROJEKTE} />

        <div className={styles.closing}>
          <div className={styles.closingGrid}>
            <p className={styles.closingText}>
              Wichtig ist nur: Nehmt euch nicht zu viele Bausteine auf einmal vor. Zu einer guten
              Fahrt gehören ein Küchenteam, eine Runde durch Winterberg, Zeit füreinander und
              Kennenlern- sowie Kooperationsspiele — das trägt genauso zu einer guten Gruppe bei
              wie die Bauprojekte selbst.
            </p>

            <aside className={styles.gdBox}>
              <div className={styles.gdBadge}>🎲</div>
              <p className={styles.gdEyebrow}>Gruppendynamik buchen</p>
              <p className={styles.gdText}>
                Kennenlern- und Kooperationsspiele für eure Gruppe — auf Anfrage, unabhängig von
                den Bau-Bausteinen.
              </p>
              <div className={styles.gdCategories}>
                <div className={styles.gdCategory}>
                  <span className={styles.gdCategoryTag}>🤝 Kennenlernen</span>
                  <span className={styles.gdCategoryEx}>z. B. Namensbingo, Blitzlicht-Runden</span>
                </div>
                <div className={styles.gdCategory}>
                  <span className={styles.gdCategoryTag}>🧩 Kooperation</span>
                  <span className={styles.gdCategoryEx}>
                    z. B. Turmbau-Challenge, Blindes Quadrat, Spinnennetz
                  </span>
                </div>
              </div>
              <p className={styles.gdListLabel}>Ansprechpartner</p>
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
        </div>
      </div>
    </div>
  );
}
