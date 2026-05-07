import { db } from "@/lib/db";
import { tariffs, extras } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { updateTariff, updateExtra, createExtra } from "./actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stammdaten · Wiesenhütte Manager" };

const inputBase =
  "rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm bg-white";

export default async function StammdatenPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  const allTariffs = await db.select().from(tariffs).orderBy(asc(tariffs.category));
  const allExtras = await db.select().from(extras).orderBy(asc(extras.sortOrder));

  return (
    <div className="px-8 py-10 max-w-[1200px]">
      <div className="eyebrow">Manager · Stammdaten</div>
      <h1 className="text-[36px] mt-2 mb-1">Tarife & Extras.</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 mb-8">
        Preise pro Personenkategorie und buchbare Zusatzleistungen. Änderungen wirken auf neue
        Buchungen — bestehende Buchungen behalten ihren historischen Snapshot.
      </p>

      {/* Tarife */}
      <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 mb-8">
        <h2 className="text-[22px] m-0 mb-4">Tarife</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-wh-winter-grey)]">
                <th className="text-left py-2 font-semibold text-xs uppercase tracking-wider">
                  Kategorie
                </th>
                <th className="text-left py-2 font-semibold text-xs uppercase tracking-wider">
                  Bezeichnung
                </th>
                <th className="text-right py-2 font-semibold text-xs uppercase tracking-wider">
                  €/Nacht
                </th>
                <th className="text-right py-2 font-semibold text-xs uppercase tracking-wider">
                  Min. Nächte
                </th>
                <th className="text-center py-2 font-semibold text-xs uppercase tracking-wider">
                  Aktiv
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allTariffs.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-[var(--color-wh-winter-grey)]/30"
                >
                  <td className="py-3 font-mono text-xs uppercase">{t.category}</td>
                  <td className="py-3">
                    <form
                      action={async (fd) => {
                        "use server";
                        await updateTariff(fd);
                      }}
                      className="contents"
                      id={`tariff-${t.id}`}
                    >
                      <input type="hidden" name="id" value={t.id} />
                      <input
                        type="text"
                        name="name"
                        defaultValue={t.name}
                        className={`${inputBase} w-full max-w-[260px]`}
                      />
                    </form>
                  </td>
                  <td className="py-3 text-right">
                    <input
                      type="number"
                      name="priceEuros"
                      step="0.01"
                      min="0"
                      defaultValue={(t.priceCentsPerNight / 100).toFixed(2)}
                      form={`tariff-${t.id}`}
                      className={`${inputBase} text-right w-24 font-mono`}
                    />
                  </td>
                  <td className="py-3 text-right">
                    <input
                      type="number"
                      name="minNights"
                      min="1"
                      max="30"
                      defaultValue={t.minNights}
                      form={`tariff-${t.id}`}
                      className={`${inputBase} text-right w-16`}
                    />
                  </td>
                  <td className="py-3 text-center">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={t.active}
                      form={`tariff-${t.id}`}
                    />
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="submit"
                      form={`tariff-${t.id}`}
                      className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-3 py-1 text-xs font-semibold"
                    >
                      Speichern
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[var(--color-wh-fg-muted)] mt-3">
          Hinweis: Die Pricing-Engine verwendet aktuell hartkodierte Preise; diese Tabelle wird in
          einer kommenden Version als Single-Source-of-Truth angebunden. Änderungen sind
          historisiert und werden im Audit-Log geloggt.
        </p>
      </section>

      {/* Extras */}
      <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 mb-8">
        <h2 className="text-[22px] m-0 mb-4">Extras</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-wh-winter-grey)]">
                <th className="text-left py-2 font-semibold text-xs uppercase tracking-wider">
                  Code
                </th>
                <th className="text-left py-2 font-semibold text-xs uppercase tracking-wider">
                  Bezeichnung
                </th>
                <th className="text-right py-2 font-semibold text-xs uppercase tracking-wider">
                  Preis
                </th>
                <th className="text-left py-2 font-semibold text-xs uppercase tracking-wider">
                  Einheit
                </th>
                <th className="text-center py-2 font-semibold text-xs uppercase tracking-wider">
                  /Person
                </th>
                <th className="text-center py-2 font-semibold text-xs uppercase tracking-wider">
                  /Nacht
                </th>
                <th className="text-center py-2 font-semibold text-xs uppercase tracking-wider">
                  Aktiv
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allExtras.map((e) => (
                <tr key={e.id} className="border-b border-[var(--color-wh-winter-grey)]/30">
                  <td className="py-3 font-mono text-xs">{e.code}</td>
                  <td className="py-3">
                    <form
                      action={async (fd) => {
                        "use server";
                        await updateExtra(fd);
                      }}
                      className="contents"
                      id={`extra-${e.id}`}
                    >
                      <input type="hidden" name="id" value={e.id} />
                      <input
                        type="text"
                        name="label"
                        defaultValue={e.label}
                        className={`${inputBase} w-full max-w-[220px]`}
                      />
                    </form>
                  </td>
                  <td className="py-3 text-right">
                    <input
                      type="number"
                      name="unitEuros"
                      step="0.01"
                      min="0"
                      defaultValue={(e.unitCents / 100).toFixed(2)}
                      form={`extra-${e.id}`}
                      className={`${inputBase} text-right w-24 font-mono`}
                    />
                  </td>
                  <td className="py-3">
                    <input
                      type="text"
                      name="unitLabel"
                      defaultValue={e.unitLabel ?? ""}
                      placeholder="z.B. pro Bündel"
                      form={`extra-${e.id}`}
                      className={`${inputBase} w-32`}
                    />
                  </td>
                  <td className="py-3 text-center">
                    <input
                      type="checkbox"
                      name="perPerson"
                      defaultChecked={e.perPerson}
                      form={`extra-${e.id}`}
                    />
                  </td>
                  <td className="py-3 text-center">
                    <input
                      type="checkbox"
                      name="perNight"
                      defaultChecked={e.perNight}
                      form={`extra-${e.id}`}
                    />
                  </td>
                  <td className="py-3 text-center">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={e.active}
                      form={`extra-${e.id}`}
                    />
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="submit"
                      form={`extra-${e.id}`}
                      className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-3 py-1 text-xs font-semibold"
                    >
                      Speichern
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Neues Extra */}
        <div className="mt-8 pt-6 border-t border-[var(--color-wh-winter-grey)]/40">
          <h3 className="text-[16px] m-0 mb-3">Neues Extra anlegen</h3>
          <form
            action={async (fd) => {
              "use server";
              await createExtra(fd);
            }}
            className="flex flex-wrap items-end gap-3"
          >
            <div>
              <label className="block text-[11px] uppercase text-[var(--color-wh-fg-muted)] mb-1">
                Code
              </label>
              <input
                type="text"
                name="code"
                required
                pattern="[a-z0-9_-]+"
                placeholder="z.B. handtuch_set"
                className={`${inputBase} w-44 font-mono`}
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase text-[var(--color-wh-fg-muted)] mb-1">
                Bezeichnung
              </label>
              <input
                type="text"
                name="label"
                required
                placeholder="Bezeichnung sichtbar"
                className={`${inputBase} w-64`}
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase text-[var(--color-wh-fg-muted)] mb-1">
                €
              </label>
              <input
                type="number"
                name="unitEuros"
                step="0.01"
                min="0"
                required
                className={`${inputBase} w-24 text-right font-mono`}
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-4 py-2 text-sm font-semibold"
            >
              Anlegen
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
