import Link from "next/link";
import { PartyPopper } from "lucide-react";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

export const dynamic = "force-dynamic";

export const metadata = { title: "Newsletter bestätigt · Wiesenhütte" };

const COPY: Record<Locale, { h: string; body: string; cta: string }> = {
  de: {
    h: "Du bist dabei! 🎉",
    body: "Danke für die Bestätigung — ab jetzt bekommst Du den Wiesenhütten-Newsletter. Wir freuen uns, von der Hütte zu erzählen.",
    cta: "Zurück zur Startseite",
  },
  en: {
    h: "You're in! 🎉",
    body: "Thanks for confirming — from now on you'll receive the Wiesenhütte newsletter. We look forward to sharing news from the cabin.",
    cta: "Back to the homepage",
  },
  nl: {
    h: "Je doet mee! 🎉",
    body: "Bedankt voor de bevestiging — vanaf nu ontvang je de Wiesenhütte-nieuwsbrief. We vertellen je graag over de hut.",
    cta: "Terug naar de homepage",
  },
};

export default async function NewsletterBestaetigtPage() {
  const locale = await getServerLocale();
  const c = COPY[locale];
  return (
    <div className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-24 sm:py-32 min-h-[55vh]">
      <div className="max-w-[600px] mx-auto text-center">
        <PartyPopper size={56} className="mx-auto text-[var(--color-wh-sunset)]" aria-hidden />
        <h1 className="text-[34px] sm:text-[46px] mt-6 mb-4">{c.h}</h1>
        <p className="text-base sm:text-[17px] leading-relaxed text-[var(--color-wh-fg-muted)] mb-8">
          {c.body}
        </p>
        <Link
          href="/"
          className="inline-flex h-12 px-7 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] no-underline font-semibold hover:bg-[var(--color-wh-green)] transition-colors"
        >
          {c.cta}
        </Link>
      </div>
    </div>
  );
}
