"use client";

import { useMemo, useState } from "react";
import { Clock, Users, Wallet, MapPin, Info } from "lucide-react";
import { FAHRT_MODULE, type FahrtModul, type FahrtBadge } from "./data";

// Grober Richtwert, kein exaktes Zeitbudget: eine 4-Tage-Fahrt (3 Nächte)
// hat An- und Abreisetag, bleiben ~2 volle Tage für Programm. Dient nur
// dazu, der Lehrkraft ein Gefuehl fuer "passt das zusammen" zu geben --
// siehe Feedback zur Berechenbarkeit auf /projekte.
const TAGE_VERFUEGBAR = 2;

const BADGE_STYLE: Record<FahrtBadge, string> = {
  schule: "bg-[var(--color-wh-deep-green)] text-white",
  extern: "bg-[var(--color-wh-sunset)] text-white",
  selbst: "bg-white border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-black)]",
};

const MAIL_TO = "hello@wiesenhuette.de";

function buildMailto(gewaehlt: FahrtModul[], summe: number): string {
  const subject = "Fahrten-Anfrage Wiesenhütte";
  const zeilen = gewaehlt.map((m) => `– ${m.titel}`).join("\n");
  const body = [
    "Hallo,",
    "",
    "wir überlegen, folgende Angebote in unsere Fahrt einzubauen:",
    "",
    zeilen || "(noch nichts ausgewählt)",
    "",
    `Grobe Gesamtauslastung: ca. ${summe.toFixed(1)} von ${TAGE_VERFUEGBAR} verfügbaren Tagen.`,
    "",
    "Klasse/Gruppe: ",
    "Wunschtermin: ",
    "",
    "Viele Grüße",
  ].join("\n");
  return `mailto:${MAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function FahrtenBaukasten() {
  const [ausgewaehlt, setAusgewaehlt] = useState<Record<string, boolean>>({});

  const gewaehlteModule = useMemo(
    () => FAHRT_MODULE.filter((m) => ausgewaehlt[m.id]),
    [ausgewaehlt]
  );
  const summe = useMemo(
    () => gewaehlteModule.reduce((s, m) => s + m.tagesanteil, 0),
    [gewaehlteModule]
  );

  const status =
    summe === 0
      ? { label: "Wählt Angebote aus, um eure Fahrt zusammenzustellen.", color: "text-[var(--color-wh-fg-muted)]", bar: "bg-[var(--color-wh-winter-grey)]" }
      : summe <= 1.5
        ? { label: "Gut machbar neben den Bau-Bausteinen.", color: "text-[var(--color-wh-deep-green)]", bar: "bg-[var(--color-wh-deep-green)]" }
        : summe <= TAGE_VERFUEGBAR
          ? { label: "Knapp, aber passt in den Rahmen.", color: "text-[var(--color-wh-wood)]", bar: "bg-[var(--color-wh-wood)]" }
          : { label: "Das wird eng — überlegt, was ihr streicht.", color: "text-[var(--color-wh-sunset)]", bar: "bg-[var(--color-wh-sunset)]" };

  const toggle = (id: string) => setAusgewaehlt((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {FAHRT_MODULE.map((m) => {
          const checked = !!ausgewaehlt[m.id];
          return (
            <article
              key={m.id}
              className={`bg-white border rounded-[var(--radius-card)] p-6 flex flex-col transition-colors ${
                checked ? "border-[var(--color-wh-deep-green)] ring-1 ring-[var(--color-wh-deep-green)]" : "border-[var(--color-wh-winter-grey)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${BADGE_STYLE[m.badge]}`}
                >
                  {m.badgeNote}
                </span>
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-wh-deep-green)] cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(m.id)}
                    className="w-4 h-4 accent-[var(--color-wh-deep-green)] cursor-pointer"
                  />
                  Dabei
                </label>
              </div>

              <h3 className="font-display font-bold text-[19px] text-[var(--color-wh-deep-green)] mt-0 mb-2">
                {m.titel}
              </h3>
              <p className="text-[14px] text-[var(--color-wh-black)] mb-2">{m.vision}</p>
              {m.themen && (
                <p className="text-[12.5px] text-[var(--color-wh-fg-muted)] mb-3">
                  <strong className="text-[var(--color-wh-black)]">Themen wählbar:</strong> {m.themen}
                </p>
              )}

              {m.links && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {m.links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noopener"
                      className="text-[12.5px] no-underline text-[var(--color-wh-deep-green)] border border-[var(--color-wh-winter-grey)] rounded-full px-3 py-1 hover:bg-[var(--color-wh-deep-green)] hover:text-white transition-colors"
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              )}

              <details className="mt-auto pt-3 border-t border-[var(--color-wh-winter-grey)] group">
                <summary className="text-[12px] uppercase tracking-wider font-semibold text-[var(--color-wh-wood)] cursor-pointer list-none flex items-center gap-1.5">
                  <Info size={13} /> Für Lehrkräfte: Planung
                </summary>
                <div className="flex flex-col gap-2.5 mt-3">
                  <Fact icon={Clock} label="Dauer" value={m.dauer} />
                  <Fact icon={Users} label="Gruppe" value={m.gruppe} />
                  <Fact icon={Wallet} label="Kosten" value={m.kosten} />
                  {m.vorlauf && (
                    <p className="text-[12.5px] text-[var(--color-wh-fg-muted)] italic m-0">{m.vorlauf}</p>
                  )}
                </div>
              </details>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dashed border-[var(--color-wh-winter-grey)] text-[13px] text-[var(--color-wh-fg-muted)]">
                <MapPin size={14} className="text-[var(--color-wh-sunset)] shrink-0" strokeWidth={1.8} />
                <span>{m.wayfind}</span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p className={`text-[14px] font-semibold m-0 ${status.color}`}>{status.label}</p>
          <p className="text-[13px] text-[var(--color-wh-fg-muted)] m-0">
            {summe.toFixed(1)} / {TAGE_VERFUEGBAR} Tagen ausgewählt
          </p>
        </div>
        <div className="h-2 rounded-full bg-[var(--color-wh-beige)] overflow-hidden mb-4">
          <div
            className={`h-full ${status.bar} transition-all`}
            style={{ width: `${Math.min(100, (summe / TAGE_VERFUEGBAR) * 100)}%` }}
          />
        </div>
        <p className="text-[12px] text-[var(--color-wh-fg-muted)] m-0 mb-4">
          Grober Richtwert für eine 4-Tage-Fahrt (3 Nächte) — An- und Abreisetag sind hier schon
          raus. Lässt sich zusätzlich mit den{" "}
          <a href="/projekte" className="text-[var(--color-wh-deep-green)] font-semibold">
            Bau-Bausteinen
          </a>{" "}
          rund um die Hütte kombinieren.
        </p>
        <a
          href={buildMailto(gewaehlteModule, summe)}
          className={`inline-flex h-11 px-6 items-center rounded-full font-semibold no-underline transition-colors ${
            gewaehlteModule.length > 0
              ? "bg-[var(--color-wh-deep-green)] text-white hover:bg-[var(--color-wh-deep-green-hover)]"
              : "bg-[var(--color-wh-winter-grey)] text-[var(--color-wh-fg-muted)] pointer-events-none"
          }`}
        >
          Auswahl anfragen{gewaehlteModule.length > 0 ? ` (${gewaehlteModule.length})` : ""}
        </a>
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon size={16} className="text-[var(--color-wh-deep-green)] mt-0.5 shrink-0" strokeWidth={1.8} />
      <span>
        <span className="block text-[11px] uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)]">
          {label}
        </span>
        <span className="block text-[var(--color-wh-black)]">{value}</span>
      </span>
    </div>
  );
}
