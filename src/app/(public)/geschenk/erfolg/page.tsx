import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata = { title: "Gutschein-Kauf erfolgreich · Wiesenhütte" };

type Props = { searchParams: Promise<{ code?: string }> };

export default async function GeschenkErfolgPage({ searchParams }: Props) {
  const { code } = await searchParams;
  return (
    <div className="bg-[var(--color-wh-snow)] min-h-[60vh] px-8 py-24">
      <div className="max-w-[680px] mx-auto bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-10 text-center">
        <CheckCircle2 className="text-[var(--color-wh-green)] mx-auto" size={64} strokeWidth={1.4} />
        <h1 className="text-[36px] sm:text-[40px] mt-6">Vielen Dank — Dein Gutschein ist da!</h1>
        {code && (
          <p className="text-[var(--color-wh-fg-muted)] m-0 mt-2">
            Gutschein-Code:{" "}
            <strong className="font-mono text-[var(--color-wh-deep-green)] tracking-wider">
              {code}
            </strong>
          </p>
        )}
        <p className="mt-4 text-[var(--color-wh-fg-muted)]">
          Eine Bestätigung mit allen Details und dem Gutschein-PDF ist unterwegs zu Deiner
          E-Mail. Falls Du den Mail-Versand an die Beschenkten gewählt hast, bekommen sie
          ihre Mail in den nächsten Minuten.
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
