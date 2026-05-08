"use client";

import { useState } from "react";
import Image from "next/image";
import { Lightbox, type LightboxImage } from "./Lightbox";

type Props = {
  images: LightboxImage[];
  /**
   * Tailwind-Grid-Klassen, z.B. "grid-cols-2 sm:grid-cols-4".
   * Default: 2 Spalten auf Mobile, 4 ab sm.
   */
  gridClassName?: string;
  /** Tailwind-Klassen für Aspekt-Ratio jedes Thumbs. Default: aspect-square. */
  itemAspectClassName?: string;
  /** Optional: Sizes für next/image. */
  sizes?: string;
};

/**
 * Klickbare Bild-Galerie mit Vollbild-Lightbox.
 *
 * Thumbnail-Grid mit Hover-Zoom + Klick öffnet die Lightbox bei dem
 * jeweiligen Bild. In der Lightbox kann man dann durch alle Bilder
 * der Galerie navigieren (Pfeile, Swipe, Pfeiltasten, Dots).
 */
export function PhotoGallery({
  images,
  gridClassName = "grid-cols-2 sm:grid-cols-4",
  itemAspectClassName = "aspect-square",
  sizes = "(min-width: 640px) 250px, 50vw",
}: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <>
      <div className={`grid ${gridClassName} gap-2 sm:gap-3`}>
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            onClick={() => setOpenIdx(i)}
            aria-label={`Bild ${i + 1} von ${images.length} öffnen: ${img.alt}`}
            className={`group relative ${itemAspectClassName} rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-wh-beige)] cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-[var(--color-wh-deep-green)] focus:ring-offset-2`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes={sizes}
            />
            {/* Hover-Overlay mit Zoom-Icon */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-10 h-10 rounded-full bg-white/90 backdrop-blur text-[var(--color-wh-deep-green)] text-lg flex items-center justify-center shadow-lg">
                ⤢
              </span>
            </div>
          </button>
        ))}
      </div>

      {openIdx !== null && (
        <Lightbox
          images={images}
          index={openIdx}
          onClose={() => setOpenIdx(null)}
          onIndexChange={setOpenIdx}
        />
      )}
    </>
  );
}
