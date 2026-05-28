"use client";

/**
 * FloorPlanExplorer — interaktiver Vier-Geschoss-Grundriss-Explorer.
 *
 * Drei Sehnen-Animationen tragen den WOW-Effekt:
 *
 *  1) Scroll-Reveal (IntersectionObserver): Header slidet hoch, die vier
 *     Building-Stack-Karten cascade'n von oben nach unten herein (je 120ms),
 *     der Hauptplan fade-scaled rein.
 *
 *  2) Floor-Switch-Crossfade: zwei Image-Layer stacken im Plan-Canvas, der
 *     inaktive wird unter den aktiven ausgeblendet, simultan startet die
 *     neue Layer mit scale 0.96 → 1 + opacity 0 → 1. Info-Spalte mit
 *     gleichem Timing.
 *
 *  3) Building-Stack-Indikator: tiny isometric "Haus" — die aktive Etage
 *     wird leicht nach rechts heraus-geschoben (translateX) und mit
 *     Snow-Hintergrund + Deep-Green-Border hervorgehoben, inaktive Etagen
 *     sitzen dezent in halbtransparentem Snow.
 *
 * Alles in purem React + CSS-Transitions — keine framer-motion-Dependency.
 */

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type FloorKey = "ug" | "eg" | "og" | "dg";

export type Floor = {
  key: FloorKey;
  /** Anzeige-Name: „Dachgeschoss" etc. */
  label: string;
  /** Kurz-Tag rechts neben dem Building-Stack: „UG" usw. */
  tag: string;
  /** Pfad zum optimierten Grundriss-PNG. */
  src: string;
  /** Anzahl Schlafplätze auf dieser Etage (0 = keine). */
  sleeps: number;
  /** Drei bis fünf Highlight-Räume für die Info-Spalte. */
  highlights: string[];
};

type Props = {
  floors: Floor[];
  texts: {
    eyebrow: string;
    h2: string;
    lead: string;
    sleepingLabel: string;
    roomsLabel: string;
    /** „Etage auswählen" — Aria-Label für Sidebar */
    selectAriaLabel: string;
    /** Schlafplatz-Wort Singular (n === 1), z. B. „Schlafplatz". */
    sleepingWordOne: string;
    /** Schlafplatz-Wort Plural, z. B. „Schlafplätze". */
    sleepingWordOther: string;
    /** Kein-Schlafplatz-Label, z. B. „Gemeinschaft & Service" */
    nonSleepingLabel: string;
  };
};

