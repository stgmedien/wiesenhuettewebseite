"use client";

import Image from "next/image";
import { useState } from "react";
import { PhotoGallery } from "@/components/public/PhotoGallery";

const ROTATIONS = [-3.5, 2, -1.5, 3, -0.5];
const OFFSETS = [
  { x: -22, y: 5 },
  { x: -8, y: -7 },
  { x: 7, y: 9 },
  { x: 20, y: -4 },
  { x: 0, y: 0 },
];

export function BilderStapel({
  images,
  gridClassName,
  sizes,
}: {
  images: { src: string; alt: string }[];
  gridClassName: string;
  sizes: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (expanded) {
    return (
      <div className="mb-8">
        <button
          onClick={() => setExpanded(false)}
          className="text-[13px] text-[var(--color-wh-fg-muted)] mb-4 underline underline-offset-2 hover:no-underline block"
        >
          ← Stapelansicht
        </button>
        <PhotoGallery images={images} gridClassName={gridClassName} sizes={sizes} />
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div
        className="relative mx-auto cursor-pointer"
        style={{ height: "300px", maxWidth: "460px" }}
        onClick={() => setExpanded(true)}
        role="button"
        aria-label={`${images.length} Fotos ansehen`}
      >
        {images.slice(0, 5).map((img, i) => (
          <div
            key={img.src}
            className="absolute inset-10 bg-white border border-[var(--color-wh-winter-grey)] rounded-sm p-2"
            style={{
              transform: `rotate(${ROTATIONS[i]}deg) translate(${OFFSETS[i].x}px, ${OFFSETS[i].y}px)`,
              zIndex: i + 1,
            }}
          >
            <div className="relative w-full h-full">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="460px"
              />
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => setExpanded(true)}
        className="block mx-auto mt-4 text-[13px] text-[var(--color-wh-fg-muted)] underline underline-offset-2 hover:no-underline"
      >
        Alle {images.length} Fotos ansehen →
      </button>
    </div>
  );
}
