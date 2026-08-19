"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Projekt } from "./data";
import styles from "./projekte.module.css";
import { fraunces } from "./fonts";

export function ProjektGalerie({ projekte }: { projekte: Projekt[] }) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const active = projekte.find((p) => p.key === activeKey) ?? null;

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveKey(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      lastFocused.current?.focus();
    };
  }, [active]);

  return (
    <>
      <div className={styles.grid}>
        {projekte.map((p) => (
          <button
            key={p.key}
            type="button"
            className={styles.tile}
            data-projekt-key={p.key}
            onClick={(e) => {
              lastFocused.current = e.currentTarget;
              setActiveKey(p.key);
            }}
          >
            <span className={styles.tileImgBox}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.bild} alt="" />
              <span className={styles.tileNr}>{p.nr}</span>
              {p.key === "plateau" && <span className={styles.tileFirst}>startet zuerst</span>}
            </span>
            <span className={styles.tileBody}>
              <span className={styles.tileTitle}>{p.titel}</span>
              <span className={styles.tileSub}>{p.untertitel}</span>
            </span>
          </button>
        ))}
      </div>

      {active &&
        createPortal(
          <div className={`${styles.overlayWrap} ${fraunces.variable}`}>
            {/* Eigenes, kindloses Element fuer den Blur: backdrop-filter auf
                einem Element, das auch die Karte als Kind enthaelt, kann in
                manchen Browsern dazu fuehren, dass der Blur auf den Karten-
                inhalt "durchschlaegt" (Text wirkt dann unscharf). Blur-Layer
                und Karte deshalb als Geschwister, nicht Eltern/Kind. */}
            <div
              className={styles.overlayScrim}
              role="presentation"
              onClick={() => setActiveKey(null)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={active.titel}
              className={styles.overlayCard}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                ref={closeBtnRef}
                type="button"
                className={styles.closeBtn}
                aria-label="Schließen"
                onClick={() => setActiveKey(null)}
              >
                <X size={18} />
              </button>

              <div className={styles.overlayScroll}>
              <div className={styles.hero}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={active.bild} alt="" />
                <div className={styles.heroShade} />
                <div className={styles.heroContent}>
                  <div className={styles.heroTop}>
                    <span className={styles.plaque}>Projekt Nº {active.nr}</span>
                    <span className={styles.since}>
                      Skifreunde Gütersloh e.V.
                      <br />
                      Langewiese &middot; seit 1956
                    </span>
                  </div>
                  <h2 className={styles.heroTitle}>{active.titel}</h2>
                  <div className={styles.heroSub}>{active.untertitel}</div>
                </div>
              </div>

              <div className={styles.body}>
                <div>
                  <p className={styles.eyebrow2}>Darum geht&apos;s</p>
                  <p className={styles.why}>{active.darumGehts}</p>
                </div>

                <div>
                  <p className={styles.eyebrow2}>Das brauchen wir</p>
                  <ul className={styles.needs}>
                    {active.brauchenWir.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className={styles.eyebrow2}>Worauf du dich einlässt</p>
                  <div className={styles.scope}>
                    <div className={styles.cell}>
                      <div className={styles.k}>Zeitrahmen</div>
                      <div className={styles.v}>{active.zeitrahmen}</div>
                    </div>
                    <div className={styles.cell}>
                      <div className={styles.k}>Aufwand</div>
                      <div className={styles.v}>{active.aufwand}</div>
                    </div>
                    <div className={styles.cell}>
                      <div className={styles.k}>Kosten</div>
                      <div className={styles.v}>{active.kosten}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className={styles.eyebrow2}>Zwei Wege mitzumachen</p>
                  <div className={styles.paths}>
                    <div className={`${styles.path} ${styles.pathCraft}`}>
                      <span className={styles.pTag}>🔨 Anpacken &middot; am liebsten</span>
                      <h4>Hände statt Konto</h4>
                      <p>{active.anpacken}</p>
                    </div>
                    <div className={`${styles.path} ${styles.pathGive}`}>
                      <span className={styles.pTag}>💶 Beitrag</span>
                      <h4>Sach- oder Geldspende</h4>
                      <p>{active.beitrag}</p>
                    </div>
                  </div>
                </div>

                <p className={styles.thanks}>{active.danke}</p>
              </div>

              <div className={styles.foot}>
                <div>
                  <div className={styles.footK}>So sagst du zu</div>
                  <div className={styles.footV}>{active.kontakt}</div>
                </div>
                <div className={styles.seal}>
                  <div className={styles.sealTop}>Patenschaft</div>
                  <div className={styles.sealMid}>frei</div>
                  <div className={styles.sealBot}>Nº&nbsp;{active.nr}</div>
                </div>
              </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
