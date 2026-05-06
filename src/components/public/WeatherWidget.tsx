import { fetchWeather, weatherCodeToText, weatherCodeToEmoji } from "@/lib/weather";

export const WeatherWidget = async () => {
  const res = await fetchWeather();
  if (!res.ok) {
    return null; // silent fail — kein Wetter-Block, wenn der API-Call schiefgeht
  }
  const w = res.data;
  const cur = w.current;
  const snowCm = Math.round(cur.snowDepthM * 100);

  return (
    <section className="rounded-2xl bg-gradient-to-br from-[#2F4A35] to-[#1f3325] text-white p-6 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-wider opacity-70">
            Wetter · Langewiese (770 m)
          </p>
          <p className="font-heading text-2xl font-bold">{weatherCodeToText(cur.weatherCode)}</p>
        </div>
        <div className="text-5xl leading-none">
          {weatherCodeToEmoji(cur.weatherCode, cur.isDay)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <Stat label="Temp" value={`${Math.round(cur.tempC)}°C`} />
        <Stat label="Gefühlt" value={`${Math.round(cur.feelsLikeC)}°C`} />
        <Stat label="Wind" value={`${Math.round(cur.windKmh)} km/h`} />
      </div>

      {snowCm > 0 && (
        <div className="bg-white/10 rounded-lg p-3 mb-4">
          <p className="text-xs uppercase tracking-wider opacity-80">Schneehöhe vor Ort</p>
          <p className="font-heading text-xl font-bold">{snowCm} cm</p>
        </div>
      )}

      <div className="border-t border-white/15 pt-4">
        <p className="text-xs uppercase tracking-wider opacity-70 mb-2">5-Tage-Vorhersage</p>
        <ul className="space-y-1">
          {w.daily.map((d) => {
            const dayName = new Date(d.date).toLocaleDateString("de-DE", { weekday: "short" });
            return (
              <li key={d.date} className="flex items-center justify-between text-sm">
                <span className="w-12 opacity-90">{dayName}</span>
                <span className="text-lg w-8 text-center">
                  {weatherCodeToEmoji(d.weatherCode, true)}
                </span>
                {d.snowfallSumCm > 0 && (
                  <span className="opacity-80 text-xs w-16 text-right">
                    +{Math.round(d.snowfallSumCm)} cm ❄
                  </span>
                )}
                <span className="font-mono w-20 text-right">
                  {Math.round(d.tempMinC)}° / {Math.round(d.tempMaxC)}°
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-[10px] opacity-50 mt-3">
        Daten via Open-Meteo · {new Date(w.asOf).toLocaleString("de-DE")}
      </p>
    </section>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider opacity-70">{label}</p>
    <p className="font-heading text-lg font-bold">{value}</p>
  </div>
);
