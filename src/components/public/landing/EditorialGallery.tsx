import Image from "next/image";
import type { Locale } from "@/lib/i18n-shared";
import { BENTO_TILES, GALLERY_COPY, type GalleryTile } from "@/lib/landing-photos";
import { ScrollReveal } from "@/components/public/ScrollReveal";

/**
 * Editorial Bento-Galerie. Asymmetrisches Grid via grid-template-areas,
 * KEINE randomized Heights — wirkt sonst chaotisch. Hover zeigt Caption-Overlay.
 *
 * Layout (Desktop): 4 Spalten, ~5 Reihen
 *
 *   F F F A           feature feature feature atmos
 *   F F F A           feature feature feature atmos
 *   W W P A           wide    wide    portrait atmos
 *   W W P S           wide    wide    portrait square
 *   1 2 3 4           small-1 small-2 small-3  small-4
 *
 * Mobile: 1-2 Spalten, jedes Tile eigene Reihe.
 */

/**
 * Desktop nutzt ein 12-Spalten-Grid, jedes Tile bekommt col-span:
 *   Row 1: feature (8) + atmos (4)
 *   Row 2: wide (6) + portrait (3) + square (3)
 *   Row 3: small-1..4 (3 + 3 + 3 + 3)
 *
 * Mobile: 2-Spalten-Grid, feature spannt beide, rest fließt 2/Reihe.
 */
const AREA_CLASSES: Record<GalleryTile["area"], string> = {
  feature: "col-span-2 md:col-span-8 aspect-[16/10]",
  atmos: "md:col-span-4 aspect-[4/5]",
  wide: "md:col-span-6 aspect-[16/9]",
  portrait: "md:col-span-3 aspect-[3/4]",
  square: "md:col-span-3 aspect-square",
  "small-1": "md:col-span-3 aspect-square",
  "small-2": "md:col-span-3 aspect-square",
  "small-3": "md:col-span-3 aspect-square",
  "small-4": "md:col-span-3 aspect-square",
};

export function EditorialGallery({ locale }: { locale: Locale }) {
  const c = GALLERY_COPY[locale];

  return (
    <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-20 sm:py-28">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10 sm:mb-14">
            <div className="md:col-span-5">
              <div className="eyebrow mb-3 text-[var(--color-wh-deep-green)]">{c.eyebrow}</div>
              <h2
                className="font-display font-bold text-[var(--color-wh-deep-green)] m-0 leading-[1.02]"
                style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-0.02em" }}
              >
                {c.h2}
              </h2>
            </div>
            <div className="md:col-span-7 md:pt-3">
              <p className="text-base sm:text-[18px] leading-[1.7] text-[var(--color-wh-black)] m-0 max-w-2xl">
                {c.lead}
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Bento Grid — 12-Spalten Desktop / 2-Spalten Mobile */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-12 [grid-auto-flow:dense]">
          {BENTO_TILES.map((tile, i) => (
            <ScrollReveal
              key={tile.src}
              delay={i * 60}
              as="figure"
              className={`group relative overflow-hidden rounded-2xl bg-[var(--color-wh-beige)] m-0 ${AREA_CLASSES[tile.area]}`}
            >
              <BentoTile tile={tile} locale={locale} priority={i < 2} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const BentoTile = ({
  tile,
  locale,
  priority,
}: {
  tile: GalleryTile;
  locale: Locale;
  priority: boolean;
}) => {
  const cap = tile.caption[locale];
  return (
    <>
      <Image
        src={tile.src}
        alt={tile.alt}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        priority={priority}
      />
      {/* Caption-Overlay (immer leicht sichtbar unten, voll bei Hover) */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-end">
        <div
          className="p-3 sm:p-4 transition-all duration-300"
          style={{
            background:
              "linear-gradient(to top, rgba(17,17,17,0.65) 0%, rgba(17,17,17,0.0) 80%)",
          }}
        >
          <figcaption className="text-[var(--color-wh-snow)] m-0">
            <div className="text-[13px] sm:text-[14px] font-semibold leading-tight">
              {cap.lead}
            </div>
            {cap.sub && (
              <div className="text-[10px] sm:text-[11px] opacity-0 group-hover:opacity-90 transition-opacity duration-300 mt-1">
                {cap.sub}
              </div>
            )}
          </figcaption>
        </div>
      </div>
    </>
  );
};
