import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { projekte } from "@/lib/db/schema";
import { ProjektGalerie } from "./ProjektGalerie";
import { fraunces } from "./fonts";
import styles from "./projekte.module.css";

// Versteckte Seite: nicht in Navigation/Sitemap, zusätzlich noindex/nofollow —
// nur über den direkt geteilten Link erreichbar (z. B. Elternabend-Beamer,
// WhatsApp an die Klasse). Siehe /wapelbad für das gleiche Muster.
// Daten kommen live aus der DB (von Dana/Tanja im Manager-Bereich pflegbar) —
// deshalb dynamic statt statisch gecacht, sonst sehen sie Aenderungen erst
// nach einem Redeploy.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Projekte rund um die Hütte · Wiesenhütte",
  description:
    "Was in den nächsten Jahren rund um die Wiesenhütte entsteht — zum Anklicken, Aussuchen und Anpacken.",
  robots: { index: false, follow: false },
};

export default async function ProjektePage() {
  const alleProjekte = await db.select().from(projekte).orderBy(asc(projekte.sortOrder));

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
              Nach eurer überzeugenden Kostenkalkulation übernimmt der Skiverein gerne Material
              wie Farbe, Werkzeug oder Baumaterial — kurze Abstimmung mit uns vorausgesetzt.
            </p>
            <p>
              Wichtig ist nur: Nehmt euch nicht zu viele Bausteine auf einmal vor. Zu einer guten
              Fahrt gehören ein Küchenteam, eine Runde durch Winterberg, Zeit füreinander und
              Kennenlern- sowie Kooperationsspiele — das trägt genauso zu einer guten Gruppe bei
              wie die Bauprojekte selbst.
            </p>
            <p className={styles.leadIn}>Das steht gerade zur Auswahl:</p>
          </header>

          <aside className={styles.gdBox}>
            <div className={styles.gdBadge}>🎲</div>
            <p className={styles.gdEyebrow}>Gruppendynamik buchen</p>
            <p className={styles.gdText}>
              Kennenlern- und Kooperationsspiele für eure Gruppe — auf Anfrage, unabhängig von den
              Bau-Bausteinen.
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

        <ProjektGalerie projekte={alleProjekte} />
      </div>
    </div>
  );
}
