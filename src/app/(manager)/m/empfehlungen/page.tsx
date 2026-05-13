import { db } from "@/lib/db";
import { regionalRecommendations } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import {
  createRecommendation,
  updateRecommendation,
  deleteRecommendation,
} from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Empfehlungen · Wiesenhütte Manager" };

const inputBase =
  "rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm bg-white";

const CATEGORY_LABEL: Record<string, string> = {
  restaurant: "Restaurant / Café",
  einkauf: "Einkauf",
  aktivitaet: "Aktivität",
  sehenswuerdigkeit: "Sehenswürdigkeit",
  notdienst: "Notdienst",
  verleih: "Verleih",
};

export default async function EmpfehlungenManagerPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  const all = await db
    .select()
    .from(regionalRecommendations)
    .orderBy(asc(regionalRecommendations.category), asc(regionalRecommendations.sortOrder));

  return (
    <div className="px-8 py-10 max-w-[1200px]">
      <div className="eyebrow">Manager · Empfehlungen</div>
      <h1 className="text-[36px] mt-2 mb-1">Regionale Empfehlungen.</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 mb-8 max-w-2xl">
        Restaurants, Einkauf, Aktivitäten und Notdienste rund um die Hütte. Werden Gästen
        nach erfolgreicher Buchung und unter <code>/empfehlungen</code> angezeigt.
      </p>

      {all.length > 0 && (
        <div className="space-y-3 mb-12">
          {all.map((r) => (
            <details
              key={r.id}
              className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] overflow-hidden"
            >
              <summary className="cursor-pointer p-4 hover:bg-[var(--color-wh-beige)]/40">
                <div className="flex items-start gap-3">
                  {r.imageUrl && (
                    <div className="relative w-16 h-16 rounded overflow-hidden bg-[var(--color-wh-beige)] shrink-0">
                      <Image src={r.imageUrl} alt="" fill className="object-cover" sizes="64px" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider font-bold bg-[var(--color-wh-beige)] text-[var(--color-wh-deep-green)] px-2 py-0.5 rounded-full">
                        {CATEGORY_LABEL[r.category] ?? r.category}
                      </span>
                      {!r.active && (
                        <span className="text-[10px] uppercase tracking-wider text-[var(--color-wh-fg-muted)]">
                          Inaktiv
                        </span>
                      )}
                      {r.seasonalOnly && (
                        <span className="text-[10px] uppercase tracking-wider text-amber-700">
                          nur {r.seasonalOnly}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-[15px] text-[var(--color-wh-deep-green)] m-0">
                      {r.name}
                    </p>
                    <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0">
                      {r.address}
                      {r.distanceFromHuetteKm !== null && ` · ${r.distanceFromHuetteKm} km`}
                    </p>
                  </div>
                </div>
              </summary>
              <div className="p-5 border-t border-[var(--color-wh-winter-grey)]/40">
                <RecommendationEditForm rec={r} />
              </div>
            </details>
          ))}
        </div>
      )}

      {/* Neue Empfehlung */}
      <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
        <h2 className="text-[20px] m-0 mb-4">Neue Empfehlung anlegen</h2>
        <form
          action={async (fd) => {
            "use server";
            await createRecommendation(fd);
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

function RecommendationEditForm({
  rec,
}: {
  rec: typeof regionalRecommendations.$inferSelect;
}) {
  return (
    <>
      <form
        action={async (fd) => {
          "use server";
          await updateRecommendation(fd);
        }}
        className="space-y-3"
      >
        <input type="hidden" name="id" value={rec.id} />
        <FormBody initial={rec} />
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
          await deleteRecommendation(fd);
        }}
        className="mt-3 pt-3 border-t border-[var(--color-wh-winter-grey)]/40"
      >
        <input type="hidden" name="id" value={rec.id} />
        <button
          type="submit"
          className="rounded-full border border-red-300 text-red-700 px-4 py-1.5 text-xs hover:bg-red-50"
        >
          Empfehlung löschen
        </button>
      </form>
    </>
  );
}

function FormBody({
  initial,
}: {
  initial?: typeof regionalRecommendations.$inferSelect;
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Name *
          </label>
          <input
            type="text"
            name="name"
            defaultValue={initial?.name ?? ""}
            required
            className={`${inputBase} w-full`}
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Kategorie *
          </label>
          <select
            name="category"
            defaultValue={initial?.category ?? "restaurant"}
            className={`${inputBase} w-full`}
          >
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
          Beschreibung
        </label>
        <textarea
          name="description"
          defaultValue={initial?.description ?? ""}
          rows={3}
          className={`${inputBase} w-full`}
        />
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
          Adresse
        </label>
        <input
          type="text"
          name="address"
          defaultValue={initial?.address ?? ""}
          className={`${inputBase} w-full`}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Website-URL
          </label>
          <input
            type="url"
            name="websiteUrl"
            defaultValue={initial?.websiteUrl ?? ""}
            className={`${inputBase} w-full`}
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Telefon
          </label>
          <input
            type="tel"
            name="phone"
            defaultValue={initial?.phone ?? ""}
            className={`${inputBase} w-full`}
          />
        </div>
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
          Öffnungszeiten (Freitext)
        </label>
        <input
          type="text"
          name="openingHours"
          defaultValue={initial?.openingHours ?? ""}
          placeholder="z.B. Mo-So 8-22 Uhr"
          className={`${inputBase} w-full`}
        />
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
          Cover-Bild-URL
        </label>
        <input
          type="url"
          name="imageUrl"
          defaultValue={initial?.imageUrl ?? ""}
          placeholder="https://..."
          className={`${inputBase} w-full`}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Distanz (km)
          </label>
          <input
            type="number"
            step="0.1"
            name="distanceFromHuetteKm"
            defaultValue={initial?.distanceFromHuetteKm ?? ""}
            className={`${inputBase} w-full text-right`}
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Lat
          </label>
          <input
            type="number"
            step="0.000001"
            name="lat"
            defaultValue={initial?.lat ?? ""}
            className={`${inputBase} w-full font-mono`}
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Lng
          </label>
          <input
            type="number"
            step="0.000001"
            name="lng"
            defaultValue={initial?.lng ?? ""}
            className={`${inputBase} w-full font-mono`}
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
            Saison
          </label>
          <select
            name="seasonalOnly"
            defaultValue={initial?.seasonalOnly ?? ""}
            className={`${inputBase} w-full`}
          >
            <option value="">ganzjährig</option>
            <option value="winter">nur Winter</option>
            <option value="sommer">nur Sommer</option>
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
      <label className="flex items-center gap-2 text-sm pt-1">
        <input type="checkbox" name="active" defaultChecked={initial?.active ?? true} />
        Aktiv (öffentlich sichtbar)
      </label>
    </>
  );
}
