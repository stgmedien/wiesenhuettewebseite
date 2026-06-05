import { FileText, Download, ExternalLink, Clock } from "lucide-react";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

export const metadata = {
  title: "Downloads · Wiesenhütte",
  description:
    "Anleitungen, Formulare und Unterlagen rund um Eure Hüttenfahrt zur Wiesenhütte — zum Ansehen und Ausdrucken.",
};

type DownloadItem = {
  category: string;
  title: string;
  desc: string;
  meta: string;
  file: string;
};

type Copy = {
  eyebrow: string;
  h1: string;
  lead: string;
  sectionTitle: string;
  items: DownloadItem[];
  download: string;
  view: string;
  soonTitle: string;
  soon: string[];
};

const PDF_MITGLIEDSCHAFT = "/downloads/anleitung-mitgliedschaft.pdf";

const COPY: Record<Locale, Copy> = {
  de: {
    eyebrow: "Service · Downloads",
    h1: "Downloads",
    lead: "Anleitungen, Formulare und Unterlagen rund um Eure Hüttenfahrt — zum Ansehen und Ausdrucken.",
    sectionTitle: "Anleitungen & Unterlagen",
    items: [
      {
        category: "Anleitung",
        title: "Mitgliedschaft beantragen — Kurzanleitung",
        desc: "In 3 Schritten zur Vereinsmitgliedschaft beim ersten Buchen über wiesenhütte.com — inkl. 50 % Mitglieder-Rabatt. Mit Screenshots.",
        meta: "PDF · 2 Seiten · ca. 0,3 MB",
        file: PDF_MITGLIEDSCHAFT,
      },
    ],
    download: "Herunterladen",
    view: "Ansehen",
    soonTitle: "In Vorbereitung",
    soon: [
      "Preisliste 2026 (PDF)",
      "Hausordnung zum Ausdrucken (PDF)",
      "Anfahrt & Lageplan (PDF)",
    ],
  },
  en: {
    eyebrow: "Service · Downloads",
    h1: "Downloads",
    lead: "Guides, forms and documents for your stay at the Wiesenhütte — to view and print.",
    sectionTitle: "Guides & documents",
    items: [
      {
        category: "Guide",
        title: "Applying for membership — quick guide",
        desc: "Become a club member in 3 steps when booking via wiesenhütte.com — including the 50 % member discount. With screenshots.",
        meta: "PDF · 2 pages · approx. 0.3 MB",
        file: PDF_MITGLIEDSCHAFT,
      },
    ],
    download: "Download",
    view: "View",
    soonTitle: "Coming soon",
    soon: [
      "Price list 2026 (PDF)",
      "House rules for printing (PDF)",
      "Directions & site plan (PDF)",
    ],
  },
  nl: {
    eyebrow: "Service · Downloads",
    h1: "Downloads",
    lead: "Handleidingen, formulieren en documenten voor jullie verblijf in de Wiesenhütte — om te bekijken en af te drukken.",
    sectionTitle: "Handleidingen & documenten",
    items: [
      {
        category: "Handleiding",
        title: "Lidmaatschap aanvragen — korte handleiding",
        desc: "In 3 stappen lid worden bij het eerste boeken via wiesenhütte.com — inclusief 50 % ledenkorting. Met screenshots.",
        meta: "PDF · 2 pagina's · ca. 0,3 MB",
        file: PDF_MITGLIEDSCHAFT,
      },
    ],
    download: "Downloaden",
    view: "Bekijken",
    soonTitle: "In voorbereiding",
    soon: [
      "Prijslijst 2026 (PDF)",
      "Huisregels om af te drukken (PDF)",
      "Routebeschrijving & plattegrond (PDF)",
    ],
  },
};

export default async function DownloadsPage() {
  const locale = await getServerLocale();
  const c = COPY[locale];

  return (
    <div className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-16 sm:py-24">
      <div className="max-w-[920px] mx-auto">
        <div className="eyebrow">{c.eyebrow}</div>
        <h1 className="text-[40px] sm:text-[56px] mt-4 mb-3 leading-tight">{c.h1}</h1>
        <p className="text-base sm:text-[18px] leading-relaxed text-[var(--color-wh-fg-muted)] max-w-2xl m-0">
          {c.lead}
        </p>

        <h2 className="text-[22px] sm:text-[26px] mt-12 mb-5">{c.sectionTitle}</h2>
        <div className="grid grid-cols-1 gap-4">
          {c.items.map((item) => (
            <div
              key={item.title}
              className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5"
            >
              <div className="shrink-0 w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-wh-deep-green)]/10 text-[var(--color-wh-deep-green)] flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-[var(--color-wh-deep-green)]/80 mb-1">
                  {item.category}
                </div>
                <h3 className="font-display font-bold text-[19px] sm:text-[20px] text-[var(--color-wh-deep-green)] m-0 mb-1.5 leading-tight">
                  {item.title}
                </h3>
                <p className="text-[14px] leading-relaxed text-[var(--color-wh-black)] m-0 mb-2">
                  {item.desc}
                </p>
                <div className="text-xs text-[var(--color-wh-fg-muted)]">{item.meta}</div>
              </div>
              <div className="shrink-0 flex sm:flex-col gap-2">
                <a
                  href={item.file}
                  download
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] no-underline font-semibold text-sm hover:bg-[var(--color-wh-green)] transition-colors"
                >
                  <Download size={16} /> {c.download}
                </a>
                <a
                  href={item.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[var(--radius-btn)] border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] no-underline font-semibold text-sm hover:bg-[var(--color-wh-beige)] transition-colors"
                >
                  <ExternalLink size={16} /> {c.view}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* In Vorbereitung — signalisiert, dass weitere Unterlagen folgen */}
        <div className="mt-12 rounded-[var(--radius-card)] border border-dashed border-[var(--color-wh-winter-grey)] bg-[var(--color-wh-beige)]/40 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[var(--color-wh-fg-muted)] mb-3">
            <Clock size={16} />
            <span className="text-xs uppercase tracking-[0.16em] font-bold">{c.soonTitle}</span>
          </div>
          <ul className="m-0 p-0 list-none grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {c.soon.map((s) => (
              <li
                key={s}
                className="text-sm text-[var(--color-wh-fg-muted)] flex items-center gap-2.5"
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-wh-winter-grey)]" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