export function FloorPlanExplorer({ floors, texts }: Props) {
  // Default: Erdgeschoss als natürlicher Einstieg (Haupteingang, Küche, Esszimmer).
  const [activeKey, setActiveKey] = useState<FloorKey>("eg");
  const [revealed, setRevealed] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  // IntersectionObserver — feuert genau einmal, wenn die Section in den
  // Viewport scrollt. Setzt `revealed`, das die initialen Transition-Klassen
  // umschaltet.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || revealed) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setRevealed(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "-12% 0px -12% 0px", threshold: 0.05 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [revealed]);

  const active = floors.find((f) => f.key === activeKey) ?? floors[0];

  return (
    <section
      ref={sectionRef}
      className="relative bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] overflow-hidden"
    >
      {/* Dezente architektonische Background-Patterns:
          - oben links: weicher Snow-Glow
          - mitte rechts: zweiter Glow, leicht versetzt
          Beide subtle (~6 % Opacity), zur Brand passend. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-[var(--color-wh-snow)]/[0.05] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-40 w-[520px] h-[520px] rounded-full bg-[var(--color-wh-green)]/30 blur-3xl"
      />

      <div className="relative max-w-[1280px] mx-auto px-6 sm:px-8 py-16 sm:py-24">
        {/* ─── Header ───────────────────────────────────────────── */}
        <div
          className={[
            "max-w-2xl transition-all duration-700 ease-out",
            revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          <div className="eyebrow text-[var(--color-wh-snow)]/80">{texts.eyebrow}</div>
          <h2 className="font-display font-bold text-[var(--color-wh-snow)] text-[32px] sm:text-[44px] leading-tight mt-3 mb-4">
            {texts.h2}
          </h2>
          <p className="text-[var(--color-wh-snow)]/80 text-base sm:text-[17px] leading-relaxed m-0">
            {texts.lead}
          </p>
        </div>

        {/* ─── Main Grid: Stack | Plan | Info ───────────────────── */}
        <div className="mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-[200px_1fr_240px] gap-6 md:gap-8 items-start">
          {/* Linke Spalte: Building-Stack-Indikator
              Mobile: horizontal scrollable Reihe oben.
              Desktop: vertikale Stapel-Sidebar (UG unten, DG oben — wie ein echtes
              Haus, deshalb floors.slice().reverse()). */}
          <div
            className="md:sticky md:top-24 -mx-6 sm:-mx-8 md:mx-0 px-6 sm:px-8 md:px-0 overflow-x-auto md:overflow-visible"
            role="tablist"
            aria-label={texts.selectAriaLabel}
          >
            <div className="flex md:flex-col gap-2 md:gap-2 min-w-max md:min-w-0">
              {[...floors].reverse().map((f, i) => {
                const isActive = f.key === activeKey;
                const revealDelay = revealed ? 200 + i * 110 : 0;
                return (
                  <button
                    key={f.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveKey(f.key)}
                    style={{ transitionDelay: `${revealDelay}ms` }}
                    className={[
                      "group relative shrink-0",
                      "w-[160px] md:w-full",
                      "rounded-[var(--radius-md)]",
                      "border transition-all duration-500 ease-out",
                      "cursor-pointer text-left p-3 sm:p-3.5",
                      revealed
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-4",
                      isActive
                        ? "bg-[var(--color-wh-snow)] text-[var(--color-wh-deep-green)] border-[var(--color-wh-snow)] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)] md:translate-x-2"
                        : "bg-[var(--color-wh-snow)]/[0.07] text-[var(--color-wh-snow)] border-[var(--color-wh-snow)]/15 hover:bg-[var(--color-wh-snow)]/[0.12] hover:border-[var(--color-wh-snow)]/30",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      {/* Mini-Diagram: kleines Rechteck als Haus-Etage,
                          aktive Etage in Deep-Green ausgefüllt. */}
                      <span
                        aria-hidden
                        className={[
                          "block w-7 h-5 rounded-sm border transition-colors",
                          isActive
                            ? "bg-[var(--color-wh-deep-green)] border-[var(--color-wh-deep-green)]"
                            : "bg-transparent border-[var(--color-wh-snow)]/40 group-hover:border-[var(--color-wh-snow)]/70",
                        ].join(" ")}
                      />
                      <div className="flex flex-col leading-tight">
                        <span
                          className={[
                            "text-[10px] uppercase tracking-[0.16em] font-bold",
                            isActive
                              ? "text-[var(--color-wh-green)]"
                              : "text-[var(--color-wh-snow)]/60",
                          ].join(" ")}
                        >
                          {f.tag}
                        </span>
                        <span className="font-semibold text-[15px] mt-0.5">
                          {f.label}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mittlere Spalte: Plan-Canvas mit Crossfade.
              Wir rendern ALLE vier Pläne übereinander, aber nur der aktive
              hat opacity-100 + scale-100. Das gibt einen sauberen Crossfade
              ohne Layout-Shift und ohne erneutes Laden beim Wechseln. */}
          <div
            className={[
              "relative bg-[var(--color-wh-snow)] rounded-[var(--radius-card)] overflow-hidden",
              "shadow-[0_40px_80px_-30px_rgba(0,0,0,0.45)]",
              "transition-all duration-700 ease-out",
              revealed
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-8 scale-[0.97]",
            ].join(" ")}
            style={{ transitionDelay: revealed ? "320ms" : "0ms" }}
          >
            {/* Aspect-Ratio-Container für stabile Höhe. Die Pläne sind
                ~6:4 — wir nehmen aspect-[3/2] als gut passende Box. */}
            <div className="relative aspect-[3/2] w-full">
              {floors.map((f) => {
                const isActive = f.key === activeKey;
                return (
                  <div
                    key={f.key}
                    aria-hidden={!isActive}
                    className={[
                      "absolute inset-0 transition-all duration-500 ease-out",
                      isActive
                        ? "opacity-100 scale-100 z-10"
                        : "opacity-0 scale-[1.02] z-0",
                    ].join(" ")}
                  >
                    <Image
                      src={f.src}
                      alt={`Grundriss ${f.label}`}
                      fill
                      // Erste sichtbare Etage = priority. Andere lazy.
                      priority={f.key === "eg"}
                      className="object-contain p-3 sm:p-6"
                      sizes="(min-width: 1024px) 720px, (min-width: 640px) 80vw, 100vw"
                    />
                  </div>
                );
              })}
            </div>
            {/* Kleines Floor-Label in der Ecke des Plans, zusätzlich
                zur Sidebar-Markierung. */}
            <div
              key={active.key /* triggert Re-Mount für Fade-In */}
              className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20"
            >
              <div className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.18em] font-bold animate-fade-in">
                {active.tag} · {active.label}
              </div>
            </div>
          </div>

          {/* Rechte Spalte: Info zur aktiven Etage.
              Crossfade synchron mit dem Plan via key-basiertem Re-Mount. */}
          <div
            className={[
              "transition-all duration-700 ease-out",
              revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
            ].join(" ")}
            style={{ transitionDelay: revealed ? "460ms" : "0ms" }}
          >
            <div key={active.key} className="animate-fade-in">
              <div className="eyebrow text-[var(--color-wh-green)]">{active.tag}</div>
              <h3 className="font-display font-bold text-[var(--color-wh-snow)] text-[24px] sm:text-[26px] m-0 mt-2">
                {active.label}
              </h3>

              {/* Schlafplätze-KPI oder Service-Label. */}
              <div className="mt-5 pb-5 border-b border-[var(--color-wh-snow)]/15">
                {active.sleeps > 0 ? (
                  <>
                    <div className="font-display font-bold text-[36px] sm:text-[44px] leading-none text-[var(--color-wh-snow)]">
                      {active.sleeps}
                    </div>
                    <div className="text-xs uppercase tracking-wider text-[var(--color-wh-snow)]/65 mt-1.5">
                      {active.sleeps === 1 ? texts.sleepingWordOne : texts.sleepingWordOther}
                    </div>
                  </>
                ) : (
                  <div className="text-xs uppercase tracking-wider text-[var(--color-wh-snow)]/65">
                    {texts.nonSleepingLabel}
                  </div>
                )}
              </div>

              {/* Räume-Highlights. */}
              <div className="mt-5">
                <div className="text-xs uppercase tracking-wider text-[var(--color-wh-snow)]/60 font-bold mb-3">
                  {texts.roomsLabel}
                </div>
                <ul className="m-0 p-0 list-none space-y-2">
                  {active.highlights.map((h) => (
                    <li
                      key={h}
                      className="text-[14px] text-[var(--color-wh-snow)]/90 flex gap-2.5"
                    >
                      <span
                        aria-hidden
                        className="mt-2 shrink-0 inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-wh-green)]"
                      />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tiny inline-keyframes für den Floor-Switch-Fade. Bewusst hier,
          damit der Effekt unabhängig von der globalen CSS-Konfiguration ist. */}
      <style>{`
        @keyframes wh-fp-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: wh-fp-fade-in 480ms ease-out both; }
      `}</style>
    </section>
  );
}
