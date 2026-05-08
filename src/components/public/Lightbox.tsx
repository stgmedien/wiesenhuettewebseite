"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";

export type LightboxImage = { src: string; alt: string };

type Props = {
  images: LightboxImage[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
};

/**
 * Vollbild-Lightbox mit Carousel-Funktionalität:
 * - Pfeil-Tasten + Klick auf prev/next
 * - ESC schließt
 * - Touch-Swipe (40px Threshold)
 * - Klick außerhalb des Bildes schließt
 * - Body-Scroll-Lock während offen
 * - Animation: Fade-In + Scale beim Bildwechsel
 */
export function Lightbox({ images, index, onClose, onIndexChange }: Props) {
  const total = images.length;
  const touchStartX = useRef<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const goPrev = useCallback(() => {
    setIsAnimating(true);
    onIndexChange((index - 1 + total) % total);
  }, [index, total, onIndexChange]);

  const goNext = useCallback(() => {
    setIsAnimating(true);
    onIndexChange((index + 1) % total);
  }, [index, total, onIndexChange]);

  // ESC + Pfeiltasten
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goPrev, goNext]);

  // Body-Scroll-Lock
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Animation reset
  useEffect(() => {
    if (!isAnimating) return;
    const t = setTimeout(() => setIsAnimating(false), 220);
    return () => clearTimeout(t);
  }, [isAnimating]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx > 0) goPrev();
      else goNext();
    }
    touchStartX.current = null;
  };

  const current = images[index];
  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Bild ${index + 1} von ${total}`}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-[fadeIn_180ms_ease-out]"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Schließen-Button */}
      <button
        type="button"
        aria-label="Schließen"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white text-2xl flex items-center justify-center transition-colors z-10"
      >
        ✕
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur text-white text-xs font-mono z-10">
        {index + 1} / {total}
      </div>

      {/* Prev */}
      {total > 1 && (
        <button
          type="button"
          aria-label="Vorheriges Bild"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-2 sm:left-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white text-2xl flex items-center justify-center transition-colors z-10"
        >
          ‹
        </button>
      )}

      {/* Bild-Container */}
      <div
        className="relative w-full h-full max-w-[92vw] max-h-[88vh] flex items-center justify-center px-4 sm:px-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          key={current.src}
          className={`relative w-full h-full transition-all duration-200 ${
            isAnimating ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"
          }`}
        >
          <Image
            src={current.src}
            alt={current.alt}
            fill
            sizes="92vw"
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Next */}
      {total > 1 && (
        <button
          type="button"
          aria-label="Nächstes Bild"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-2 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white text-2xl flex items-center justify-center transition-colors z-10"
        >
          ›
        </button>
      )}

      {/* Caption + Dots */}
      <div className="absolute inset-x-0 bottom-0 px-4 pb-5 sm:pb-7 z-10" onClick={(e) => e.stopPropagation()}>
        {current.alt && (
          <p className="text-center text-white/85 text-[13px] sm:text-sm max-w-2xl mx-auto mb-3 px-2">
            {current.alt}
          </p>
        )}
        {total > 1 && total <= 16 && (
          <div className="flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Zu Bild ${i + 1}`}
                onClick={() => {
                  setIsAnimating(true);
                  onIndexChange(i);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
