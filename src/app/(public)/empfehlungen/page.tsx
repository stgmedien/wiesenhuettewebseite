import { db } from "@/lib/db";
import { regionalRecommendations } from "@/lib/db/schema";
import { asc, eq, and, or, isNull } from "drizzle-orm";
import Image from "next/image";
import { Utensils, ShoppingBasket, Mountain, Compass, Stethoscope, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Empfehlungen rund um die Hütte · Wiesenhütte",
  description:
    "Restaurants, Einkauf, Aktivitäten und Notdienste rund um Langewiese — kuratiert von den Skifreunden Gütersloh.",
};

const CATEGORY_META: Record<string, { label: string; description: string; icon: React.ElementType }> = {
  restaurant: { label: "Essen & Trinken", description: "Wo Du Dich satt essen kannst", icon: Utensils },
  einkauf: { label: "Einkauf", description: "Supermarkt & Hofläden in der Nähe", icon: ShoppingBasket },
  aktivitaet: { label: "Aktivitäten", description: "Was Du im Sauerland erleben kannst", icon: Mountain },
  sehenswuerdigkeit: { label: "Sehenswürdigkeiten", description: "Lohnt sich für einen Ausflug", icon: Compass },
  notdienst: { label: "Notdienste", description: "Apotheke, Arzt, Polizei", icon: Stethoscope },
  verleih: { label: "Verleih", description: "Skiverleih & Co.", icon: Wrench },
};

const CATEGORY_ORDER = ["restaurant", "einkauf", "aktivitaet", "sehenswuerdigkeit", "verleih", "notdienst"];

function currentSeason(): "winter" | "sommer" {
  const m = new Date().getMonth() + 1;
  return m >= 11 || m <= 3 ? "winter" : "sommer";
}

export default async function EmpfehlungenPage() {
  const season = currentSeason();
  const all = await db
    .select()
    .from(regionalRecommendations)
    .where(
      and(
        eq(regionalRecommendations.active, true),
        or(
          isNull(regionalRecommendations.seasonalOnly),
          eq(regionalRecommendations.seasonalOnly, season)
        )
      )
    )
    .orderBy(asc(regionalRecommendations.sortOrder), asc(regionalRecommendations.name));

  // Nach Kategorie gruppieren
  const byCategory = new Map<string, typeof all>();
  for (const r of all) {
    const arr = byCategory.get(r.category) ?? [];
    arr.push(r);
    byCategory.set(r.category, arr);
  }

  return (
    <div>
      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow mb-3">Vor Ort</div>
          <h1 className="text-[36px] sm:text-[56px] m-0 mb-4 leading-[1.05] font-display font-bold text-[var(--color-wh-deep-green)]">
            Was rund um die Hütte lohnt.
          </h1>
          <p className="text-[16px] sm:text-[18px] leading-relaxed max-w-2xl text-[var(--color-wh-black)] m-0">
            Kuratierte Tipps für Deinen Aufenthalt — wo Du essen, einkaufen, etwas erleben oder
            im Notfall Hilfe finden kannst. Von Stammgästen + Vorstand zusammengetragen.
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-12 sm:py-16">
        <div className="max-w-[1080px] mx-auto">
          {all.length === 0 ? (
            <p className="text-[var(--color-wh-fg-muted)] italic text-center">
              Demnächst — die ersten Empfehlungen werden gerade kuratiert.
            </p>
          ) : (
            <div className="space-y-12">
              {CATEGORY_ORDER.map((cat) => {
                const items = byCategory.get(cat);
                if (!items || items.length === 0) return null;
                const meta = CATEGORY_META[cat];
                const Icon = meta?.icon ?? Mountain;
                return (
                  <section key={cat}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-wh-deep-green)]/10 text-[var(--color-wh-deep-green)] flex items-center justify-center">
                        <Icon size={20} />
                      </div>
                      <div>
                        <h2 className="font-display font-bold text-[22px] sm:text-[26px] text-[var(--color-wh-deep-green)] m-0 leading-none">
                          {meta?.label ?? cat}
                        </h2>
                        {meta?.description && (
                          <p className="text-[13px] text-[var(--color-wh-fg-muted)] m-0 mt-0.5">
                            {meta.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
                      {items.map((r) => (
                        <li key={r.id} className="m-0">
                          <article className="h-full bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] overflow-hidden flex flex-col">
                            {r.imageUrl && (
                              <div className="relative aspect-[16/10] bg-[var(--color-wh-beige)]">
                                <Image
                                  src={r.imageUrl}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
                                />
                              </div>
                            )}
                            <div className="p-5 flex-1 flex flex-col">
                              <h3 className="font-display font-bold text-[17px] sm:text-[18px] text-[var(--color-wh-deep-green)] m-0 mb-1.5 leading-tight">
                                {r.name}
                              </h3>
                              {r.description && (
                                <p className="text-[13px] sm:text-[14px] text-[var(--color-wh-black)] m-0 mb-3 line-clamp-3">
                                  {r.description}
                                </p>
                              )}
                              {r.address && (
                                <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0 mb-1">
                                  📍 {r.address}
                                  {r.distanceFromHuetteKm !== null &&
                                    ` · ${r.distanceFromHuetteKm} km`}
                                </p>
                              )}
                              {r.openingHours && (
                                <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0 mb-1">
                                  🕒 {r.openingHours}
                                </p>
                              )}
                              <div className="flex gap-3 mt-3 pt-3 border-t border-[var(--color-wh-winter-grey)]/40 text-[13px]">
                                {r.phone && (
                                  <a
                                    href={`tel:${r.phone}`}
                                    className="text-[var(--color-wh-deep-green)] font-semibold no-underline hover:underline"
                                  >
                                    📞 {r.phone}
                                  </a>
                                )}
                                {r.websiteUrl && (
                                  <a
                                    href={r.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[var(--color-wh-deep-green)] font-semibold no-underline hover:underline ml-auto"
                                  >
                                    Website ↗
                                  </a>
                                )}
                              </div>
                            </div>
                          </article>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
