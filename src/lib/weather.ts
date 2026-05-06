/**
 * Open-Meteo Wetter-Adapter fuer Langewiese, Hochsauerland (~770m).
 * Kein API-Key. Wir cachen mit Next.js fetch revalidate.
 */

const LATITUDE = 51.18; // Langewiese
const LONGITUDE = 8.68;
const ELEVATION = 770;

export type WeatherSnapshot = {
  asOf: string;
  current: {
    tempC: number;
    feelsLikeC: number;
    weatherCode: number;
    windKmh: number;
    snowDepthM: number;
    isDay: boolean;
  };
  daily: Array<{
    date: string;       // YYYY-MM-DD
    tempMaxC: number;
    tempMinC: number;
    snowfallSumCm: number;
    weatherCode: number;
  }>;
};

export type WeatherResult =
  | { ok: true; data: WeatherSnapshot }
  | { ok: false; error: string };

export const weatherCodeToText = (code: number): string => {
  // WMO-Wettercodes (gekuerzt)
  if (code === 0) return "Klar";
  if (code === 1 || code === 2) return "Leicht bewoelkt";
  if (code === 3) return "Bedeckt";
  if (code === 45 || code === 48) return "Nebel";
  if ((code >= 51 && code <= 57) || (code >= 61 && code <= 67)) return "Regen";
  if (code >= 71 && code <= 77) return "Schnee";
  if (code >= 80 && code <= 82) return "Regenschauer";
  if (code === 85 || code === 86) return "Schneeschauer";
  if (code >= 95) return "Gewitter";
  return "Wechselhaft";
};

export const weatherCodeToEmoji = (code: number, isDay: boolean = true): string => {
  if (code === 0) return isDay ? "☀️" : "🌙";
  if (code === 1 || code === 2) return isDay ? "🌤️" : "☁️";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if ((code >= 51 && code <= 57) || (code >= 61 && code <= 67)) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌦️";
  if (code === 85 || code === 86) return "🌨️";
  if (code >= 95) return "⛈️";
  return "🌥️";
};

export async function fetchWeather(): Promise<WeatherResult> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(LATITUDE));
  url.searchParams.set("longitude", String(LONGITUDE));
  url.searchParams.set("elevation", String(ELEVATION));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,snow_depth"
  );
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,weather_code,snowfall_sum"
  );
  url.searchParams.set("timezone", "Europe/Berlin");
  url.searchParams.set("forecast_days", "5");

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 1800 }, // 30 Min Cache
      headers: { "user-agent": "wiesenhuette.com weather widget" },
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const json = (await res.json()) as {
      current: {
        time: string;
        temperature_2m: number;
        apparent_temperature: number;
        is_day: 0 | 1;
        weather_code: number;
        wind_speed_10m: number;
        snow_depth: number;
      };
      daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        weather_code: number[];
        snowfall_sum: number[];
      };
    };

    return {
      ok: true,
      data: {
        asOf: json.current.time,
        current: {
          tempC: json.current.temperature_2m,
          feelsLikeC: json.current.apparent_temperature,
          weatherCode: json.current.weather_code,
          windKmh: json.current.wind_speed_10m,
          snowDepthM: json.current.snow_depth,
          isDay: json.current.is_day === 1,
        },
        daily: json.daily.time.map((date, i) => ({
          date,
          tempMaxC: json.daily.temperature_2m_max[i],
          tempMinC: json.daily.temperature_2m_min[i],
          weatherCode: json.daily.weather_code[i],
          snowfallSumCm: json.daily.snowfall_sum[i],
        })),
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "fetch failed" };
  }
}
