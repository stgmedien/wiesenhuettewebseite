import { Mountain, CalendarDays, Tag, Sparkles } from "lucide-react";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";
import { NewsletterForm } from "@/components/public/NewsletterForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Newsletter · Wiesenhütte",
  description:
    "Vereinsleben und Hütten-Neuigkeiten der Skifreunde Gütersloh — Termine, Aktionen und was an der Wiesenhütte passiert. Ein paar Mal im Jahr, kein Spam.",
};

const COPY: Record<Locale, {
  eyebrow: string;
  h1: string;
  lead: string;
  perks: { icon: "cal" | "tag" | "spark"; text: string }[];
}> = {
  de: {
    eyebrow: "Vereinsleben & Wiesenhütte",
    h1: "Was bei uns passiert — im Verein und an der Hütte.",
    lead: "Ein paar Mal im Jahr schreiben wir, was die Skifreunde Gütersloh bewegt: Vereinsaktivitäten, Termine, Neuigkeiten aus Langewiese und was an der Hütte passiert. Kein Spam, jederzeit abbestellbar.",
    perks: [
      { icon: "cal", text: "Vereinstermine: Skigymnastik, Grünkohlwanderung, Adventskaffee, Vereinsfahrten" },
      { icon: "spark", text: "Hütten-Neuigkeiten: Projekte, Renovierungen, neue Angebote" },
      { icon: "tag", text: "Tipps für die Region rund um Langewiese und gelegentliche Aktionen" },
    ],
  },
  en: {
    eyebrow: "Club life & Wiesenhütte",
    h1: "What's happening — in the club and at the cabin.",
    lead: "A few times a year we share what's moving the Skifreunde Gütersloh: club activities, dates, news from Langewiese and what's happening at the cabin. No spam, unsubscribe any time.",
    perks: [
      { icon: "cal", text: "Club dates: ski fitness, kale hike, advent coffee, club trips" },
      { icon: "spark", text: "Cabin news: projects, renovations, new offerings" },
      { icon: "tag", text: "Tips for the Langewiese region and the occasional offer" },
    ],
  },
  nl: {
    eyebrow: "Verenigingsleven & Wiesenhütte",
    h1: "Wat er bij ons speelt — in de vereniging en bij de hut.",
    lead: "Een paar keer per jaar schrijven we wat de Skifreunde Gütersloh bezighoudt: verenigingsactiviteiten, data, nieuws uit Langewiese en wat er bij de hut gebeurt. Geen spam, altijd afmeldbaar.",
    perks: [
      { icon: "cal", text: "Verenigingsdata: skigymnastiek, Grünkohl-wandeling, adventkoffie, verenigingsreizen" },
      { icon: "spark", text: "Hutnieuws: projecten, renovaties, nieuwe aanbiedingen" },
      { icon: "tag", text: "Tips voor de regio rond Langewiese en af en toe een actie" },
    ],
  },
};

const ICONS = { cal: CalendarDays, tag: Tag, spark: Sparkles } as const;

export default async function NewsletterPage() {
  const locale = await getServerLocale();
  const c = COPY[locale];

  return (
    <div className="bg-[var(--color-wh-snow)]">
      <section className="px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold text-[var(--color-wh-deep-green)]">
              <Mountain size={15} aria-hidden />
              {c.eyebrow}
            </div>
            <h1 className="text-[36px] sm:text-[52px] leading-[1.04] mt-4 mb-5">{c.h1}</h1>
            <p className="text-base sm:text-[17px] leading-relaxed text-[var(--color-wh-fg-muted)] max-w-xl m-0 mb-7">
              {c.lead}
            </p>
            <ul className="list-none p-0 m-0 space-y-3">
              {c.perks.map((p) => {
                const Icon = ICONS[p.icon];
                return (
                  <li key={p.text} className="flex items-start gap-3 text-[15px] text-[var(--color-wh-black)]">
                    <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-wh-green-soft)] text-[var(--color-wh-deep-green)]">
                      <Icon size={16} strokeWidth={1.8} aria-hidden />
                    </span>
                    <span className="pt-1">{p.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 sm:p-8 shadow-[0_16px_44px_rgba(47,74,53,0.08)]">
            <NewsletterForm locale={locale} variant="page" />
          </div>
        </div>
      </section>
    </div>
  );
}
