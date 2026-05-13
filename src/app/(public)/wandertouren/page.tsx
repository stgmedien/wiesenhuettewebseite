import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { hikingRoutes } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import {
  DIFFICULTY_BADGE_CLASS,
  DIFFICULTY_LABEL,
  formatDuration,
  formatDistance,
  formatElevation,
  type Difficulty,
} from "@/lib/hiking";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Wandertouren rund um Langewiese · Wiesenhütte",
  description:
    "Kuratierte Wandertouren rund um die Wiesenhütte und Langewiese im Sauerland — mit GPX-Download für Komoot, Outdooractive und Garmin.",
};

export default async function WandertourenPage() {
  const routes = await db
    .select()
    .from(hikingRoutes)
    .where(eq(hikingRoutes.active, true))
    .orderBy(asc(hikingRoutes.sortOrder), asc(hikingRoutes.name));

  return (
    <div>
      <section className="bg-[var(--color-wh-beige)] px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className="eyebrow mb-3">Wandern</div>
          <h1 className="text-[36px] sm:text-[56px] m-0 mb-4 leading-[1.05] font-display font-bold text-[var(--color-wh-deep-green)]">
            Wandertouren rund um die Hütte.
          </h1>
          <p className="text-[16px] sm:text-[18px] leading-relaxed max-w-2xl text-[var(--color-wh-black)] m-0">
            Hand-kuratierte Routen direkt von der Wiesenhütte aus. Jede Tour mit Schwierigkeit,
            Distanz und Höhenmetern — und mit GPX-Datei, die Du direkt in Komoot, Outdooractive
            oder auf Dein Garmin laden kannst.
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-12 sm:py-16">
        <div className="max-w-[1080px] mx-auto">
          {routes.length === 0 ? (
            <p className="text-[var(--color-wh-fg-muted)] italic text-center">
              Demnächst — die ersten Touren werden gerade aufgenommen.
            </p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 list-none p-0 m-0">
              {routes.map((r) => (
                <li key={r.id} className="m-0">
                  <Link
                    href={`/wandertouren/${r.slug}`}
                    className="group block bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] overflow-hidden hover:shadow-md transition-shadow no-underline"
                  >
                    {r.coverImageUrl ? (
                      <div className="relative aspect-[16/10] bg-[var(--color-wh-beige)]">
                        <Image
                          src={r.coverImageUrl}
                          alt={r.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/10] bg-gradient-to-br from-[var(--color-wh-deep-green)]/30 to-[var(--color-wh-deep-green)]/10" />
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${
                            DIFFICULTY_BADGE_CLASS[r.difficulty as Difficulty] ??
                            "bg-gray-100"
                          }`}
                        >
                          {DIFFICULTY_LABEL[r.difficulty as Difficulty] ?? r.difficulty}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-[18px] sm:text-[20px] text-[var(--color-wh-deep-green)] m-0 mb-1.5 leading-snug">
                        {r.name}
                      </h3>
                      {r.summary && (
                        <p className="text-[13px] sm:text-[14px] text-[var(--color-wh-fg-muted)] m-0 mb-3 line-clamp-2">
                          {r.summary}
                        </p>
                      )}
                      <p className="text-[12px] text-[var(--color-wh-fg-muted)] font-mono m-0">
                        {formatDistance(r.distanceKm)} · {formatElevation(r.elevationGainM)} ·{" "}
                        {formatDuration(r.durationMinutes)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
