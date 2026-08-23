"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList, X, ArrowRight } from "lucide-react";
import { usePlanungsAuswahl, TAGE_VERFUEGBAR } from "@/lib/planungs-auswahl";
import styles from "./projekte.module.css";

const BAR_FARBE = {
  neutral: "var(--pk-line)",
  gut: "var(--pk-pine)",
  knapp: "var(--pk-sun)",
  eng: "var(--pk-warn)",
} as const;

function pkStatus(summe: number): { label: string; ton: keyof typeof BAR_FARBE } {
  if (summe === 0) return { label: "Noch nichts ausgewählt.", ton: "neutral" };
  if (summe <= 1.5) return { label: "Gut machbar.", ton: "gut" };
  if (summe <= TAGE_VERFUEGBAR) return { label: "Knapp, aber passt in den Rahmen.", ton: "knapp" };
  return { label: "Das wird eng — überlegt, was ihr streicht.", ton: "eng" };
}

export function PlanungsWidget() {
  const [offen, setOffen] = useState(false);
  const { toggleFahrt, toggleProjekt, fahrtModule, projektModule, summe, anzahl } = usePlanungsAuswahl();

  if (anzahl === 0 && !offen) return null;

  const status = pkStatus(summe);

  return (
    <div className={styles.planWrap}>
      {offen && (
        <div className={styles.planPanel} role="dialog" aria-label="Eure Fahrt-Planung">
          <div className={styles.planPanelHead}>
            <p className={styles.planPanelTitle}>Eure Fahrt-Planung</p>
            <button
              type="button"
              className={styles.planPanelClose}
              aria-label="Schließen"
              onClick={() => setOffen(false)}
            >
              <X size={16} />
            </button>
          </div>

          <p className={styles.planStatus} style={{ color: BAR_FARBE[status.ton] }}>
            {status.label} {summe.toFixed(1)} / {TAGE_VERFUEGBAR} Tagen
          </p>
          <div className={styles.planBar}>
            <div
              className={styles.planBarFill}
              style={{
                width: `${Math.min(100, (summe / TAGE_VERFUEGBAR) * 100)}%`,
                background: BAR_FARBE[status.ton],
              }}
            />
          </div>

          {anzahl > 0 ? (
            <ul className={styles.planList}>
              {fahrtModule.map((m) => (
                <li key={m.id} className={styles.planItem}>
                  <span>{m.titel}</span>
                  <button
                    type="button"
                    className={styles.planItemRemove}
                    aria-label={`${m.titel} entfernen`}
                    onClick={() => toggleFahrt(m.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
              {projektModule.map((p) => (
                <li key={p.key} className={styles.planItem}>
                  <span>{p.titel}</span>
                  <button
                    type="button"
                    className={styles.planItemRemove}
                    aria-label={`${p.titel} entfernen`}
                    onClick={() => toggleProjekt(p.key)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.planStatus} style={{ fontWeight: 400 }}>
              Wählt oben Bau-Bausteine aus, oder schaut bei den{" "}
              <Link href="/fahrten" className={styles.planLink} style={{ display: "inline" }}>
                Fahrten-Angeboten
              </Link>{" "}
              vorbei.
            </p>
          )}

          <Link href="/fahrten" className={styles.planLink}>
            Zur Fahrten-Planung <ArrowRight size={13} />
          </Link>
        </div>
      )}

      <button type="button" className={styles.planPill} onClick={() => setOffen((v) => !v)}>
        <ClipboardList size={16} />
        Fahrt-Planung
        {anzahl > 0 && <span className={styles.planPillDot}>{summe.toFixed(1)}</span>}
      </button>
    </div>
  );
}
