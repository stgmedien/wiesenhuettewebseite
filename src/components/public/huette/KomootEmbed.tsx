"use client";

import { ConsentGate } from "@/components/consent/ConsentGate";

export type KomootEmbedTexts = {
  openLabel: string;
};

// Bindet eine öffentliche komoot-Tour ein. Das iframe lädt erst, wenn die
// Kategorie „Komfort & Einbettungen" (functional) per ConsentGate freigegeben
// ist — dieselbe Mechanik wie für alle anderen Einbettungen der Seite.
export function KomootEmbed({
  tourId,
  title,
  meta,
  hl = "de",
  texts,
}: {
  tourId: string;
  title: string;
  meta: string;
  hl?: string;
  texts: KomootEmbedTexts;
}) {
  const tourUrl = `https://www.komoot.com/tour/${tourId}`;
  const embedUrl = `https://www.komoot.com/tour/${tourId}/embed?hl=${hl}&layout=classic&profile=1`;

  return (
    <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] overflow-hidden flex flex-col">
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
        className="m-0 rounded-none border-0 min-h-[300px]"
      >
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-[440px] border-0 block"
          loading="lazy"
        />
      </ConsentGate>
    </div>
  );
}
