/**
 * Tagesmittel der Außentemperatur für die Energie-Auswertung (Open-Meteo,
 * kostenlos, ohne Schlüssel — wie das Wetter-Widget in weather.ts). Das
 * Archiv reicht bis gestern; die letzten Tage füllt die Vorhersage-API mit
 * past_days auf. Fehler sind unkritisch: Die Energie-Seite zeigt dann
 * einfach keine Temperaturen.
 */

const LAT = 51.21;
const LON = 8.49; // Winterberg-Langewiese
const TZ = "Europe%2FBerlin";

type DailyResponse = { daily?: { time: string[]; temperature_2m_mean: (number | null)[] } };

const collect = (json: DailyResponse, into: Map<string, number>) => {
  const d = json.daily;
  if (!d) return;
  d.time.forEach((day, i) => {
    const t = d.temperature_2m_mean[i];
    if (typeof t === "number") into.set(day, t);
  });
};

/** Tagesmittel (°C) je Datum im Bereich [from, to]. */
export async function fetchDailyMeanTemps(from: string, to: string): Promise<Map<string, number>> {
  const temps = new Map<string, number>();
  const opts = { next: { revalidate: 21_600 } } as const; // 6 h Cache
  try {
    const archive = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${LAT}&longitude=${LON}&start_date=${from}&end_date=${to}&daily=temperature_2m_mean&timezone=${TZ}`,
      opts
    );
    if (archive.ok) collect((await archive.json()) as DailyResponse, temps);
  } catch (err) {
    console.error("[weather-history] Archiv nicht erreichbar:", err);
  }
  try {
    const recent = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&past_days=14&forecast_days=1&daily=temperature_2m_mean&timezone=${TZ}`,
      opts
    );
    if (recent.ok) {
      const extra = new Map<string, number>();
      collect((await recent.json()) as DailyResponse, extra);
      for (const [day, t] of extra) if (!temps.has(day) && day >= from && day <= to) temps.set(day, t);
    }
  } catch (err) {
    console.error("[weather-history] Vorhersage nicht erreichbar:", err);
  }
  return temps;
}
