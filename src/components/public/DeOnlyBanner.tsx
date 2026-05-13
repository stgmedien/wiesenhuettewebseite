import { t, type Locale } from "@/lib/i18n";

/**
 * Hinweis-Banner für Seiten, die noch nicht in NL/EN übersetzt sind.
 * Wenn locale === "de" rendert nichts.
 *
 * Verwendung in Page-Components:
 *   const locale = await getServerLocale();
 *   <DeOnlyBanner locale={locale} />
 */
export function DeOnlyBanner({ locale }: { locale: Locale }) {
  if (locale === "de") return null;
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-center">
      <p className="text-[13px] sm:text-[14px] text-amber-900 m-0 max-w-3xl mx-auto">
        <strong>{t("common.de_only_banner.title", locale)}</strong>{" "}
        <span className="text-amber-800">{t("common.de_only_banner.body", locale)}</span>
      </p>
    </div>
  );
}
