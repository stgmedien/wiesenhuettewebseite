import { db } from "@/lib/db";
import { hikingRoutes } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  DIFFICULTY_BADGE_CLASS,
  DIFFICULTY_LABEL,
  formatDuration,
  formatDistance,
  formatElevation,
  type Difficulty,
} from "@/lib/hiking";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const row = (
    await db.select().from(hikingRoutes).where(eq(hikingRoutes.slug, slug)).limit(1)
  )[0];
  if (!row) return { title: "Wandertour nicht gefunden · Wiesenhütte" };
  return {
    title: `${row.name} · Wandertour Wiesenhütte`,
    description: row.summary ?? `Wandertour rund um Langewiese, ${DIFFICULTY_LABEL[row.difficulty as Difficulty]}`,
  };
}

export default async function HikingRouteDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const row = (
    await db
      .select()
      .from(hikingRoutes)
      .where(and(eq(hikingRoutes.slug, slug), eq(hikingRoutes.active, true)))
      .limit(1)
  )[0];
  if (!row) notFound();

  const description = (row.description || "").trim();
  const paragraphs = description ? description.split(/\n\n+/).filter(Boolean) : [];

  const mapsLink =
    row.startLat !== null && row.startLng !== null
      ? `https://www.google.com/maps/dir/?api=1&destination=${row.startLat},${row.startLng}&travelmode=driving`
      : null;

  return (
    <div>
      {/* Hero */}
      {row.coverImageUrl ? (
        <div className="relative w-full bg-[var(--color-wh-deep-green)] min-h-[300px] sm:min-h-0 sm:aspect-[16/9] md:aspect-[21/9]" style={{ maxHeight: "520px" }}>
          <Image
            src={row.coverImageUrl}
            alt={row.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(47,74,53,0.85)] via-[rgba(47,74,53,0.2)] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-6 sm:px-8 pb-6 sm:pb-10">
            <div className="max-w-[1080px] mx-auto">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider font-bold ${
                    DIFFICULTY_BADGE_CLASS[row.difficulty as Difficulty] ?? "bg-gray-100"
                  }`}
                >
                  {DIFFICULTY_LABEL[row.difficulty as Difficulty] ?? row.difficulty}
                </span>
              </div>
              <h1 className="text-[32px] sm:text-[48px] md:text-[56px] m-0 text-white leading-[1.05] drop-shadow-md font-display font-bold">
                {row.name}
              </h1>
            </div>
          </div>
        </div>
      ) : (
        <section className="bg-[var(--color-wh-deep-green)] text-white px-6 sm:px-8 py-16 sm:py-24">
          <div className="max-w-[1080px] mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider font-bold ${
                  DIFFICULTY_BADGE_CLASS[row.difficulty as Difficulty] ?? "bg-gray-100"
                }`}
              >
                {DIFFICULTY_LABEL[row.difficulty as Difficulty] ?? row.difficulty}
              </span>
            </div>
            <h1 className="text-[36px] sm:text-[56px] m-0 leading-[1.05] font-display font-bold">
              {row.name}
            </h1>
          </div>
        </section>
      )}

      <section className="bg-[var(--color-wh-snow)] px-6 sm:px-8 py-12 sm:py-16">
        <div className="max-w-[760px] mx-auto">
          {/* Stat-Box */}
          <div className="grid grid-cols-3 gap-4 bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5 mb-8">
            <Stat label="Distanz" value={formatDistance(row.distanceKm)} />
            <Stat label="Höhenmeter" value={formatElevation(row.elevationGainM)} />
            <Stat label="Dauer" value={formatDuration(row.durationMinutes)} />
          </div>

          {/* Summary */}
          {row.summary && (
            <p className="text-[18px] sm:text-[20px] leading-relaxed text-[var(--color-wh-black)] italic mb-8">
              {row.summary}
            </p>
          )}

          {/* Description (Multi-Absatz, plain text) */}
          {paragraphs.length > 0 && (
            <div className="prose-block space-y-4 mb-10">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-[16px] leading-relaxed whitespace-pre-wrap">
                  {p}
                </p>
              ))}
            </div>
          )}

          {/* Action-Buttons */}
          <div className="flex flex-wrap gap-3 mb-10">
            {row.gpxUrl && (
              <a
                href={row.gpxUrl}
                download={`${row.slug}.gpx`}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2.5 text-sm font-semibold no-underline hover:opacity-90"
              >
                ⬇ GPX herunterladen
              </a>
            )}
            {mapsLink && (
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] px-5 py-2.5 text-sm font-semibold no-underline hover:bg-[var(--color-wh-beige)]"
              >
                🗺 Anfahrt zum Startpunkt
              </a>
            )}
          </div>

          {/* GPX-Hilfe */}
          {row.gpxUrl && (
            <details className="bg-[var(--color-wh-beige)] rounded-[var(--radius-md)] p-4 mb-8 text-[14px] cursor-pointer">
              <summary className="font-semibold text-[var(--color-wh-deep-green)]">
                Wie nutze ich die GPX-Datei?
              </summary>
              <div className="pt-3 space-y-2 text-[14px] leading-relaxed">
                <p className="m-0">
                  <strong>Komoot:</strong> App öffnen → Profil → „Importieren" → GPX-Datei auswählen
                  → Tour ist offline-tauglich gespeichert.
                </p>
                <p className="m-0">
                  <strong>Outdooractive:</strong> App → „+" → „GPX importieren" → Datei wählen.
                </p>
                <p className="m-0">
                  <strong>Garmin Connect / Garmin-Uhr:</strong> Connect-Web öffnen → Training →
                  Strecken → „Strecke importieren" → an Uhr senden.
                </p>
                <p className="m-0">
                  <strong>Apple/Google Maps:</strong> unterstützen GPX nicht direkt — nutze
                  Komoot oder Outdooractive zum Navigieren.
                </p>
              </div>
            </details>
          )}

          <Link
            href="/wandertouren"
            className="text-[14px] text-[var(--color-wh-deep-green)] no-underline hover:underline"
          >
            ← zurück zur Tour-Übersicht
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] m-0 mb-1">
        {label}
      </p>
      <p className="font-display font-bold text-[20px] sm:text-[22px] text-[var(--color-wh-deep-green)] m-0">
        {value}
      </p>
    </div>
  );
}
