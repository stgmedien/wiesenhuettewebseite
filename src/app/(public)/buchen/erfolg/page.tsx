import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata = { title: "Buchung erfolgreich · Wiesenhütte" };

type Props = { searchParams: Promise<{ bn?: string }> };

export default async function ErfolgPage({ searchParams }: Props) {
  const { bn } = await searchParams;
  return (
    <div className="bg-[var(--color-wh-snow)] min-h-[60vh] px-8 py-24">
      <div className="max-w-[680px] mx-auto bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-10 text-center">
        <CheckCircle2 className="text-[var(--color-wh-green)] mx-auto" size={64} strokeWidth={1.4} />
        <h1 className="text-[40px] mt-6">Vielen Dank — eure Buchung ist da.</h1>
        {bn && (
          <p className="text-[var(--color-wh-fg-muted)] m-0">
            Buchungsnummer: <strong className="text-[var(--color-wh-deep-green)]">{bn}</strong>
          </p>
        )}
        <p className="mt-4 text-[var(--color-wh-fg-muted)]">
          Eine Bestätigung mit allen Details ist unterwegs zu eurer E-Mail-Adresse.
          Falls sie nicht innerhalb weniger Minuten ankommt, schaut bitte im Spam-Ordner nach.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex h-12 px-6 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] no-underline font-semibold"
          >
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
