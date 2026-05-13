import Image from "next/image";
import { PhotoGallery } from "./PhotoGallery";

export type CommunityEntryView = {
  id: string;
  authorName: string;
  authorContext: string | null;
  title: string | null;
  body: string;
  photoUrls: string[];
  visitDate: string | null;
  submittedAt: Date;
};

function formatGermanDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
  });
}

/**
 * Eine einzelne approved Community-Entry-Karte. Layout angelehnt an
 * Projekttagebuch-Stil — Avatar (Initialen) + Meta + Body + Photos via Lightbox.
 */
export function CommunityEntryCard({ entry }: { entry: CommunityEntryView }) {
  const initials = entry.authorName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const photoImages = entry.photoUrls.map((url, i) => ({
    src: url,
    alt: `Photo ${i + 1} von ${entry.authorName}`,
  }));

  return (
    <article className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 sm:p-7">
      <header className="flex items-start gap-3 mb-4">
        <div
          aria-hidden
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[var(--color-wh-deep-green)] to-[var(--color-wh-deep-green)]/70 text-white flex items-center justify-center font-display font-bold text-[14px] sm:text-[15px] shadow-sm shrink-0"
        >
          {initials || "WH"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 font-semibold text-[15px] sm:text-[16px] text-[var(--color-wh-deep-green)] leading-tight">
            {entry.authorName}
          </p>
          {entry.authorContext && (
            <p className="m-0 text-[12px] sm:text-[13px] text-[var(--color-wh-fg-muted)]">
              {entry.authorContext}
            </p>
          )}
          <p className="m-0 text-[11px] text-[var(--color-wh-fg-muted)] mt-0.5">
            {entry.visitDate
              ? `Aufenthalt: ${formatGermanDate(entry.visitDate)}`
              : `eingereicht: ${formatGermanDate(entry.submittedAt)}`}
          </p>
        </div>
      </header>

      {entry.title && (
        <h3 className="font-display font-bold text-[20px] sm:text-[22px] text-[var(--color-wh-deep-green)] m-0 mb-3 leading-tight">
          {entry.title}
        </h3>
      )}

      <div className="prose-block text-[15px] sm:text-[16px] leading-relaxed whitespace-pre-wrap">
        {entry.body}
      </div>

      {photoImages.length > 0 && (
        <div className="mt-5">
          {photoImages.length === 1 ? (
            // Einzel-Photo: gross dargestellt, immer noch klickbar via Lightbox-Wrapper
            <PhotoGallery
              images={photoImages}
              gridClassName="grid-cols-1"
              itemAspectClassName="aspect-[3/2]"
              sizes="(min-width: 768px) 640px, 90vw"
            />
          ) : (
            <PhotoGallery
              images={photoImages}
              gridClassName={
                photoImages.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-2 sm:grid-cols-3"
              }
              sizes="(min-width: 640px) 200px, 45vw"
            />
          )}
        </div>
      )}
    </article>
  );
}

/**
 * Sticker-Variante mit "Initial-Photo" für kompakte Card-Layouts
 * (kommt in Hero-Carousels in Frage)
 */
export function CommunityEntryThumb({ entry }: { entry: CommunityEntryView }) {
  const cover = entry.photoUrls[0];
  return (
    <div className="flex gap-3 items-start bg-white border border-[var(--color-wh-winter-grey)]/50 rounded-[var(--radius-md)] p-4">
      {cover && (
        <div className="relative w-16 h-16 rounded-md overflow-hidden bg-[var(--color-wh-beige)] shrink-0">
          <Image
            src={cover}
            alt=""
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      )}
      <div className="min-w-0">
        <p className="m-0 text-[13px] font-semibold text-[var(--color-wh-deep-green)] leading-tight">
          {entry.authorName}
        </p>
        {entry.authorContext && (
          <p className="m-0 text-[11px] text-[var(--color-wh-fg-muted)] leading-tight">
            {entry.authorContext}
          </p>
        )}
        <p className="m-0 text-[12px] mt-1 line-clamp-2 text-[var(--color-wh-black)]">
          {entry.body}
        </p>
      </div>
    </div>
  );
}
