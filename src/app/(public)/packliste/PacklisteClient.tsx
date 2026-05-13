"use client";

import { useMemo, useState } from "react";
import {
  buildPackliste,
  renderItemQuantity,
  type Activity,
  type PackInput,
  type Season,
} from "@/lib/packliste-rules";
import type { Locale } from "@/lib/i18n-shared";

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

type Copy = {
  eyebrow: string;
  h2: string;
  intro: string;
  seasonLabel: string;
  nightsLabel: string;
  activitiesLabel: string;
  download: string;
  downloadHint: string;
  seasonNames: Record<Season, string>;
  activityNames: Record<Activity, string>;
};

const COPY: Record<Locale, Copy> = {
  de: {
    eyebrow: "Konfigurieren",
    h2: "Deine Tour.",
    intro: "Die Liste ist für eine Person — jede:r packt für sich selbst. Gruppen-Items (Gewürze, Karten, Bluetooth-Box) findest Du in einer eigenen Sektion zum Absprechen.",
    seasonLabel: "Saison",
    nightsLabel: "Übernachtungen",
    activitiesLabel: "Geplante Aktivitäten (mehrere möglich)",
    download: "⬇ Als PDF herunterladen",
    downloadHint: "Druckfreundliches PDF mit Häkchen zum Abhaken",
    seasonNames: {
      winter: "Winter (Dezember–März)",
      uebergang: "Übergang (April–Mai · Oktober–November)",
      sommer: "Sommer (Juni–September)",
    },
    activityNames: {
      wandern: "Wandern",
      ski: "Ski / Langlauf",
      lagerfeuer: "Lagerfeuer-Abend",
      klassenfahrt: "Klassenfahrt / Gruppe",
    },
  },
  en: {
    eyebrow: "Configure",
    h2: "Your trip.",
    intro: "The list is for one person — everyone packs for themselves. Group items (spices, cards, Bluetooth speaker) are in their own \"coordinate with the group\" section.",
    seasonLabel: "Season",
    nightsLabel: "Nights",
    activitiesLabel: "Planned activities (multiple possible)",
    download: "⬇ Download as PDF",
    downloadHint: "Print-friendly PDF with checkboxes",
    seasonNames: {
      winter: "Winter (December–March)",
      uebergang: "Shoulder season (April–May · October–November)",
      sommer: "Summer (June–September)",
    },
    activityNames: {
      wandern: "Hiking",
      ski: "Skiing / cross-country",
      lagerfeuer: "Campfire evening",
      klassenfahrt: "School trip / group",
    },
  },
  nl: {
    eyebrow: "Instellen",
    h2: "Jouw verblijf.",
    intro: "De lijst is voor één persoon — iedereen pakt voor zichzelf. Groepsitems (kruiden, kaarten, Bluetooth-box) staan apart, om af te stemmen met de groep.",
    seasonLabel: "Seizoen",
    nightsLabel: "Nachten",
    activitiesLabel: "Geplande activiteiten (meerdere mogelijk)",
    download: "⬇ Download als PDF",
    downloadHint: "Afdrukbare PDF met aanvinkvakjes",
    seasonNames: {
      winter: "Winter (december–maart)",
      uebergang: "Tussenseizoen (april–mei · oktober–november)",
      sommer: "Zomer (juni–september)",
    },
    activityNames: {
      wandern: "Wandelen",
      ski: "Skiën / langlaufen",
      lagerfeuer: "Kampvuuravond",
      klassenfahrt: "Schoolreis / groep",
    },
  },
};

export function PacklisteClient({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const [season, setSeason] = useState<Season>(detectSeasonForToday());
  const [nights, setNights] = useState(3);
  const [activities, setActivities] = useState<Activity[]>(["wandern", "lagerfeuer"]);

  const input: PackInput = { season, nights, activities };

  const cats = useMemo(() => buildPackliste(input), [season, nights, activities]);

  const pdfUrl = useMemo(() => {
    const sp = new URLSearchParams({
      season,
      nights: String(nights),
    });
    if (activities.length > 0) sp.set("activities", activities.join(","));
    return `/api/packliste?${sp.toString()}`;
  }, [season, nights, activities]);

  const toggleActivity = (a: Activity) => {
    setActivities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
      {/* Eingabe-Form */}
      <aside className="lg:sticky lg:top-24 lg:self-start bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
        <div className="eyebrow mb-2">{c.eyebrow}</div>
        <h2 className="text-[22px] font-display font-bold m-0 mb-2 text-[var(--color-wh-deep-green)]">
          {c.h2}
        </h2>
        <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0 mb-5">{c.intro}</p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">{c.seasonLabel}</label>
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
                  <span className="text-[14px]">{c.seasonNames[s]}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{c.nightsLabel}</label>
            <input
              type="number"
              min={1}
              max={21}
              value={nights}
              onChange={(e) => setNights(Math.max(1, Math.min(21, Number(e.target.value) || 1)))}
              className={inputBase}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{c.activitiesLabel}</label>
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
                  <span>{c.activityNames[a]}</span>
                </label>
              ))}
            </div>
          </div>

          <a
            href={pdfUrl}
            download={`packliste-wiesenhuette-${season}-${nights}n.pdf`}
            className="block text-center rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-3 text-sm font-semibold no-underline hover:opacity-90"
          >
            {c.download}
          </a>
          <p className="text-[11px] text-[var(--color-wh-fg-muted)] text-center mt-2 m-0">
            {c.downloadHint}
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
                  <span className="font-mono text-[12px] text-[var(--color-wh-fg-muted)] w-8 shrink-0 pt-0.5">
                    {renderItemQuantity(item)}
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
