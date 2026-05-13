"use client";

import { useMemo, useState } from "react";
import {
  buildPackliste,
  renderItemQuantity,
  ACTIVITY_LABEL,
  SEASON_LABEL,
  type Activity,
  type PackInput,
  type Season,
} from "@/lib/packliste-rules";

const ACTIVITIES: Activity[] = ["wandern", "ski", "lagerfeuer", "klassenfahrt"];
const SEASONS: Season[] = ["winter", "uebergang", "sommer"];

const inputBase =
  "w-full rounded-lg border border-[var(--color-wh-winter-grey)] px-3 py-2 bg-white focus:border-[var(--color-wh-deep-green)] focus:outline-none text-[15px]";

function detectSeasonForToday(): Season {
  const m = new Date().getMonth() + 1; // 1-12
  if (m >= 12 || m <= 3) return "winter";
  if (m === 4 || m === 5 || m === 10 || m === 11) return "uebergang";
  return "sommer";
}

export function PacklisteClient() {
  const [season, setSeason] = useState<Season>(detectSeasonForToday());
  const [persons, setPersons] = useState(8);
  const [nights, setNights] = useState(3);
  const [activities, setActivities] = useState<Activity[]>(["wandern", "lagerfeuer"]);

  const input: PackInput = { season, persons, nights, activities };

  const cats = useMemo(() => buildPackliste(input), [season, persons, nights, activities]);

  const pdfUrl = useMemo(() => {
    const sp = new URLSearchParams({
      season,
      persons: String(persons),
      nights: String(nights),
    });
    if (activities.length > 0) sp.set("activities", activities.join(","));
    return `/api/packliste?${sp.toString()}`;
  }, [season, persons, nights, activities]);

  const toggleActivity = (a: Activity) => {
    setActivities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
      {/* Eingabe-Form */}
      <aside className="lg:sticky lg:top-24 lg:self-start bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
        <div className="eyebrow mb-2">Konfigurieren</div>
        <h2 className="text-[22px] font-display font-bold m-0 mb-5 text-[var(--color-wh-deep-green)]">
          Deine Tour.
        </h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Saison</label>
            <div className="grid grid-cols-1 gap-1.5">
              {SEASONS.map((s) => (
                <label
                  key={s}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${
                    season === s
                      ? "border-[var(--color-wh-deep-green)] bg-[var(--color-wh-beige)]"
                      : "border-[var(--color-wh-winter-grey)] hover:bg-[var(--color-wh-beige)]/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="season"
                    value={s}
                    checked={season === s}
                    onChange={() => setSeason(s)}
                    className="sr-only"
                  />
                  <span className="text-[14px]">{SEASON_LABEL[s]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Personen</label>
              <input
                type="number"
                min={1}
                max={40}
                value={persons}
                onChange={(e) => setPersons(Math.max(1, Math.min(40, Number(e.target.value) || 1)))}
                className={inputBase}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Übernachtungen</label>
              <input
                type="number"
                min={1}
                max={21}
                value={nights}
                onChange={(e) => setNights(Math.max(1, Math.min(21, Number(e.target.value) || 1)))}
                className={inputBase}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Geplante Aktivitäten (mehrere möglich)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {ACTIVITIES.map((a) => (
                <label
                  key={a}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition text-[13px] ${
                    activities.includes(a)
                      ? "border-[var(--color-wh-deep-green)] bg-[var(--color-wh-beige)]"
                      : "border-[var(--color-wh-winter-grey)] hover:bg-[var(--color-wh-beige)]/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={activities.includes(a)}
                    onChange={() => toggleActivity(a)}
                    className="sr-only"
                  />
                  <span>{ACTIVITY_LABEL[a]}</span>
                </label>
              ))}
            </div>
          </div>

          <a
            href={pdfUrl}
            download={`packliste-wiesenhuette-${season}-${persons}p-${nights}n.pdf`}
            className="block text-center rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-3 text-sm font-semibold no-underline hover:opacity-90"
          >
            ⬇ Als PDF herunterladen
          </a>
          <p className="text-[11px] text-[var(--color-wh-fg-muted)] text-center mt-2 m-0">
            Druckfreundliches PDF mit Häkchen zum Abhaken
          </p>
        </div>
      </aside>

      {/* Live-Preview */}
      <div className="space-y-6">
        {cats.map((cat) => (
          <section
            key={cat.title}
            className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6"
          >
            <h3 className="font-display font-bold text-[18px] sm:text-[20px] text-[var(--color-wh-deep-green)] m-0 mb-4 pb-2 border-b border-[var(--color-wh-winter-grey)]/60">
              {cat.title}
            </h3>
            <ul className="list-none p-0 m-0 space-y-2.5">
              {cat.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] sm:text-[15px]">
                  <span className="w-4 h-4 rounded border-2 border-[var(--color-wh-deep-green)]/50 shrink-0 mt-0.5" />
                  <span className="font-mono text-[12px] text-[var(--color-wh-fg-muted)] w-10 shrink-0 pt-0.5">
                    {renderItemQuantity(item, persons)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block">{item.name}</span>
                    {item.hint && (
                      <span className="text-[12px] text-[var(--color-wh-fg-muted)] italic mt-0.5 block">
                        {item.hint}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
