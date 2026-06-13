"use client";

import { ConsentGate } from "@/components/consent/ConsentGate";

export type KomootEmbedTexts = {
  openLabel: string;
};

// Bindet eine öffentliche komoot-Tour über den offiziellen Embed-Code ein.
// Das iframe lädt erst, wenn die Kategorie „Komfort & Einbettungen" (functional)
// per ConsentGate freigegeben ist — erst dann werden Daten an komoot übertragen.
export function KomootEmbed({
  tourId,
  embedSrc,
  height = 640,
  title,
  meta,
  texts,
}: {
  tourId: string;
  embedSrc: string;
  height?: number;
  title: string;
  meta: string;
  texts: KomootEmbedTexts;
}) {
  const tourUrl = `https://www.komoot.com/tour/${tourId}`;

  return (
    <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] overflow-hidden flex flex-col h-full">
      <div className="p-5 flex items-start justify-between gap-4 border-b border-[var(--color-wh-winter-grey)]">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-[18px] text-[var(--color-wh-deep-green)] m-0 mb-1 leading-snug">
            {title}
          </h3>
          <p className="text-[13px] text-[var(--color-wh-fg-muted)] font-mono m-0">{meta}</p>
        </div>
        <a
          href={tourUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1 text-[13px] text-[var(--color-wh-deep-green)] font-semibold hover:underline whitespace-nowrap"
        >
          {texts.openLabel} ↗
        </a>
      </div>
      <ConsentGate
        category="functional"
        serviceName="komoot"
        serviceUrl="https://www.komoot.com/legal/privacy"
        className="m-0 rounded-none border-0 min-h-[300px] grow"
      >
        <iframe
          src={embedSrc}
          title={title}
          className="w-full border-0 block"
          style={{ height }}
          loading="lazy"
        />
      </ConsentGate>
    </div>
  );
}
