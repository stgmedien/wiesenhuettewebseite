"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Locale } from "@/lib/i18n-shared";

/**
 * Scroll-Storytelling-Section: "Ein Wochenende in der Wiesenhuette."
 *
 * Desktop: Sticky linkes Bild, scrollender Text rechts. Beim Scroll
 * cross-faden 4 Bilder progressiv durch ein.
 *
 * Mobile: Sticky-Pattern bricht easy → wir nutzen normalen vertikalen
 * Stack (Bild + Text alternierend).
 */

type Beat = {
  photo: string;
  alt: string;
  eyebrow: Record<Locale, string>;
  title: Record<Locale, string>;
  body: Record<Locale, string>;
};

const BEATS: Beat[] = [
  {
    photo: "/media/photos/ankunft_an_der_huette.png",
    alt: "Ankunft an der Wiesenhütte",
    eyebrow: { de: "Freitag · 16 Uhr", en: "Friday · 4 PM", nl: "Vrijdag · 16:00" },
    title: {
      de: "Auto auspacken, Tür auf, Holz im Ofen.",
      en: "Unpack the car, door open, wood in the stove.",
      nl: "Auto uitladen, deur open, hout in de kachel.",
    },
    body: {
      de: "Die letzten drei Kurven runter, Koffer raus, Schlüssel aus dem Briefkasten. Der erste Schritt ins Haus: altes Holz, ein Rest Kaminwärme von der Woche davor, kühle Luft, die langsam aufwärmt. Die Hüttenwartin hat morgens schon eingeheizt.",
      en: "The last three bends down, bags out, key from the letterbox. First step inside: old wood, a trace of last week's fire, cool air slowly warming up. The warden lit the stove this morning.",
      nl: "De laatste drie bochten omlaag, koffers eruit, sleutel uit de brievenbus. De eerste stap naar binnen: oud hout, een restje haardwarmte van de week ervoor, koele lucht die langzaam opwarmt. De huttenwacht heeft 's ochtends al gestookt.",
    },
  },
  {
    photo: "/media/photos/projektfahrten/gemeinsam_uno_spielen.png",
    alt: "Gemeinsames Uno-Spielen am Abend",
    eyebrow: { de: "Freitag · 20 Uhr", en: "Friday · 8 PM", nl: "Vrijdag · 20:00" },
    title: {
      de: "Uno-Runde, niemand hat Empfang.",
      en: "Uno round, nobody has reception.",
      nl: "Uno-rondje, niemand heeft bereik.",
    },
    body: {
      de: "Schlechter Empfang ist hier kein Versehen, sondern der Plan. Handys zur Seite, Karten gemischt, irgendwer setzt aus, jemand bekommt eine Plus-Vier. Draußen klirrend kalt, drinnen wird es laut.",
      en: "Patchy reception here isn't a flaw — it's the point. Phones aside, cards shuffled, someone skips a turn, someone gets a plus-four. Bitter cold outside, loud inside.",
      nl: "Slecht bereik is hier geen ongeluk, maar de bedoeling. Telefoons opzij, kaarten geschud, iemand slaat over, iemand krijgt een plus-vier. Bitter koud buiten, luid binnen.",
    },
  },
  {
    photo: "/media/photos/landscape.jpg",
    alt: "Wandern auf den Kahler Asten am Samstag",
    eyebrow: { de: "Samstag · 10 Uhr", en: "Saturday · 10 AM", nl: "Zaterdag · 10:00" },
    title: {
      de: "Hoch zum Kahler Asten, oben Wind im Gesicht.",
      en: "Up the Kahler Asten, wind on your face.",
      nl: "Omhoog naar de Kahler Asten, wind in je gezicht.",
    },
    body: {
      de: "Eine halbe Stunde vom Haus. Oben der Turm, dahinter die Hochheide. Wenn die Sicht klar ist, reicht der Blick bis ins Bergische Land. Wenn nicht, reicht's bis zur nächsten Bank — auch gut.",
      en: "Half an hour from the house. Tower at the top, high moor behind. On clear days the view stretches into the Bergisches Land. If not, it reaches the next bench — also fine.",
      nl: "Een half uur van het huis. Boven de toren, daarachter het hoogveen. Bij heldere lucht reikt het uitzicht tot in het Bergisches Land. Zo niet, dan tot de volgende bank — ook prima.",
    },
  },
  {
    photo: "/media/photos/projektfahrten/broetchen_holen.png",
    alt: "Brötchen holen am Sonntagmorgen",
    eyebrow: { de: "Sonntag · 11 Uhr", en: "Sunday · 11 AM", nl: "Zondag · 11:00" },
    title: {
      de: "Brötchen vom Bäcker, Kaffee, niemand hat es eilig.",
      en: "Rolls from the baker, coffee, nobody is in a hurry.",
      nl: "Broodjes van de bakker, koffie, niemand heeft haast.",
    },
    body: {
      de: "Einer ist morgens hochgefahren, hat Brötchen geholt. Auf dem Tisch ist alles: Butter, Marmelade aus dem Hofladen, die Eier vom Bauern nebenan. Die Abreise ist noch um vier — bis dahin macht keiner einen Plan.",
      en: "Someone drove up in the morning, got the rolls. Everything's on the table: butter, jam from the farm shop, eggs from next door. Check-out is at four — until then nobody's making a plan.",
      nl: "Iemand reed 's ochtends omhoog, haalde de broodjes. Alles staat op tafel: boter, jam van de boerderijwinkel, eieren van de buren. Vertrek pas om vier uur — tot dan maakt niemand een plan.",
    },
  },
];

