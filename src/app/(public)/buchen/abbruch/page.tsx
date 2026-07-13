import Link from "next/link";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

const COPY: Record<Locale, {
  title: string;
  body: string;
  released: string;
  cta1: string;
  cta2: string;
}> = {
  de: {
    title: "Buchung abgebrochen.",
    body: "Es wurde keine Zahlung durchgeführt. Falls Du wieder weiter machen willst, kannst Du den Buchungsvorgang einfach neu starten.",
    released: "Die angefragten Termine sind wieder freigegeben — es bleibt nichts blockiert.",
    cta1: "Neue Buchung starten",
    cta2: "Zur Startseite",
  },
  en: {
    title: "Booking cancelled.",
    body: "No payment was taken. If you'd like to continue, just start the booking process again.",
    released: "The requested dates have been released again — nothing stays blocked.",
    cta1: "Start a new booking",
    cta2: "Back to homepage",
  },
  nl: {
    title: "Boeking geannuleerd.",
    body: "Er is geen betaling uitgevoerd. Wil je verder gaan? Start de boeking gewoon opnieuw.",
    released: "De aangevraagde data zijn weer vrijgegeven — er blijft niets geblokkeerd.",
    cta1: "Nieuwe boeking starten",
    cta2: "Naar de startpagina",
  },
};

export const metadata = { title: "Buchung abgebrochen · Wiesenhütte" };
export const dynamic = "force-dynamic";

export default async function AbbruchPage({
  searchParams,
}: {
  searchParams: Promise<{ freigegeben?: string }>;
}) {
  const locale = await getServerLocale();
  const c = COPY[locale];

  // Die eigentliche Sofort-Freigabe passiert in /api/buchen/abbruch (Stripes
  // cancel_url) — revalidateTag darf nicht im Seiten-Rendering laufen. Die
  // Route leitet mit ?freigegeben=1 hierher, wenn die Tage frei sind.
  const { freigegeben } = await searchParams;
  const released = freigegeben === "1";

  return (
    <div className="bg-[var(--color-wh-snow)] min-h-[60vh] px-8 py-24">
      <div className="max-w-[680px] mx-auto bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-10 text-center">
        <h1 className="text-[40px]">{c.title}</h1>
        <p className="text-[var(--color-wh-fg-muted)]">
          {c.body}
          {released ? ` ${c.released}` : null}
        </p>
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
