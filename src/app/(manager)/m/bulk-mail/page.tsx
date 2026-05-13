import { db } from "@/lib/db";
import { bulkMailCampaigns } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createCampaign } from "./actions";
import { AUDIENCE_LABELS } from "@/lib/bulk-mail-audience";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bulk-Mail · Wiesenhütte Manager" };

const inputBase =
  "rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm bg-white";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sending: "bg-amber-100 text-amber-900",
  sent: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Entwurf",
  sending: "Wird versandt",
  sent: "Versandt",
  cancelled: "Abgebrochen",
};

export default async function BulkMailPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  const all = await db
    .select()
    .from(bulkMailCampaigns)
    .orderBy(desc(bulkMailCampaigns.createdAt))
    .limit(100);

  return (
    <div className="px-8 py-10 max-w-[1100px]">
      <div className="eyebrow">Manager · Bulk-Mail</div>
      <h1 className="text-[36px] mt-2 mb-1">Newsletter & Mass-Mailings.</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 mb-8 max-w-2xl">
        Mails an alle Kunden, alle verifizierten Mitglieder, kürzliche oder kommende Gäste.
        DSGVO-konform: jeder Empfänger hat einen 1-Klick-Opt-Out-Link in der Mail.
        Customer mit emailOptOut=true werden NICHT angeschrieben.
      </p>

      {/* Neue Kampagne anlegen */}
      <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 mb-10">
        <h2 className="text-[20px] m-0 mb-4 font-display font-bold">Neue Mail-Kampagne</h2>
        <form
          action={async (fd) => {
            "use server";
            await createCampaign(fd);
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
              Empfänger-Gruppe *
            </label>
            <select
              name="audience"
              defaultValue="all_customers"
              className={`${inputBase} w-full`}
            >
              {Object.entries(AUDIENCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
              Betreff *
            </label>
            <input
              type="text"
              name="subject"
              required
              maxLength={200}
              placeholder="z.B. Saisonstart 2026 — Was bei uns ansteht"
              className={`${inputBase} w-full`}
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
              Inhalt (Markdown unterstützt: **bold**, *italic*, [text](url), # H2, ## H3, - Listen)
            </label>
            <textarea
              name="body"
              required
              minLength={20}
              maxLength={20000}
              rows={14}
              placeholder={`Hallo,

ein paar News aus der Hütte:

- die Saison startet wieder am 15. November
- der Skiverleih hat neue Kinder-Skier
- die Feuerstelle wurde restauriert

Wir freuen uns auf Euch.`}
              className={`${inputBase} w-full font-mono text-[13px]`}
            />
            <p className="text-[11px] text-[var(--color-wh-fg-muted)] mt-1">
              Anrede „Hallo {`{`}firstName{`}`}," + DSGVO-Opt-Out-Footer werden automatisch
              ergänzt. Keine sensiblen Inhalte (Passwörter, Kontodaten) versenden.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2.5 text-sm font-semibold"
            >
              Als Entwurf anlegen
            </button>
            <span className="ml-3 text-[12px] text-[var(--color-wh-fg-muted)]">
              Versand erfolgt erst nach Bestätigung auf der Detail-Seite.
            </span>
          </div>
        </form>
      </section>

      {/* Liste vorhandener Kampagnen */}
      <section>
        <h2 className="text-[20px] m-0 mb-4 font-display font-bold">Bisherige Kampagnen</h2>
        {all.length === 0 ? (
          <p className="text-[var(--color-wh-fg-muted)] italic">Noch keine Kampagnen.</p>
        ) : (
          <div className="space-y-3">
            {all.map((c) => (
              <Link
                key={c.id}
                href={`/m/bulk-mail/${c.id}`}
                className="block bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5 no-underline hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${STATUS_BADGE[c.status] ?? "bg-gray-100"}`}
                    >
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                    <span className="text-[11px] text-[var(--color-wh-fg-muted)]">
                      {AUDIENCE_LABELS[c.audience as keyof typeof AUDIENCE_LABELS] ?? c.audience} ·{" "}
                      {c.totalRecipients} Empfänger
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--color-wh-fg-muted)]">
                    {c.createdAt.toLocaleDateString("de-DE")}
                  </span>
                </div>
                <p className="font-semibold text-[15px] text-[var(--color-wh-deep-green)] m-0">
                  {c.subject}
                </p>
                {c.status === "sent" && (
                  <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0 mt-1">
                    {c.totalSent} versandt
                    {c.totalFailed > 0 && ` · ${c.totalFailed} fehlgeschlagen`}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
