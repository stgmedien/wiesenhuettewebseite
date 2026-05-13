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
import { getServerLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-shared";

export const dynamic = "force-dynamic";

const DETAIL_COPY: Record<Locale, {
  difficulty: Record<Difficulty, string>;
  stat: { distance: string; elevation: string; duration: string };
  cta: { download: string; directions: string };
  help: { h: string; komoot: string; outdoor: string; garmin: string; maps: string };
  back: string;
}> = {
  de: {
    difficulty: { leicht: "Leicht", mittel: "Mittel", schwer: "Schwer" },
    stat: { distance: "Distanz", elevation: "Höhenmeter", duration: "Dauer" },
    cta: { download: "⬇ GPX herunterladen", directions: "🗺 Anfahrt zum Startpunkt" },
    help: {
      h: "Wie nutze ich die GPX-Datei?",
      komoot: "App öffnen → Profil → „Importieren\" → GPX-Datei auswählen → Tour ist offline-tauglich gespeichert.",
      outdoor: "App → „+\" → „GPX importieren\" → Datei wählen.",
      garmin: "Connect-Web öffnen → Training → Strecken → „Strecke importieren\" → an Uhr senden.",
      maps: "unterstützen GPX nicht direkt — nutze Komoot oder Outdooractive zum Navigieren.",
    },
    back: "← zurück zur Tour-Übersicht",
  },
  en: {
    difficulty: { leicht: "Easy", mittel: "Moderate", schwer: "Difficult" },
    stat: { distance: "Distance", elevation: "Elevation gain", duration: "Duration" },
    cta: { download: "⬇ Download GPX", directions: "🗺 Directions to start" },
    help: {
      h: "How do I use the GPX file?",
      komoot: "Open app → Profile → \"Import\" → select GPX file → tour is saved offline-ready.",
      outdoor: "App → \"+\" → \"Import GPX\" → choose file.",
      garmin: "Open Connect web → Training → Courses → \"Import course\" → send to watch.",
      maps: "don't support GPX directly — use Komoot or Outdooractive to navigate.",
    },
    back: "← back to all routes",
  },
  nl: {
    difficulty: { leicht: "Makkelijk", mittel: "Middel", schwer: "Zwaar" },
    stat: { distance: "Afstand", elevation: "Hoogtemeters", duration: "Duur" },
    cta: { download: "⬇ GPX downloaden", directions: "🗺 Route naar start" },
    help: {
      h: "Hoe gebruik ik het GPX-bestand?",
      komoot: "App openen → Profiel → \"Importeren\" → GPX-bestand kiezen → tour is offline beschikbaar.",
      outdoor: "App → \"+\" → \"GPX importeren\" → bestand kiezen.",
      garmin: "Connect web openen → Trainen → Routes → \"Route importeren\" → naar horloge sturen.",
      maps: "ondersteunen GPX niet direct — gebruik Komoot of Outdooractive om te navigeren.",
    },
    back: "← terug naar alle routes",
  },
};

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
  const locale = await getServerLocale();
  const dc = DETAIL_COPY[locale];
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
                  {dc.difficulty[row.difficulty as Difficulty] ?? row.difficulty}
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
            <Stat label={dc.stat.distance} value={formatDistance(row.distanceKm)} />
            <Stat label={dc.stat.elevation} value={formatElevation(row.elevationGainM)} />
            <Stat label={dc.stat.duration} value={formatDuration(row.durationMinutes)} />
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
                {dc.cta.download}
              </a>
            )}
            {mapsLink && (
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] px-5 py-2.5 text-sm font-semibold no-underline hover:bg-[var(--color-wh-beige)]"
              >
                {dc.cta.directions}
              </a>
            )}
          </div>

          {/* GPX-Hilfe */}
          {row.gpxUrl && (
            <details className="bg-[var(--color-wh-beige)] rounded-[var(--radius-md)] p-4 mb-8 text-[14px] cursor-pointer">
              <summary className="font-semibold text-[var(--color-wh-deep-green)]">
                {dc.help.h}
              </summary>
              <div className="pt-3 space-y-2 text-[14px] leading-relaxed">
                <p className="m-0">
                  <strong>Komoot:</strong> {dc.help.komoot}
                </p>
                <p className="m-0">
                  <strong>Outdooractive:</strong> {dc.help.outdoor}
                </p>
                <p className="m-0">
                  <strong>Garmin Connect:</strong> {dc.help.garmin}
                </p>
                <p className="m-0">
                  <strong>Apple/Google Maps:</strong> {dc.help.maps}
                </p>
              </div>
            </details>
          )}

          <Link
            href="/wandertouren"
            className="text-[14px] text-[var(--color-wh-deep-green)] no-underline hover:underline"
          >
            {dc.back}
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
