import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { mailTemplates } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import Link from "next/link";
import { createTemplate } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mail-Templates · Wiesenhütte Manager" };

export default async function MailTemplatesPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  const all = await db.select().from(mailTemplates).orderBy(asc(mailTemplates.key));

  return (
    <div className="px-8 py-10 max-w-[1100px]">
      <div className="eyebrow">Manager · Kommunikation</div>
      <h1 className="text-[36px] mt-2 mb-1">Mail-Templates.</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 mb-8">
        Versionierte Vorlagen mit Markdown-Body und{" "}
        <code className="text-xs">{`{{variable}}`}</code>-Substitution. Jede Änderung erzeugt eine
        neue Version; alte Versionen bleiben für Audit + Rollback erhalten.
      </p>

      {/* Liste */}
      <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-wh-winter-grey)]">
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">
                Key
              </th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">
                Status
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {all.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-[var(--color-wh-fg-muted)]">
                  Noch keine Templates angelegt. Lege das erste unten an.
                </td>
              </tr>
            ) : (
              all.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-[var(--color-wh-winter-grey)]/30"
                >
                  <td className="px-4 py-3 font-mono text-xs">{t.key}</td>
                  <td className="px-4 py-3">{t.name}</td>
                  <td className="px-4 py-3">
                    {t.activeVersionId ? (
                      <span className="text-emerald-700 text-xs">✓ aktiv</span>
                    ) : (
                      <span className="text-amber-700 text-xs">noch keine aktive Version</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/m/mail-templates/${t.id}`}
                      className="text-[var(--color-wh-deep-green)] underline text-sm"
                    >
                      Bearbeiten →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Neu anlegen */}
      <section className="bg-[var(--color-wh-beige)] border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
        <h2 className="text-[20px] m-0 mb-4">Neues Template anlegen</h2>
        <form
          action={async (fd) => {
            "use server";
            await createTemplate(fd);
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <div>
            <label className="block text-xs uppercase text-[var(--color-wh-fg-muted)] mb-1">
              Key (a-z, _, -)
            </label>
            <input
              type="text"
              name="key"
              required
              pattern="[a-z0-9_-]+"
              placeholder="z.B. booking-reminder-custom"
              className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-[var(--color-wh-fg-muted)] mb-1">
              Anzeigename
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="z.B. Persönliche Buchungs-Erinnerung"
              className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs uppercase text-[var(--color-wh-fg-muted)] mb-1">
              Beschreibung (optional)
            </label>
            <input
              type="text"
              name="description"
              placeholder="Wann wird die Mail versendet?"
              className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs uppercase text-[var(--color-wh-fg-muted)] mb-1">
              Verfügbare Variablen (komma-getrennt)
            </label>
            <input
              type="text"
              name="variables"
              placeholder="firstName, bookingNumber, arrival, …"
              className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2.5 text-sm font-semibold"
            >
              Template anlegen
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
