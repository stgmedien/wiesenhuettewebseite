import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AUTOMATIC_MAIL_TEMPLATES, type MailCategory } from "@/lib/automatic-mail-templates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Automatische Mails · Wiesenhütte Manager" };

const CATEGORY_ORDER: MailCategory[] = [
  "Buchung — Gast",
  "Buchung — Hüttenservice/intern",
  "Zahlungen",
  "Schulgruppen",
  "Freigabe (Private Feier)",
  "Mitgliedschaft",
  "Konto & Login",
  "Sonstiges",
];

export default async function AutomaticMailsPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[1100px]">
      <Link
        href="/m/mail-templates"
        className="text-sm text-[var(--color-wh-fg-muted)] no-underline"
      >
        ← Zurück zu Mail-Templates
      </Link>
      <div className="eyebrow mt-3">Manager · Kommunikation</div>
      <h1 className="text-[36px] mt-2 mb-1">Automatische Mails.</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 mb-2 max-w-2xl">
        Alle Mails, die das System selbstständig verschickt — ausgelöst durch Cron-Jobs oder den
        Stripe-Webhook. Anders als die freien Vorlagen unter{" "}
        <Link href="/m/mail-templates" className="text-[var(--color-wh-deep-green)]">
          Mail-Templates
        </Link>{" "}
        sind das feste, im Code hinterlegte Inhalte.
      </p>
      <p className="text-[var(--color-wh-fg-muted)] m-0 mb-8 max-w-2xl text-sm">
        Ob eine bestimmte Mail für eine konkrete Buchung tatsächlich verschickt wurde, steht im
        Mail-Verlauf auf der jeweiligen Buchungsseite.
      </p>

      {CATEGORY_ORDER.map((category) => {
        const items = AUTOMATIC_MAIL_TEMPLATES.filter((t) => t.category === category);
        if (items.length === 0) return null;
        return (
          <section key={category} className="mb-8">
            <h2 className="text-lg font-semibold text-[var(--color-wh-deep-green)] mb-3">
              {category}
            </h2>
            <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-wh-winter-grey)] text-left text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)]">
                    <th className="px-4 py-2.5 font-medium">Mail</th>
                    <th className="px-4 py-2.5 font-medium">Wann</th>
                    <th className="px-4 py-2.5 font-medium">An</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr key={t.key} className="border-b border-[var(--color-wh-winter-grey)]/60 last:border-0 align-top">
                      <td className="px-4 py-3">
                        <div className="font-medium">{t.label}</div>
                        <div className="text-xs text-[var(--color-wh-fg-muted)] font-mono">{t.key}</div>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-wh-fg-muted)]">{t.trigger}</td>
                      <td className="px-4 py-3 text-[var(--color-wh-fg-muted)]">{t.audience}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
