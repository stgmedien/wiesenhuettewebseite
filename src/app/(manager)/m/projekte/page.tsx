import { db } from "@/lib/db";
import { projekte } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createProjekt, updateProjekt, deleteProjekt } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projekte · Wiesenhütte Manager" };

const inputBase =
  "rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm bg-white";

const STATUS_LABEL: Record<string, string> = {
  frei: "Frei",
  teils: "Teils vergeben",
  vergeben: "Vergeben",
};

export default async function ProjekteManagerPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  const all = await db.select().from(projekte).orderBy(asc(projekte.sortOrder));

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[1200px]">
      <div className="eyebrow">Manager · Projekte</div>
      <h1 className="text-[36px] mt-2 mb-1">Hütten-Projekte.</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 mb-8 max-w-2xl">
        Die Bausteine der versteckten Seite <code>/projekte</code> — Status, Kontakt und Texte
        hier pflegen, ohne Code-Deploy. Änderungen sind sofort live.
      </p>

      {all.length > 0 && (
        <div className="space-y-3 mb-12">
          {all.map((p) => (
            <details
              key={p.id}
              className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] overflow-hidden"
            >
              <summary className="cursor-pointer p-4 hover:bg-[var(--color-wh-beige)]/40">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-[var(--color-wh-beige)] text-[var(--color-wh-deep-green)] px-2 py-0.5 rounded-full">
                    {p.nr}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--color-wh-fg-muted)]">
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                  <p className="font-semibold text-[15px] text-[var(--color-wh-deep-green)] m-0 flex-1 min-w-0">
                    {p.titel}
                  </p>
                </div>
              </summary>
              <div className="p-5 border-t border-[var(--color-wh-winter-grey)]/40">
                <ProjektEditForm p={p} />
              </div>
            </details>
          ))}
        </div>
      )}

      <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
        <h2 className="text-[20px] m-0 mb-4">Neues Projekt anlegen</h2>
        <form
          action={async (fd) => {
            "use server";
            await createProjekt(fd);
          }}
          className="space-y-3"
        >
          <FormBody />
          <button
            type="submit"
            className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2.5 text-sm font-semibold mt-2"
          >
            Anlegen
          </button>
        </form>
      </section>
    </div>
  );
}

function ProjektEditForm({ p }: { p: typeof projekte.$inferSelect }) {
  return (
    <>
      <form
        action={async (fd) => {
          "use server";
          await updateProjekt(fd);
        }}
        className="space-y-3"
      >
        <input type="hidden" name="id" value={p.id} />
        <FormBody initial={p} />
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2 text-sm font-semibold"
          >
            Speichern
          </button>
        </div>
      </form>
      <form
        action={async (fd) => {
          "use server";
          await deleteProjekt(fd);
        }}
        className="mt-3 pt-3 border-t border-[var(--color-wh-winter-grey)]/40"
      >
        <input type="hidden" name="id" value={p.id} />
        <button
          type="submit"
          className="rounded-full border border-red-300 text-red-700 px-4 py-1.5 text-xs hover:bg-red-50"
        >
          Projekt löschen
        </button>
      </form>
    </>
  );
}

function FormBody({ initial }: { initial?: typeof projekte.$inferSelect }) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Nr. *
          </label>
          <input type="text" name="nr" defaultValue={initial?.nr ?? ""} required className={`${inputBase} w-full`} />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Key * <span className="normal-case font-normal">(intern, keine Leerzeichen)</span>
          </label>
          <input type="text" name="key" defaultValue={initial?.key ?? ""} required className={`${inputBase} w-full font-mono`} />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Status
          </label>
          <select name="status" defaultValue={initial?.status ?? "frei"} className={`${inputBase} w-full`}>
            <option value="frei">Frei</option>
            <option value="teils">Teils vergeben</option>
            <option value="vergeben">Vergeben</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Sort
          </label>
          <input
            type="number"
            name="sortOrder"
            defaultValue={initial?.sortOrder ?? 0}
            className={`${inputBase} w-full text-right`}
          />
        </div>
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
          Titel *
        </label>
        <input type="text" name="titel" defaultValue={initial?.titel ?? ""} required className={`${inputBase} w-full`} />
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
          Untertitel *
        </label>
        <input
          type="text"
          name="untertitel"
          defaultValue={initial?.untertitel ?? ""}
          required
          className={`${inputBase} w-full`}
        />
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
          Darum geht&apos;s
        </label>
        <textarea name="darumGehts" defaultValue={initial?.darumGehts ?? ""} rows={3} className={`${inputBase} w-full`} />
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
          Das brauchen wir <span className="normal-case font-normal">(eine Zeile pro Punkt)</span>
        </label>
        <textarea
          name="brauchenWir"
          defaultValue={(initial?.brauchenWir ?? []).join("\n")}
          rows={3}
          className={`${inputBase} w-full`}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Zeitrahmen
          </label>
          <input
            type="text"
            name="zeitrahmen"
            defaultValue={initial?.zeitrahmen ?? "-"}
            className={`${inputBase} w-full`}
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Aufwand
          </label>
          <input type="text" name="aufwand" defaultValue={initial?.aufwand ?? "-"} className={`${inputBase} w-full`} />
        </div>
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
          Kosten
        </label>
        <input
          type="text"
          name="kosten"
          defaultValue={initial?.kosten ?? "Richtwert: bitte eintragen"}
          className={`${inputBase} w-full`}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            🔨 Anpacken
          </label>
          <textarea name="anpacken" defaultValue={initial?.anpacken ?? ""} rows={2} className={`${inputBase} w-full`} />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            💶 Beitrag
          </label>
          <textarea name="beitrag" defaultValue={initial?.beitrag ?? ""} rows={2} className={`${inputBase} w-full`} />
        </div>
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
          Danke-Zeile
        </label>
        <input type="text" name="danke" defaultValue={initial?.danke ?? ""} className={`${inputBase} w-full`} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Kontakt
          </label>
          <input
            type="text"
            name="kontakt"
            defaultValue={initial?.kontakt ?? "Ansprechpartner steht noch nicht fest"}
            className={`${inputBase} w-full`}
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Bild-Pfad
          </label>
          <input
            type="text"
            name="bild"
            defaultValue={initial?.bild ?? ""}
            placeholder="/media/projekte/..."
            className={`${inputBase} w-full font-mono`}
          />
        </div>
      </div>
    </>
  );
}
