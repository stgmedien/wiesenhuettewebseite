import Link from "next/link";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

export const metadata = { title: "Eure Hüttenfahrt ist reserviert · Wiesenhütte" };

type Props = {
  searchParams: Promise<{ b?: string }>;
};

const COPY: Record<
  Locale,
  { eyebrow: string; h1: string; lead: string; p1: string; p2: string; bookingLabel: string; back: string }
> = {
  de: {
    eyebrow: "Reservierung bestätigt",
    h1: "Eure Hüttenfahrt ist reserviert.",
    lead: "Weil Schulgruppen die Elternbeiträge erst sammeln müssen, ist die Anzahlung noch nicht fällig — Ihr müsst jetzt nichts zahlen.",
    p1: "Rund 30 Tage vor Anreise bekommt Ihr automatisch eine E-Mail mit einem Zahlungslink für die Anzahlung. Die Restzahlung wird 14 Tage vor Anreise eingezogen.",
    p2: "Eine Bestätigung mit allen Details ist gerade per E-Mail zu Euch unterwegs. Bei Fragen einfach auf diese Mail antworten.",
    bookingLabel: "Eure Buchungsnummer",
    back: "Zur Startseite",
  },
  en: {
    eyebrow: "Reservation confirmed",
    h1: "Your cabin trip is reserved.",
    lead: "Because school groups collect parents' contributions over time, the deposit isn't due yet — you don't need to pay anything now.",
    p1: "About 30 days before arrival you'll automatically receive an email with a payment link for the deposit. The remainder is charged 14 days before arrival.",
    p2: "A confirmation with all the details is on its way to you by email. Any questions? Just reply to that email.",
    bookingLabel: "Your booking number",
    back: "Back to homepage",
  },
  nl: {
    eyebrow: "Reservering bevestigd",
    h1: "Jullie huttentrip is gereserveerd.",
    lead: "Omdat schoolgroepen de ouderbijdragen pas verzamelen, is de aanbetaling nog niet verschuldigd — jullie hoeven nu niets te betalen.",
    p1: "Ongeveer 30 dagen voor aankomst krijgen jullie automatisch een e-mail met een betaallink voor de aanbetaling. De restbetaling wordt 14 dagen voor aankomst geïncasseerd.",
    p2: "Een bevestiging met alle details is onderweg per e-mail. Vragen? Antwoord gewoon op die mail.",
    bookingLabel: "Jullie boekingsnummer",
    back: "Naar de startpagina",
  },
};

export default async function SchoolRequestPage({ searchParams }: Props) {
  const sp = await searchParams;
  const bookingNumber = sp.b;
  const locale = await getServerLocale();
  const c = COPY[locale];

  return (
    <div className="bg-[var(--color-wh-snow)] min-h-screen px-6 sm:px-8 py-16 sm:py-24">
      <div className="max-w-[760px] mx-auto">
        <div className="eyebrow text-[var(--color-wh-green)]">{c.eyebrow}</div>
        <h1 className="text-[36px] sm:text-[56px] mt-4 mb-6 leading-tight">{c.h1}</h1>

        <p className="text-base sm:text-[18px] leading-relaxed text-[var(--color-wh-fg-muted)] m-0">
          {c.lead}
        </p>

        {bookingNumber && (
          <div className="mt-8 inline-flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-wh-beige)] border border-[var(--color-wh-winter-grey)] px-4 py-3">
            <span className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)]">
              {c.bookingLabel}
            </span>
            <strong className="font-mono text-[var(--color-wh-deep-green)]">{bookingNumber}</strong>
          </div>
        )}

        <div className="mt-10 space-y-4 text-base sm:text-[17px] leading-relaxed text-[var(--color-wh-black)]">
          <p className="m-0">{c.p1}</p>
          <p className="m-0">{c.p2}</p>
        </div>

        <Link
          href="/"
          className="mt-12 inline-flex items-center px-5 h-12 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] font-semibold no-underline"
        >
          {c.back}
        </Link>
      </div>
    </div>
  );
}
