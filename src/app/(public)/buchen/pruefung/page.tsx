import Link from "next/link";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

export const metadata = { title: "Wir prüfen Eure Anfrage · Wiesenhütte" };

type Props = {
  searchParams: Promise<{ b?: string }>;
};

const COPY: Record<Locale, { eyebrow: string; h1: string; lead: string; p1: string; p2: string; bookingLabel: string; back: string }> = {
  de: {
    eyebrow: "Anfrage eingegangen",
    h1: "Wir prüfen Eure Anfrage — und melden uns.",
    lead: "Bei privaten Feiern schaut der Vorstand der Skifreunde Gütersloh e.V. kurz drauf, bevor die Buchung verbindlich wird. In der Regel innerhalb 48 Stunden.",
    p1: "Es wurde nichts gezahlt — Ihr müsst jetzt nichts veranlassen. Sobald wir freigegeben haben, bekommt Ihr eine Mail mit dem Zahlungslink für die Anzahlung.",
    p2: "Falls wir absagen müssen, melden wir uns auch — dann wird die Tage-Sperre wieder freigegeben.",
    bookingLabel: "Eure Anfrage-Nummer",
    back: "Zur Startseite",
  },
  en: {
    eyebrow: "Request received",
    h1: "We're reviewing your request — we'll get back to you.",
    lead: "For private parties, the board of Skifreunde Gütersloh e.V. takes a quick look before the booking becomes binding. Usually within 48 hours.",
    p1: "Nothing has been charged — you don't need to do anything now. As soon as we approve, you'll receive an email with the payment link for the deposit.",
    p2: "If we have to decline, we'll let you know too — the date block will then be released.",
    bookingLabel: "Your request number",
    back: "Back to homepage",
  },
  nl: {
    eyebrow: "Aanvraag ontvangen",
    h1: "We beoordelen jullie aanvraag — we melden ons.",
    lead: "Bij privéfeesten kijkt het bestuur van Skifreunde Gütersloh e.V. er kort naar voordat de boeking definitief wordt. Doorgaans binnen 48 uur.",
    p1: "Er is nog niets betaald — jullie hoeven nu niets te doen. Zodra we akkoord geven, krijgen jullie een e-mail met de betaallink voor de aanbetaling.",
    p2: "Als we moeten afwijzen, laten we het ook weten — de datumblokkering wordt dan weer vrijgegeven.",
    bookingLabel: "Aanvraagnummer",
    back: "Naar de startpagina",
  },
};

export default async function ReviewPendingPage({ searchParams }: Props) {
  const sp = await searchParams;
  const bookingNumber = sp.b;
  const locale = await getServerLocale();
  const c = COPY[locale];

  return (
    <div className="bg-[var(--color-wh-snow)] min-h-screen px-6 sm:px-8 py-16 sm:py-24">
      <div className="max-w-[760px] mx-auto">
        <div className="eyebrow text-[var(--color-wh-sunset)]">{c.eyebrow}</div>
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
