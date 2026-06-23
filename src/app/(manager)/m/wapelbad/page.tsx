import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { wapelbadRegistrations } from "@/lib/db/schema-wapelbad";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wapelbad · Wiesenhütte Manager" };

const fmtDate = (d: Date) =>
  new Date(d).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function WapelbadManagerPage() {
  let rows: (typeof wapelbadRegistrations.$inferSelect)[] = [];
  let tableMissing = false;
  try {
    rows = await db
      .select()
      .from(wapelbadRegistrations)
      .orderBy(desc(wapelbadRegistrations.createdAt));
  } catch (e) {
    // Tabelle noch nicht migriert → freundlicher Hinweis statt 500.
    console.error("[m/wapelbad] query failed", e);
    tableMissing = true;
  }

  const totalPersons = rows.reduce((s, r) => s + r.persons, 0);
  const grillPersons = rows.reduce((s, r) => s + (r.grill ? r.persons : 0), 0);

  const Stat = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-wh-winter-grey)] bg-white p-5">
      <div className="text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)]">
        {label}
      </div>
      <div className="font-display text-[32px] font-bold text-[var(--color-wh-deep-green)] mt-1 leading-none">
        {value}
      </div>
    </div>
  );

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[1400px]">
      <div className="eyebrow">Wapelbad</div>
      <h1 className="text-[28px] sm:text-[40px] mt-2 mb-1">Anmeldungen</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0">
        Vereinsfest am Samstag, 5. September 2026 · 16 Uhr · Wapelbad. Jede Anmeldung wird hier
        gespeichert (zusätzlich geht eine Hinweis-Mail an den Vorstand).
      </p>
      <p className="text-[13px] text-[var(--color-wh-sunset)] mt-2 m-0 font-medium">
        ⚠️ DSGVO-Hinweis: Die Anmeldedaten sind laut Datenschutzerklärung bis 30 Tage nach der
        Veranstaltung zu speichern. Bitte die Tabelle bis spätestens{" "}
        <strong>5. Oktober 2026</strong> manuell löschen (Neon SQL Editor:{" "}
        <code className="text-[12px] bg-gray-100 px-1 rounded">
          DELETE FROM wapelbad_registrations;
        </code>
        ).
      </p>

      {tableMissing ? (
        <div className="mt-8 rounded-[var(--radius-card)] border border-[var(--color-wh-sunset)]/40 bg-[var(--color-wh-sunset)]/10 p-5 text-[15px]">
          Die Tabelle <code>wapelbad_registrations</code> existiert noch nicht. Bitte einmalig das
          SQL aus <code>drizzle/wapelbad.sql</code> in der Neon-Konsole ausführen — danach erscheinen
          hier die Anmeldungen.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mt-8 max-w-[560px]">
            <Stat label="Anmeldungen" value={rows.length} />
            <Stat label="Personen gesamt" value={totalPersons} />
            <Stat label="davon Grillbuffet" value={grillPersons} />
          </div>

          <h2 className="text-[20px] mt-12 mb-4">Alle Anmeldungen ({rows.length})</h2>
          <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-[var(--color-wh-snow)] border-b border-[var(--color-wh-winter-grey)]">
                  <tr className="text-left">
                    {["Name", "E-Mail", "Personen", "Grillbuffet", "Eingegangen"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-[var(--color-wh-fg-muted)]"
                      >
                        Noch keine Anmeldungen.
                      </td>
                    </tr>
                  )}
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-[var(--color-wh-winter-grey)] last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-[var(--color-wh-black)]">{r.name}</td>
                      <td className="px-4 py-3">
                        <a
                          href={`mailto:${r.email}`}
                          className="text-[var(--color-wh-deep-green)] underline underline-offset-2"
                        >
                          {r.email}
                        </a>
                      </td>
                      <td className="px-4 py-3">{r.persons}</td>
                      <td className="px-4 py-3">
                        {r.grill ? (
                          <span className="text-[var(--color-wh-deep-green)] font-semibold">
                            ja
                          </span>
                        ) : (
                          <span className="text-[var(--color-wh-fg-muted)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-wh-fg-muted)] whitespace-nowrap">
                        {fmtDate(r.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
