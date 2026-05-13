import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

export const metadata = { title: "Gutschein-Kauf erfolgreich · Wiesenhütte" };

const COPY: Record<Locale, { title: string; codeLabel: string; body: string; back: string }> = {
  de: {
    title: "Vielen Dank — Dein Gutschein ist da!",
    codeLabel: "Gutschein-Code:",
    body: "Eine Bestätigung mit allen Details und dem Gutschein-PDF ist unterwegs zu Deiner E-Mail. Falls Du den Mail-Versand an die Beschenkten gewählt hast, bekommen sie ihre Mail in den nächsten Minuten.",
    back: "Zurück zur Startseite",
  },
  en: {
    title: "Thanks — your voucher is ready!",
    codeLabel: "Voucher code:",
    body: "A confirmation with all details and the voucher PDF is on its way to your email. If you chose direct delivery to the recipient, they will receive their mail in the next few minutes.",
    back: "Back to home",
  },
  nl: {
    title: "Bedankt — je cadeaubon is klaar!",
    codeLabel: "Cadeau-code:",
    body: "Een bevestiging met alle details en de cadeaubon-PDF is onderweg naar je e-mail. Als je voor directe verzending aan de ontvanger hebt gekozen, krijgen zij hun mail in de komende minuten.",
    back: "Terug naar de homepage",
  },
};

type Props = { searchParams: Promise<{ code?: string }> };

export default async function GeschenkErfolgPage({ searchParams }: Props) {
  const locale = await getServerLocale();
  const c = COPY[locale];
  const { code } = await searchParams;
  return (
    <div className="bg-[var(--color-wh-snow)] min-h-[60vh] px-8 py-24">
      <div className="max-w-[680px] mx-auto bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-10 text-center">
        <CheckCircle2 className="text-[var(--color-wh-green)] mx-auto" size={64} strokeWidth={1.4} />
        <h1 className="text-[36px] sm:text-[40px] mt-6">{c.title}</h1>
        {code && (
          <p className="text-[var(--color-wh-fg-muted)] m-0 mt-2">
            {c.codeLabel}{" "}
            <strong className="font-mono text-[var(--color-wh-deep-green)] tracking-wider">
              {code}
            </strong>
          </p>
        )}
        <p className="mt-4 text-[var(--color-wh-fg-muted)]">{c.body}</p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex h-12 px-6 items-center rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] no-underline font-semibold"
          >
            {c.back}
          </Link>
        </div>
      </div>
    </div>
  );
}
