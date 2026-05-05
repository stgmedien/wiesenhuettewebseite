import Link from "next/link";

export const metadata = { title: "Buchung abgebrochen · Wiesenhütte" };

export default function AbbruchPage() {
  return (
    <div className="bg-[var(--color-wh-snow)] min-h-[60vh] px-8 py-24">
      <div className="max-w-[680px] mx-auto bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-10 text-center">
        <h1 className="text-[40px]">Buchung abgebrochen.</h1>
        <p className="text-[var(--color-wh-fg-muted)]">
          Es wurde keine Zahlung durchgeführt. Falls Du wieder weiter machen willst, kannst Du den
          Buchungsvorgang einfach neu starten.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link
            href="/buchen"
            className="inline-flex h-12 px-6 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] no-underline font-semibold"
          >
            Neue Buchung starten
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 px-6 items-center rounded-[var(--radius-btn)] border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] no-underline font-semibold"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
