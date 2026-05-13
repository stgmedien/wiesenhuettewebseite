"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n-shared";

/**
 * Wrapper-Component fuer Scroll-Reveal-Effekte. Kinder bekommen die Klasse
 * `opacity-0 translate-y-6` initial; sobald der Container in den Viewport
 * kommt, wird `opacity-100 translate-y-0` gesetzt — mit Tailwind-Transition.
 *
 * Verwendet IntersectionObserver. Ein Re-Trigger (z.B. beim Hoch-Scrollen)
 * passiert NICHT — Reveal ist ein once-per-Mount Effekt.
 */
export function ScrollReveal({
  children,
  delay = 0,
  className = "",
  as: As = "div",
}: {
  children: React.ReactNode;
  /** Verzoegerung in ms (per Inline-Style, kein extra Tailwind-Util) */
  delay?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Wir bauen die Komponente dynamisch — funktioniert für div/section/article/li
  const Tag = As as unknown as React.ElementType;

  return (
    <Tag
      ref={ref as React.RefObject<HTMLElement>}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </Tag>
  );
}

const STICKY_COPY: Record<Locale, { jumpTo: string }> = {
  de: { jumpTo: "Springe zu" },
  en: { jumpTo: "Jump to" },
  nl: { jumpTo: "Spring naar" },
};

/**
 * Sticky-Kategorie-Nav. Fadet beim Scrollen ueber die Hero-Section ein und
 * markiert die aktive Kategorie basierend auf dem Section-Offset.
 */
export function StickyCategoryNav({
  categories,
  locale,
}: {
  categories: { id: string; label: string; emoji: string; number: string }[];
  locale: Locale;
}) {
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState<string>(categories[0]?.id ?? "");
  const sc = STICKY_COPY[locale];

  useEffect(() => {
    const onScroll = () => {
      // Sticky-Nav erscheint sobald wir > 60vh runtergescrollt sind
      setShown(window.scrollY > window.innerHeight * 0.55);

      // Aktive Section bestimmen: jene, die am naechsten am Viewport-Top liegt
      let best: { id: string; dist: number } | null = null;
      for (const c of categories) {
        const el = document.getElementById(`cat-${c.id}`);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        // bevorzugt: Section, deren Top zwischen 0 und 200px liegt
        const dist = Math.abs(r.top - 120);
        if (!best || dist < best.dist) best = { id: c.id, dist };
      }
      if (best && best.id !== active) setActive(best.id);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [categories, active]);

  return (
    <div
      className={`fixed top-14 left-0 right-0 z-30 transition-all duration-500 ${
        shown ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
    >
      <div className="max-w-[1080px] mx-auto px-3 sm:px-6">
        <div className="bg-[var(--color-wh-snow)]/95 backdrop-blur-md border border-[var(--color-wh-winter-grey)] rounded-full shadow-[0_8px_30px_rgba(47,74,53,0.10)] px-2 sm:px-3 py-2 flex items-center gap-1 sm:gap-2 overflow-x-auto">
          <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)] pl-2 pr-1 shrink-0">
            {sc.jumpTo}
          </span>
          {categories.map((c) => {
            const isActive = active === c.id;
            return (
              <a
                key={c.id}
                href={`#cat-${c.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById(`cat-${c.id}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold no-underline transition-colors ${
                  isActive
                    ? "bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)]"
                    : "text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)]"
                }`}
              >
                <span className="text-sm">{c.emoji}</span>
                <span className="whitespace-nowrap">{c.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Parallax-Hero-Background — der Background-Layer bewegt sich langsamer als
 * der Foreground beim Scrollen. Subtil, keine harten Effekte.
 */
export function ParallaxLayer({ children, speed = 0.4 }: { children: React.ReactNode; speed?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY * speed;
        el.style.transform = `translate3d(0, ${y}px, 0)`;
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);

  return (
    <div ref={ref} className="absolute inset-0 will-change-transform">
      {children}
    </div>
  );
}

/**
 * Tilt-Effect auf einer Karte: bewegt sich subtil mit der Mouse-Position.
 * Auf Touch-Devices deaktiviert.
 */
export function TiltCard({
  children,
  className = "",
  intensity = 6,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return; // Mobile skippen

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5; // -0.5 ... 0.5
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(1200px) rotateY(${px * intensity}deg) rotateX(${-py * intensity}deg) translate3d(0,0,0)`;
    };
    const onLeave = () => {
      el.style.transform = "perspective(1200px) rotateY(0deg) rotateX(0deg)";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [intensity]);

  return (
    <div
      ref={ref}
      className={`transition-transform duration-300 ease-out will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}
