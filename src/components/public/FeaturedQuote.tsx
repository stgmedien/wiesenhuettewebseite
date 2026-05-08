"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  author: string;
  role?: string;
  /** Position für leichten alternierenden Effekt */
  align?: "left" | "right";
  /** Verzögerung in ms für gestaffelte Animation */
  delayMs?: number;
};

/**
 * Stark hervorgehobenes, animiertes Zitat.
 *
 * Sichtbarkeit:
 * - Initial-Render (SSR): Zitat ist GANZ NORMAL sichtbar (keine 0-opacity-Falle).
 * - Beim Mount auf dem Client: setzt sich kurzzeitig in den "Hidden"-Pre-Animation-State,
 *   und dann triggert IntersectionObserver die Reveal-Animation, sobald das Element
 *   ins Viewport kommt. Dieser Trick verhindert, dass JS-blockierte oder zu schnell
 *   gerenderte Elemente unsichtbar bleiben.
 */
export function FeaturedQuote({
  text,
  author,
  role,
  align = "left",
  delayMs = 0,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  // Der Trick: standardmäßig `true` — das Zitat ist NIE unsichtbar, falls
  // IntersectionObserver fehlt oder Hydration spät kommt.
  const [hasMounted, setHasMounted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    // Wenn das Element bereits im Viewport ist, sofort revealen
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setRevealed(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  // Während kein JS / vor Hydration: alle Inhalte sind regulär sichtbar.
  // Nach Mount und solange nicht revealed: kurz versteckt, damit Reveal-Animation
  // sichtbar wird.
  const isHidden = hasMounted && !revealed;

  return (
    <figure
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`group relative overflow-hidden rounded-[28px] p-8 sm:p-12 transition-all duration-[900ms] ease-out
        ${align === "right" ? "sm:ml-auto" : ""}
        max-w-3xl
        bg-gradient-to-br from-[var(--color-wh-snow)] via-white to-[var(--color-wh-beige)]
        border border-[var(--color-wh-deep-green)]/20
        shadow-[0_8px_30px_rgba(47,74,53,0.10)]
        hover:shadow-[0_24px_70px_rgba(47,74,53,0.22)]
        hover:-translate-y-1.5
        ${
          isHidden
            ? "opacity-0 translate-y-10 scale-[0.97]"
            : "opacity-100 translate-y-0 scale-100"
        }
      `}
    >
      {/* Animierte Akzent-Lichtbahn (sweep) — nur on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -top-10 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background:
            "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.7) 50%, transparent 70%)",
          transform: "skewX(-12deg)",
          animation: "fq-sweep 2.4s ease-in-out infinite",
        }}
      />

      {/* Dekorativer Quote-Glyph oben links */}
      <div
        aria-hidden
        className="absolute -top-2 left-4 sm:-top-4 sm:left-8 select-none font-display font-bold text-[120px] sm:text-[180px] leading-none text-[var(--color-wh-deep-green)]/[0.09] pointer-events-none"
        style={{
          animation: "fq-float 6s ease-in-out infinite",
        }}
      >
        “
      </div>

      {/* Animierte Akzentlinie links */}
      <div
        aria-hidden
        className={`absolute left-0 top-10 bottom-10 w-1 rounded-full bg-gradient-to-b from-[var(--color-wh-deep-green)] via-[var(--color-wh-deep-green)] to-[var(--color-wh-deep-green)]/40 transition-all duration-700 ${
          isHidden ? "scale-y-0 opacity-0" : "scale-y-100 opacity-100"
        }`}
        style={{
          transformOrigin: "top",
          transitionDelay: `${delayMs + 200}ms`,
        }}
      />

      {/* Eyebrow / Label */}
      <div
        className={`relative z-10 inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--color-wh-deep-green)]/80 mb-5 transition-all duration-700 ${
          isHidden ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
        style={{ transitionDelay: `${delayMs + 100}ms` }}
      >
        <span className="inline-block w-6 h-px bg-[var(--color-wh-deep-green)]/60" />
        Stimme aus der Hütte
      </div>

      {/* Das Zitat selbst */}
      <blockquote
        className={`relative z-10 m-0 transition-all duration-700 ${
          isHidden ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        }`}
        style={{ transitionDelay: `${delayMs + 250}ms` }}
      >
        <p className="m-0 font-display font-medium text-[22px] sm:text-[28px] md:text-[32px] leading-[1.35] text-[var(--color-wh-deep-green)] tracking-tight">
          <span className="text-[var(--color-wh-deep-green)]/70 mr-1">„</span>
          {text}
          <span className="text-[var(--color-wh-deep-green)]/70 ml-1">"</span>
        </p>
      </blockquote>

      {/* Author */}
      <figcaption
        className={`relative z-10 mt-7 sm:mt-8 flex items-center gap-3 transition-all duration-700 ${
          isHidden ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
        style={{ transitionDelay: `${delayMs + 400}ms` }}
      >
        {/* Initialen-Avatar */}
        <div
          aria-hidden
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[var(--color-wh-deep-green)] to-[var(--color-wh-deep-green)]/70 text-white flex items-center justify-center font-display font-bold text-[15px] shadow-md ring-2 ring-white"
        >
          {author
            .split(" ")
            .map((p) => p[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")}
        </div>
        <div className="leading-tight">
          <p className="m-0 text-[15px] sm:text-[16px] font-semibold text-[var(--color-wh-deep-green)]">
            {author}
          </p>
          {role && (
            <p className="m-0 text-[12px] sm:text-[13px] text-[var(--color-wh-fg-muted)]">
              {role}
            </p>
          )}
        </div>
      </figcaption>

      {/* Bottom-rechts dekorativer Glyph */}
      <div
        aria-hidden
        className="absolute bottom-2 right-6 sm:bottom-4 sm:right-10 select-none font-display font-bold text-[80px] sm:text-[120px] leading-none text-[var(--color-wh-deep-green)]/[0.06] rotate-180 pointer-events-none"
      >
        “
      </div>

      <style jsx>{`
        @keyframes fq-float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-6px) rotate(-2deg);
          }
        }
        @keyframes fq-sweep {
          0% {
            transform: translateX(-30%) skewX(-12deg);
          }
          100% {
            transform: translateX(130%) skewX(-12deg);
          }
        }
      `}</style>
    </figure>
  );
}
