import { db } from "@/lib/db";
import { hikingRoutes } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { createHikingRoute, updateHikingRoute, deleteHikingRoute } from "./actions";
import {
  DIFFICULTY_BADGE_CLASS,
  DIFFICULTY_LABEL,
  formatDuration,
  formatDistance,
  formatElevation,
} from "@/lib/hiking";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wandertouren · Wiesenhütte Manager" };

const inputBase =
  "rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 text-sm bg-white";

export default async function WandertourenManagerPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  const routes = await db
    .select()
    .from(hikingRoutes)
    .orderBy(asc(hikingRoutes.sortOrder), asc(hikingRoutes.name));

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[1200px]">
      <div className="eyebrow">Manager · Wandertouren</div>
      <h1 className="text-[36px] mt-2 mb-1">Routen rund um Langewiese.</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 mb-8">
        Kuratierte Wanderrouten mit GPX-Datei zum Download für Komoot, Outdooractive oder
        Garmin. Werden Gästen auf der öffentlichen <code>/wandertouren</code>-Seite gezeigt.
      </p>

      {/* Liste vorhandener Routen */}
      {routes.length > 0 && (
        <div className="space-y-4 mb-12">
          {routes.map((r) => (
            <details
              key={r.id}
              className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] overflow-hidden"
            >
              <summary className="cursor-pointer p-5 hover:bg-[var(--color-wh-beige)]/40 transition">
                <div className="flex items-start gap-4">
                  {r.coverImageUrl && (
                    <div className="relative w-20 h-20 rounded-md overflow-hidden bg-[var(--color-wh-beige)] shrink-0">
                      <Image
                        src={r.coverImageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${
                          DIFFICULTY_BADGE_CLASS[r.difficulty as keyof typeof DIFFICULTY_BADGE_CLASS] ??
                          "bg-gray-100"
                        }`}
                      >
                        {DIFFICULTY_LABEL[r.difficulty as keyof typeof DIFFICULTY_LABEL] ??
                          r.difficulty}
                      </span>
                      {!r.active && (
                        <span className="text-[10px] uppercase tracking-wider text-[var(--color-wh-fg-muted)]">
                          Inaktiv
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-[var(--color-wh-fg-muted)] ml-auto">
                        /{r.slug}
                      </span>
                    </div>
                    <p className="font-semibold text-[16px] text-[var(--color-wh-deep-green)] m-0">
                      {r.name}
                    </p>
                    <p className="text-[13px] text-[var(--color-wh-fg-muted)] m-0 mt-0.5">
                      {formatDistance(r.distanceKm)} · {formatElevation(r.elevationGainM)} ·{" "}
                      {formatDuration(r.durationMinutes)}
                      {r.gpxUrl && " · GPX ✓"}
                    </p>
                  </div>
                </div>
              </summary>

              <div className="p-5 border-t border-[var(--color-wh-winter-grey)]/40">
                <form
                  action={async (fd) => {
                    "use server";
                    await updateHikingRoute(fd);
                  }}
                  encType="multipart/form-data"
                  className="space-y-3"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={r.name}
                        required
                        className={`${inputBase} w-full`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                        Schwierigkeit
                      </label>
                      <select
                        name="difficulty"
                        defaultValue={r.difficulty}
                        className={`${inputBase} w-full`}
                      >
                        <option value="leicht">Leicht</option>
                        <option value="mittel">Mittel</option>
                        <option value="schwer">Schwer</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                      Kurz-Teaser
                    </label>
                    <input
                      type="text"
                      name="summary"
                      defaultValue={r.summary ?? ""}
                      maxLength={500}
                      className={`${inputBase} w-full`}
                      placeholder="z.B. Aussichtsreiche Tour rund um den Olsberg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                      Beschreibung (Multi-Absatz)
                    </label>
                    <textarea
                      name="description"
                      defaultValue={r.description ?? ""}
                      rows={6}
                      maxLength={8000}
                      className={`${inputBase} w-full font-mono text-[13px]`}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                        km
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        name="distanceKm"
                        defaultValue={r.distanceKm ?? ""}
                        className={`${inputBase} w-full text-right`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                        Höhenm.
                      </label>
                      <input
                        type="number"
                        name="elevationGainM"
                        defaultValue={r.elevationGainM ?? ""}
                        className={`${inputBase} w-full text-right`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                        Dauer (min)
                      </label>
                      <input
                        type="number"
                        name="durationMinutes"
                        defaultValue={r.durationMinutes ?? ""}
                        className={`${inputBase} w-full text-right`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                        Sortier-Index
                      </label>
                      <input
                        type="number"
                        name="sortOrder"
                        defaultValue={r.sortOrder}
                        className={`${inputBase} w-full text-right`}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <label className="text-[13px] flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="active"
                          defaultChecked={r.active}
                        />
                        Aktiv
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                        Start-Lat
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        name="startLat"
                        defaultValue={r.startLat ?? ""}
                        placeholder="51.276"
                        className={`${inputBase} w-full font-mono`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                        Start-Lng
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        name="startLng"
                        defaultValue={r.startLng ?? ""}
                        placeholder="8.483"
                        className={`${inputBase} w-full font-mono`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                        Neue GPX-Datei (optional, ersetzt vorhandene)
                      </label>
                      <input
                        type="file"
                        name="gpx"
                        accept=".gpx,application/gpx+xml,application/xml,text/xml"
                        className="text-sm w-full"
                      />
                      {r.gpxUrl && (
                        <p className="text-[11px] text-[var(--color-wh-fg-muted)] mt-1">
                          Aktuell: <a href={r.gpxUrl} className="underline">Download</a>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                        Neues Cover-Bild (optional)
                      </label>
                      <input
                        type="file"
                        name="coverImage"
                        accept="image/jpeg,image/png,image/webp"
                        className="text-sm w-full"
                      />
                    </div>
                  </div>
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
                    await deleteHikingRoute(fd);
                  }}
                  className="mt-3 pt-3 border-t border-[var(--color-wh-winter-grey)]/40"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-red-300 text-red-700 px-4 py-1.5 text-xs hover:bg-red-50"
                  >
                    Route löschen
                  </button>
                </form>
              </div>
            </details>
          ))}
        </div>
      )}

      {/* Neue Route anlegen */}
      <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
        <h2 className="text-[20px] m-0 mb-4">Neue Wandertour anlegen</h2>
        <form
          action={async (fd) => {
            "use server";
            await createHikingRoute(fd);
          }}
          encType="multipart/form-data"
          className="space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                Name *
              </label>
              <input type="text" name="name" required className={`${inputBase} w-full`} />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                Schwierigkeit *
              </label>
              <select name="difficulty" defaultValue="mittel" className={`${inputBase} w-full`}>
                <option value="leicht">Leicht</option>
                <option value="mittel">Mittel</option>
                <option value="schwer">Schwer</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
              Kurz-Teaser
            </label>
            <input type="text" name="summary" maxLength={500} className={`${inputBase} w-full`} />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
              Beschreibung
            </label>
            <textarea
              name="description"
              rows={6}
              maxLength={8000}
              className={`${inputBase} w-full font-mono text-[13px]`}
              placeholder="Mehrere Absätze. Wegbeschreibung, Highlights, Einkehr-Tipps."
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                km
              </label>
              <input type="number" step="0.1" name="distanceKm" className={`${inputBase} w-full text-right`} />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                Höhenm.
              </label>
              <input type="number" name="elevationGainM" className={`${inputBase} w-full text-right`} />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                Dauer (min)
              </label>
              <input type="number" name="durationMinutes" className={`${inputBase} w-full text-right`} />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                Sortier-Index
              </label>
              <input type="number" name="sortOrder" defaultValue={0} className={`${inputBase} w-full text-right`} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                Start-Lat
              </label>
              <input
                type="number"
                step="0.000001"
                name="startLat"
                placeholder="51.276"
                className={`${inputBase} w-full font-mono`}
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                Start-Lng
              </label>
              <input
                type="number"
                step="0.000001"
                name="startLng"
                placeholder="8.483"
                className={`${inputBase} w-full font-mono`}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                GPX-Datei
              </label>
              <input
                type="file"
                name="gpx"
                accept=".gpx,application/gpx+xml,application/xml,text/xml"
                className="text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-1">
                Cover-Bild
              </label>
              <input
                type="file"
                name="coverImage"
                accept="image/jpeg,image/png,image/webp"
                className="text-sm w-full"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm pt-2">
            <input type="checkbox" name="active" defaultChecked />
            Sofort aktiv (öffentlich sichtbar)
          </label>
          <div className="pt-3">
            <button
              type="submit"
              className="rounded-full bg-[var(--color-wh-deep-green)] text-white px-6 py-2.5 text-sm font-semibold"
            >
              Tour anlegen
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
