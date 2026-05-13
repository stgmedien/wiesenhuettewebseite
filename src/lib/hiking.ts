/**
 * Helpers für Wandertouren-Display und GPX-Validierung.
 */

export type Difficulty = "leicht" | "mittel" | "schwer";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  leicht: "Leicht",
  mittel: "Mittel",
  schwer: "Schwer",
};

export const DIFFICULTY_BADGE_CLASS: Record<Difficulty, string> = {
  leicht: "bg-emerald-100 text-emerald-800",
  mittel: "bg-amber-100 text-amber-900",
  schwer: "bg-red-100 text-red-800",
};

export function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h}:${m.toString().padStart(2, "0")} h`;
}

export function formatDistance(km: number | null): string {
  if (km === null || km === undefined) return "—";
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function formatElevation(m: number | null): string {
  if (m === null || m === undefined) return "—";
  return `${m} hm`;
}

/**
 * Sehr einfache GPX-Validierung: schaut nach Root-Tag <gpx ... >
 * und mind. einem <trkpt> oder <wpt>. Keine vollständige XML-Validierung.
 */
export function quickValidateGpx(content: string): { ok: true } | { ok: false; reason: string } {
  if (!content.includes("<gpx")) {
    return { ok: false, reason: "Kein GPX-Root-Tag gefunden." };
  }
  if (!content.includes("</gpx>")) {
    return { ok: false, reason: "GPX-Datei unvollständig (kein End-Tag)." };
  }
  if (!content.includes("<trkpt") && !content.includes("<wpt") && !content.includes("<rtept")) {
    return { ok: false, reason: "Keine Routenpunkte in GPX." };
  }
  return { ok: true };
}

/**
 * Slug generation aus Tour-Name. ä/ö/ü/ß → ae/oe/ue/ss.
 */
export function slugifyHikingRoute(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}
