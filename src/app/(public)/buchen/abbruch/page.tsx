import Link from "next/link";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

const COPY: Record<Locale, {
  title: string;
  body: string;
  cta1: string;
  cta2: string;
}> = {
  de: {
    title: "Buchung abgebrochen.",
    body: "Es wurde keine Zahlung durchgeführt. Falls Du wieder weiter machen willst, kannst Du den Buchungsvorgang einfach neu starten.",
    cta1: "Neue Buchung starten",
    cta2: "Zur Startseite",
  },
  en: {
    title: "Booking cancelled.",
    body: "No payment was taken. If you'd like to continue, just start the booking process again.",
    cta1: "Start a new booking",
    cta2: "Back to homepage",
  },
  nl: {
    title: "Boeking geannuleerd.",
    body: "Er is geen betaling uitgevoerd. Wil je verder gaan? Start de boeking gewoon opnieuw.",
    cta1: "Nieuwe boeking starten",
    cta2: "Naar de startpagina",
  },
};

export const metadata = { title: "Buchung abgebrochen · Wiesenhütte" };
export const dynamic = "force-dynamic";

export default async function AbbruchPage() {
  const locale = await getServerLocale();
  const c = COPY[locale];

  return (
    <div className="bg-[var(--color-wh-snow)] min-h-[60vh] px-8 py-24">
      <div className="max-w-[680px] mx-auto bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-10 text-center">
        <h1 className="text-[40px]">{c.title}</h1>
        <p className="text-[var(--color-wh-fg-muted)]">{c.body}</p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link
            href="/buchen"
            className="inline-flex h-12 px-6 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] no-underline font-semibold"
          >
            {c.cta1}
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 px-6 items-center rounded-[var(--radius-btn)] border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] no-underline font-semibold"
          >
            {c.cta2}
          </Link>
        </div>
      </div>
    </div>
  );
}
