import { db } from "@/lib/db";
import { projektAnfragen } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { setErledigt } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projekt-Anmeldungen · Wiesenhütte Manager" };

export default async function ProjektAnfragenPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  const rows = await db.select().from(projektAnfragen).orderBy(desc(projektAnfragen.createdAt));
  const offen = rows.filter((r) => !r.erledigt);
  const erledigt = rows.filter((r) => r.erledigt);

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[1000px]">
      <div className="eyebrow">Manager · Projekte</div>
      <h1 className="text-[36px] mt-2 mb-1">Wunschprojekt-Anmeldungen.</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 mb-8 max-w-2xl">
        Klassen/Gruppen, die sich über <code>/projekte</code> für ein Bau-Projekt angemeldet
        haben. Status wird hier manuell gepflegt — trägt das Projekt selbst erst als
        &bdquo;vergeben&rdquo; ein, wenn ihr die Zusage gemacht habt.
      </p>

      {rows.length === 0 && (
        <p className="text-[var(--color-wh-fg-muted)]">Noch keine Anmeldungen eingegangen.</p>
      )}

      {offen.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[18px] mb-3">Offen ({offen.length})</h2>
          <div className="space-y-3">
            {offen.map((a) => (
              <AnfrageCard key={a.id} a={a} />
            ))}
          </div>
        </section>
      )}

      {erledigt.length > 0 && (
        <section>
          <h2 className="text-[18px] mb-3 opacity-60">Erledigt ({erledigt.length})</h2>
          <div className="space-y-3 opacity-60">
            {erledigt.map((a) => (
              <AnfrageCard key={a.id} a={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AnfrageCard({ a }: { a: typeof projektAnfragen.$inferSelect }) {
  return (
    <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-[10px] uppercase tracking-wider font-bold bg-[var(--color-wh-beige)] text-[var(--color-wh-deep-green)] px-2 py-0.5 rounded-full">
            {a.projektNr}
          </span>
          <span className="font-semibold text-[15px] text-[var(--color-wh-deep-green)]">
            {a.projektTitel}
          </span>
        </div>
        <div className="text-sm text-[var(--color-wh-fg-muted)]">
          <b>{a.gruppe}</b> &middot; {a.kontaktName} &middot;{" "}
          <a href={`mailto:${a.kontaktEmail}`} className="underline">
            {a.kontaktEmail}
          </a>
          {a.kontaktTelefon && <> &middot; {a.kontaktTelefon}</>}
        </div>
        {a.nachricht && <p className="text-sm mt-2 whitespace-pre-wrap">{a.nachricht}</p>}
        <div className="text-xs text-[var(--color-wh-fg-muted)] mt-2">
          {new Date(a.createdAt).toLocaleString("de-DE")}
        </div>
      </div>
      <form
        action={async (fd) => {
          "use server";
          await setErledigt(fd);
        }}
      >
        <input type="hidden" name="id" value={a.id} />
        <input type="hidden" name="erledigt" value={(!a.erledigt).toString()} />
        <button
          type="submit"
          className="rounded-full border border-[var(--color-wh-winter-grey)] px-3 py-1.5 text-xs whitespace-nowrap hover:bg-[var(--color-wh-beige)]/40"
        >
          {a.erledigt ? "Wieder öffnen" : "Erledigt"}
        </button>
      </form>
    </div>
  );
}
