import { Mountain, CalendarDays, Tag, Sparkles } from "lucide-react";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";
import { NewsletterForm } from "@/components/public/NewsletterForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Newsletter · Wiesenhütte",
  description:
    "Hütten-Neuigkeiten, Termine und Tipps aus dem Hochsauerland — ein paar Mal im Jahr in Dein Postfach.",
};

const COPY: Record<Locale, {
  eyebrow: string;
  h1: string;
  lead: string;
  perks: { icon: "cal" | "tag" | "spark"; text: string }[];
}> = {
  de: {
    eyebrow: "Bleib in Verbindung",
    h1: "Der Wiesenhütten-Newsletter.",
    lead: "Ein paar Mal im Jahr schreiben wir, was an der Hütte und im Verein passiert — und was Du nicht verpassen solltest. Kein Spam, jederzeit abbestellbar.",
    perks: [
      { icon: "cal", text: "Termine: Vereinsfahrten, Grünkohlwanderung, Adventskaffee" },
      { icon: "spark", text: "Hütten-Neuigkeiten und Projekte wie das Zeltpodest" },
      { icon: "tag", text: "Tipps für die Region und gelegentliche Aktionen" },
    ],
  },
  en: {
    eyebrow: "Stay in touch",
    h1: "The Wiesenhütte newsletter.",
    lead: "A few times a year we share what's happening at the cabin and in the club — and what you shouldn't miss. No spam, unsubscribe any time.",
    perks: [
      { icon: "cal", text: "Dates: club trips, the kale hike, advent coffee" },
      { icon: "spark", text: "Cabin news and projects like the tent deck" },
      { icon: "tag", text: "Tips for the region and the occasional offer" },
    ],
  },
  nl: {
    eyebrow: "Blijf op de hoogte",
    h1: "De Wiesenhütte-nieuwsbrief.",
    lead: "Een paar keer per jaar schrijven we wat er bij de hut en in de vereniging gebeurt — en wat je niet mag missen. Geen spam, altijd afmeldbaar.",
    perks: [
      { icon: "cal", text: "Data: verenigingsreizen, Grünkohl-wandeling, adventkoffie" },
      { icon: "spark", text: "Hutnieuws en projecten zoals de tentvlonder" },
      { icon: "tag", text: "Tips voor de regio en af en toe een actie" },
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