const STORY_COPY: Record<Locale, { eyebrow: string; h2: string; lead: string }> = {
  de: {
    eyebrow: "Ein Wochenende",
    h2: "So klingt das hier.",
    lead: "Nicht jede Hütte ist gleich. Hier ein Wochenende, wie's wirklich passiert — Freitag bis Sonntag, ohne Inszenierung.",
  },
  en: {
    eyebrow: "One weekend",
    h2: "This is how it sounds.",
    lead: "Not every cabin is the same. Here's how a weekend actually plays out — Friday to Sunday, no staging.",
  },
  nl: {
    eyebrow: "Eén weekend",
    h2: "Zo klinkt het hier.",
    lead: "Niet elke hut is gelijk. Hier is hoe een weekend echt verloopt — vrijdag tot zondag, zonder regie.",
  },
};

export function ScrollStory({ locale }: { locale: Locale }) {
  const c = STORY_COPY[locale];
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeBeat, setActiveBeat] = useState(0);

  // Beim Scrollen schauen wir welcher Beat aktuell am naehesten am Viewport-
  // Center ist. Triggert dann das Cross-Fade.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const beatEls = container.querySelectorAll<HTMLDivElement>("[data-beat]");
    if (beatEls.length === 0) return;

    const onScroll = () => {
      const viewportCenter = window.innerHeight / 2;
      let bestIdx = 0;
      let bestDist = Infinity;
      beatEls.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const dist = Math.abs(center - viewportCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });
      setActiveBeat(bestIdx);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] px-6 sm:px-8 py-20 sm:py-28">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12 sm:mb-20">
          <div className="md:col-span-5">
            <div className="text-[11px] uppercase tracking-[0.3em] font-semibold text-[var(--color-wh-snow)]/70 mb-4">
              {c.eyebrow}
            </div>
            <h2
              className="font-display font-bold m-0 leading-[1.02] text-[var(--color-wh-snow)]"
              style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-0.02em" }}
            >
              {c.h2}
            </h2>
          </div>
          <div className="md:col-span-7 md:pt-3">
            <p className="text-base sm:text-[18px] leading-[1.7] text-[var(--color-wh-snow)]/80 m-0 max-w-2xl">
              {c.lead}
            </p>
          </div>
        </div>

        {/* DESKTOP: Sticky-Bild links, scrollender Text rechts */}
        <div ref={containerRef} className="hidden md:grid md:grid-cols-12 md:gap-10">
          {/* Sticky-Bildstack */}
          <div className="md:col-span-6 lg:col-span-7 relative">
            <div className="sticky top-24 aspect-[4/5] rounded-3xl overflow-hidden bg-black/40 border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.4)]">
              {BEATS.map((b, i) => (
                <div
                  key={b.photo}
                  className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                  style={{ opacity: i === activeBeat ? 1 : 0 }}
                >
                  <Image
                    src={b.photo}
                    alt={b.alt}
                    fill
                    sizes="(min-width: 1280px) 700px, 50vw"
                    className="object-cover"
                  />
                  {/* Subtiler Dark-Tint fuer text-contrast falls man Text drueberlegt */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)",
                    }}
                    aria-hidden
                  />
                </div>
              ))}
              {/* Beat-Counter unten links */}
              <div className="absolute bottom-5 left-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white/90 text-[11px] font-semibold uppercase tracking-wider">
                <span className="tabular-nums">
                  {String(activeBeat + 1).padStart(2, "0")} / {String(BEATS.length).padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>

          {/* Scrollender Text */}
          <div className="md:col-span-6 lg:col-span-5 space-y-[18vh]">
            {BEATS.map((b, i) => (
              <div
                key={b.photo + "-text"}
                data-beat={i}
                className={`transition-opacity duration-500 ${
                  i === activeBeat ? "opacity-100" : "opacity-40"
                }`}
              >
                <div className="text-[11px] uppercase tracking-[0.3em] font-bold text-[var(--color-wh-sunset)] mb-3">
                  {b.eyebrow[locale]}
                </div>
                <h3
                  className="font-display font-bold text-[var(--color-wh-snow)] m-0 mb-4 leading-tight"
                  style={{ fontSize: "clamp(24px, 2.4vw, 34px)", letterSpacing: "-0.015em" }}
                >
                  {b.title[locale]}
                </h3>
                <p className="text-[15px] sm:text-base leading-relaxed text-[var(--color-wh-snow)]/85 m-0">
                  {b.body[locale]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* MOBILE: inline alternierend */}
        <div className="md:hidden space-y-12">
          {BEATS.map((b) => (
            <article key={b.photo} className="space-y-4">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-black/40 border border-white/10 relative">
                <Image src={b.photo} alt={b.alt} fill sizes="100vw" className="object-cover" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-[var(--color-wh-sunset)] mb-2">
                  {b.eyebrow[locale]}
                </div>
                <h3
                  className="font-display font-bold text-[var(--color-wh-snow)] m-0 mb-3 leading-tight"
                  style={{ fontSize: "clamp(20px, 3.5vw, 26px)" }}
                >
                  {b.title[locale]}
                </h3>
                <p className="text-[14px] leading-relaxed text-[var(--color-wh-snow)]/85 m-0">
                  {b.body[locale]}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
