import Link from "next/link";
import { getServerLocale } from "@/lib/i18n";
import { DeOnlyBanner } from "@/components/public/DeOnlyBanner";
import { CommunitySubmitForm } from "@/components/public/CommunitySubmitForm";

// Bewusst nicht in der Haupt-Navigation/Sitemap verlinkt und noindex — diese
// Seite ist für den direkten Link gedacht, den Klassen nach ihrem Aufenthalt
// bekommen (Mail, QR-Code), nicht für zufällige Seitenbesucher:innen.
// Auf /schulprojekt#anekdoten stehen nur die bereits freigegebenen Beiträge.
export const metadata = {
  title: "Anekdote einreichen · Wiesenhütte",
  description: "Schreib eine Erinnerung von Eurer Projektfahrt an die Wiesenhütte.",
  robots: { index: false, follow: false },
};

export default async function AnekdoteEinreichenPage() {
  const locale = await getServerLocale();

  return (
    <div className="bg-[var(--color-wh-beige)] min-h-[70vh] px-6 sm:px-8 py-16 sm:py-24">
      <DeOnlyBanner locale={locale} />
      <div className="max-w-[640px] mx-auto">
        <Link
          href="/schulprojekt#anekdoten"
          className="text-sm text-[var(--color-wh-deep-green)] no-underline hover:underline"
        >
          ← Zurück zum Schulprojekt
        </Link>
        <div className="eyebrow mt-4">Schulprojekt</div>
        <h1 className="text-[32px] sm:text-[44px] mt-3 mb-3 leading-tight">
          Wart Ihr an der Hütte? Erzählt davon.
        </h1>
        <p className="text-[var(--color-wh-fg-muted)] text-[16px] mb-10">
          Diese Seite ist für Klassen gedacht, die gerade von der Wiesenhütte zurück sind — der
          Link kam vermutlich von Eurer Lehrkraft. Euer Beitrag erscheint nach kurzer Prüfung
          zusammen mit den anderen Erinnerungen auf der{" "}
          <Link href="/schulprojekt#anekdoten" className="underline">
            Schulprojekt-Seite
          </Link>
          .
        </p>

        <CommunitySubmitForm kind="schulprojekt" contextPlaceholder="z.B. Klasse 9b, ESG Gütersloh" />
      </div>
    </div>
  );
}
