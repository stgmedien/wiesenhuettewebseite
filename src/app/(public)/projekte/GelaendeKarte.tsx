import { readFileSync } from "fs";
import path from "path";
import Script from "next/script";
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
      <h2 className={styles.karteTitle}>Das erwartet euch auf dem Gelände.</h2>
      <div className={styles.karteDivider} />
      <p className={styles.karteLead}>
        Vom Zeltplatz im Wald bis zur Feuerstelle, vom Freisitz an der Hauswand bis zur Blühwiese
        an der Zufahrt — ein erster Überblick, bevor ihr euch für ein Projekt entscheidet. Zum
        Entdecken: über die Punkte fahren oder sie antippen.
      </p>
      <div className={styles.karteCard}>
        <div className={styles.karteScroll}>
          <div className={styles.karteSvgWrap} dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
        <p className={styles.karteSwipeHint} aria-hidden="true">
          ◂ zum Erkunden wischen ▸
        </p>
      </div>
      {/* Verlinkt die Karten-Icons mit den Projektkarten weiter unten (per
          data-key/data-projekt-key) -- ein Klick auf z. B. "Zeltplatz"
          scrollt zur passenden Karte und oeffnet sie, wie ein Klick auf die
          Karte selbst. Bewusst reines <script> statt React-State: die Karte
          ist server-gerendertes, statisches SVG-Markup ohne eigene Insel.

          Auf Geraeten ohne Hover (matchMedia "hover: none", also praktisch
          alle Touch-Geraete) braucht ein Tap zwei Stufen: der erste zeigt
          das Tooltip/den hervorgehobenen Zustand (ersetzt das Hover, das es
          dort ja nicht gibt), erst der zweite Tap auf denselben Punkt
          scrollt weiter zur Projektkarte. Auf Geraeten mit Hover (Maus) hat
          man das Tooltip vorher schon gesehen -- da navigiert ein Klick
          weiterhin direkt, wie bisher. */}
      <Script id="gelaende-karte-links" strategy="afterInteractive">
        {`
          var pois = document.querySelectorAll('.poi[data-key]');
          var keineHoverFaehigkeit = window.matchMedia('(hover: none)').matches;
          pois.forEach(function (poi) {
            poi.addEventListener('click', function () {
              if (keineHoverFaehigkeit && !poi.classList.contains('is-active')) {
                pois.forEach(function (p) { p.classList.remove('is-active'); });
                poi.classList.add('is-active');
                return;
              }
              var key = poi.getAttribute('data-key');
              var karte = document.querySelector('[data-projekt-key="' + key + '"]');
              if (karte) {
                karte.scrollIntoView({ behavior: 'smooth', block: 'center' });
                karte.click();
              }
            });
          });
        `}
      </Script>
    </section>
  );
}
