import { Mountain, CalendarDays, Megaphone, Users } from "lucide-react";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";
import { NewsletterForm } from "@/components/public/NewsletterForm";
import { subscribeMemberNewsletter } from "../newsletter/actions";

export const dynamic = "force-dynamic";

// Versteckte Seite: nicht in Navigation/Sitemap, zusätzlich noindex/nofollow —
// nur über den direkt geteilten Link erreichbar (für bestehende Mitglieder).
export const metadata = {
  title: "Mitglieder-Newsletter · Wiesenhütte",
  description: "Anmeldung zum Mitglieder-Newsletter der Skifreunde Gütersloh e.V.",
  robots: { index: false, follow: false },
};

const COPY: Record<
  Locale,
  {
    eyebrow: string;
    h1: string;
    lead: string;
    formSub: string;
    perks: { icon: "cal" | "mega" | "users"; text: string }[];
  }
> = {
  de: {
    eyebrow: "Nur für Mitglieder",
    h1: "Der Mitglieder-Newsletter.",
    lead: "Vereins-Interna, Termine und Neuigkeiten zuerst — exklusiv für Mitglieder der Skifreunde Gütersloh. Trag Dich hier mit Deiner E-Mail ein; Du bekommst eine kurze Bestätigungsmail, dann bist Du dabei.",
    formSub: "Exklusiv für Mitglieder. Kein Spam, jederzeit abbestellbar.",
    perks: [
      { icon: "mega", text: "Vereins-Interna und Beschlüsse, bevor sie überall stehen" },
      { icon: "cal", text: "Termine zuerst: Mitgliederversammlung, Arbeitseinsätze, Fahrten" },
      { icon: "users", text: "Mitmach-Aufrufe, Hütten-Projekte und Mitglieder-Aktionen" },
    ],
  },
  en: {
    eyebrow: "Members only",
    h1: "The members' newsletter.",
    lead: "Club insights, dates and news first — exclusively for members of Skifreunde Gütersloh. Enter your email here; you'll get a short confirmation mail, then you're in.",
    formSub: "Members only. No spam, unsubscribe any time.",
    perks: [
      { icon: "mega", text: "Club insights and decisions before they're public" },
      { icon: "cal", text: "Dates first: general meeting, work days, trips" },
      { icon: "users", text: "Calls to join in, cabin projects and member actions" },
    ],
  },
  nl: {
    eyebrow: "Alleen voor leden",
    h1: "De ledennieuwsbrief.",
    lead: "Verenigingsnieuws, data en updates als eerste — exclusief voor leden van Skifreunde Gütersloh. Vul hier je e-mail in; je krijgt een korte bevestigingsmail, dan doe je mee.",
    formSub: "Alleen voor leden. Geen spam, altijd afmeldbaar.",
    perks: [
      { icon: "mega", text: "Verenigingsnieuws en besluiten vóór ze openbaar zijn" },
      { icon: "cal", text: "Data als eerste: ledenvergadering, werkdagen, reizen" },
      { icon: "users", text: "Oproepen om mee te doen, hutprojecten en ledenacties" },
    ],
  },
};

const ICONS = { cal: CalendarDays, mega: Megaphone, users: Users } as const;

export default async function MemberNewsletterPage() {
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
            <NewsletterForm
              locale={locale}
              variant="page"
              action={subscribeMemberNewsletter}
              subOverride={c.formSub}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
