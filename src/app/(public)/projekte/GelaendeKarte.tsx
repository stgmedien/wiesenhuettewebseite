import { readFileSync } from "fs";
import path from "path";
import styles from "./projekte.module.css";

// SVG wird als statische Datei gepflegt (gleiches Muster wie die Illustrationen
// unter /public/media/projekte) und hier server-seitig inline gerendert, nicht
// per <img src>, damit die Hover-Interaktion (CSS :hover in der SVG selbst)
// funktioniert -- <img> sandboxt den SVG-Inhalt und blockt das.
function ladeKarteSvg() {
  const dateipfad = path.join(process.cwd(), "src/app/(public)/projekte/gelaende-karte.svg");
  return readFileSync(dateipfad, "utf-8");
}

export function GelaendeKarte() {
  const svg = ladeKarteSvg();
  return (
    <section className={styles.karteSection}>
      <p className={styles.karteEyebrow}>Wiesenhütte &middot; Rundgang übers Gelände</p>
      <h2 className={styles.karteTitle}>Das erwartet euch auf dem Gelände.</h2>
      <div className={styles.karteDivider} />
      <p className={styles.karteLead}>
        Vom Zeltplatz im Wald bis zur Feuerstelle, vom Freisitz an der Hauswand bis zur Blühwiese
        an der Zufahrt — ein erster Überblick, bevor ihr euch für ein Projekt entscheidet. Zum
        Entdecken: mit der Maus über die Punkte fahren.
      </p>
      <div className={styles.karteCard}>
        <div className={styles.karteSvgWrap} dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </section>
  );
}
