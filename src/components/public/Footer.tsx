import Link from "next/link";
import { Mountain } from "lucide-react";
import { CookieSettingsLink } from "@/components/consent/CookieBanner";
import { NewsletterForm } from "@/components/public/NewsletterForm";
import { t, type Locale } from "@/lib/i18n";

export const Footer = ({ locale }: { locale: Locale }) => (
  <footer className="bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] mt-auto">
    <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-14 sm:py-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
      <div className="lg:col-span-2">
        <div className="flex items-center gap-2.5 mb-4">
          <Mountain size={28} strokeWidth={1.6} className="text-[var(--color-wh-snow)]" />
          <span className="font-display text-xl font-bold tracking-tight text-[var(--color-wh-snow)]">
            Wiesenhütte
          </span>
        </div>
        <p className="text-[var(--color-wh-snow)]/80 max-w-md text-sm leading-relaxed m-0">
          Selbstversorgerhütte in Langewiese, Hochsauerland. Getragen vom Verein Skifreunde
          Gütersloh e.V. — gebaut, gepflegt und genutzt von Generationen.
        </p>

        <div className="mt-7 max-w-md">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-wh-snow)]/70">
            {t("footer.newsletter.heading", locale)}
          </span>
          <p className="text-[var(--color-wh-snow)]/70 text-[13px] leading-relaxed mt-1.5 mb-3">
            {t("footer.newsletter.sub", locale)}
          </p>
          <NewsletterForm locale={locale} variant="footer" />
        </div>
      </div>

      <nav className="text-sm flex flex-col gap-2 items-start">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-wh-snow)]/70 mb-2">
          {t("footer.huette.heading", locale)}
        </span>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/buchen">
          {t("nav.book", locale)}
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/huette">
          {t("footer.huette.ausstattung", locale)}
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/preise">
          {t("footer.huette.preise", locale)}
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/faq">
          {t("footer.huette.faq", locale)}
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/lage">
          {t("footer.huette.lage", locale)}
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/wandertouren">
          {t("footer.huette.wandertouren", locale)}
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/empfehlungen">
          {t("footer.huette.empfehlungen", locale)}
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/packliste">
          {t("footer.huette.packliste", locale)}
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/geschenk">
          {t("footer.huette.geschenk", locale)}
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/hausordnung">
          {t("footer.huette.hausordnung", locale)}
        </Link>
      </nav>

      <nav className="text-sm flex flex-col gap-2 items-start">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-wh-snow)]/70 mb-2">
          {t("footer.verein.heading", locale)}
        </span>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/verein">
          {t("footer.verein.skifreunde", locale)}
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/schulprojekt">
          {t("footer.verein.schulprojekt", locale)}
        </Link>
        {/* Radtouren bewusst hier unter „Verein" (nicht unter „Hütte") — Übersetzungsschlüssel bleibt aus Kompatibilität footer.huette.radtouren */}
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/radtouren">
          {t("footer.huette.radtouren", locale)}
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/blog">
          {t("footer.verein.blog", locale)}
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/kontakt">
          {t("footer.verein.kontakt", locale)}
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/newsletter">
          {t("footer.newsletter.heading", locale)}
        </Link>
        <Link className="text-[var(--color-wh-snow)] no-underline hover:underline" href="/downloads">
          {t("footer.downloads", locale)}
        </Link>
      </nav>
    </div>

    <div className="border-t border-[var(--color-wh-snow)]/10">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-6 flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between text-xs text-[var(--color-wh-snow)]/70">
        <span>© {new Date().getFullYear()} Skifreunde Gütersloh e.V.</span>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link className="text-[var(--color-wh-snow)]/80 no-underline hover:underline" href="/impressum">
            Impressum
          </Link>
          <Link className="text-[var(--color-wh-snow)]/80 no-underline hover:underline" href="/datenschutz">
            Datenschutz
          </Link>
          <Link className="text-[var(--color-wh-snow)]/80 no-underline hover:underline" href="/agb">
            AGB
          </Link>
          <Link className="text-[var(--color-wh-snow)]/80 no-underline hover:underline" href="/kuendigen">
            Mitgliedschaft kündigen
          </Link>
          <CookieSettingsLink />
        </nav>
      </div>
    </div>
  </footer>
);
