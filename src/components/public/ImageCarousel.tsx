"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CarouselImage = { src: string; alt: string };

export function ImageCarousel({
  images,
  intervalMs = 5000,
  aspectClass = "aspect-[4/3]",
  rounded = "rounded-[var(--radius-card)]",
}: {
  images: CarouselImage[];
  intervalMs?: number;
  aspectClass?: string;
  rounded?: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    if (paused || images.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [paused, intervalMs, images.length]);

  if (images.length === 0) return null;

  const goto = (i: number) =>
    setIndex(((i % images.length) + images.length) % images.length);

  return (
    <div
      className={`relative w-full ${aspectClass} ${rounded} overflow-hidden bg-[var(--color-wh-beige)] group`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStart.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 40) goto(dx < 0 ? index + 1 : index - 1);
        touchStart.current = null;
      }}
    >
      {images.map((img, i) => (
        <div
          key={img.src}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === index ? 1 : 0 }}
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
            priority={i === 0}
          />
        </div>
      ))}

      {/* Prev / Next */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Vorheriges Bild"
            onClick={() => goto(index - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-[var(--color-wh-deep-green)] flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition focus:opacity-100"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Nächstes Bild"
            onClick={() => goto(index + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-[var(--color-wh-deep-green)] flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition focus:opacity-100"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Bild ${i + 1}`}
                onClick={() => goto(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index
                    ? "w-6 bg-white"
                    : "w-2 bg-white/60 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
