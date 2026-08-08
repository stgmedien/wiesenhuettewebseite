"use client";

// =============================================================
// Preis-Schnellcheck — kompakte Karte im Hero der Startseite.
// Groesste Buchungshuerde ist Preis-Unsicherheit: Anreise/Abreise +
// Personen waehlen → Gesamtpreis & Verfuegbarkeit in Sekunden, der
// CTA springt mit Vorauswahl (Query-Params) in den Buchungsflow.
// Die Berechnung laeuft debounced ueber die quickPrice-Server-Action
// (dieselbe Preis-/Verfuegbarkeits-Logik wie /buchen).
// =============================================================

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { formatEuro, RULES } from "@/lib/pricing";
import { toLocalIso } from "@/lib/utils";
import { quickPrice, type QuickPriceResult } from "@/app/(public)/quick-price/actions";

type QcLocale = "de" | "en" | "nl";

const QC_COPY: Record<QcLocale, {
  eyebrow: string;
  title: string;
  arrival: string;
  departure: string;
  adults: string;
  adultsHint: string;
  children: string;
  childrenHint: string;
  hintDates: (minNights: number) => string;
  hintPersons: string;
  hintMaxPersons: (max: number) => string;
  errorGeneric: string;
  loading: string;
  totalLabel: string;
  nights: (n: number) => string;
  extras: (deposit: string, kurtaxe: string) => string;
  minOccupancyNote: (floor: number) => string;
  badgeFree: string;
  badgeBooked: string;
  bookedHint: string;
  cta: string;
  ctaBooked: string;
  ariaLess: string;
  ariaMore: string;
}> = {
  de: {
    eyebrow: "Preis-Schnellcheck",
    title: "Was kostet euer Aufenthalt?",
    arrival: "Anreise",
    departure: "Abreise",
    adults: "Erwachsene",
    adultsHint: "ab 16 J.",
    children: "Kinder",
    childrenHint: "4–15 J.",
    hintDates: (n) => `Wählt Anreise & Abreise (mind. ${n} Nächte) — der Preis erscheint sofort.`,
    hintPersons: "Mindestens 1 Person angeben.",
    hintMaxPersons: (max) => `Maximal ${max} Personen.`,
    errorGeneric: "Der Preis konnte gerade nicht berechnet werden — bitte versucht es gleich noch einmal.",
    loading: "Preis wird berechnet …",
    totalLabel: "Gesamtpreis",
    nights: (n) => `${n} Nächte`,
    extras: (dep, kur) => `zzgl. ${dep} Kaution + ${kur} Kurtaxe`,
    minOccupancyNote: (floor) =>
      `Unter ${floor} Personen gilt das ${floor}-Personen-Preisniveau (bereits eingerechnet).`,
    badgeFree: "Zeitraum frei",
    badgeBooked: "Belegt",
    bookedHint: "Dieser Zeitraum ist leider belegt — im Kalender findet ihr freie Termine.",
    cta: "Weiter zur Buchung",
    ctaBooked: "Freie Termine ansehen",
    ariaLess: "Weniger",
    ariaMore: "Mehr",
  },
  en: {
    eyebrow: "Quick price check",
    title: "What will your stay cost?",
    arrival: "Arrival",
    departure: "Departure",
    adults: "Adults",
    adultsHint: "16+",
    children: "Children",
    childrenHint: "4–15 yrs",
    hintDates: (n) => `Pick arrival & departure (min. ${n} nights) — the price appears instantly.`,
    hintPersons: "Please add at least 1 guest.",
    hintMaxPersons: (max) => `Maximum ${max} guests.`,
    errorGeneric: "We could not calculate the price right now — please try again in a moment.",
    loading: "Calculating price …",
    totalLabel: "Total price",
    nights: (n) => `${n} nights`,
    extras: (dep, kur) => `plus ${dep} deposit + ${kur} visitor's tax`,
    minOccupancyNote: (floor) =>
      `Below ${floor} guests the ${floor}-guest price level applies (already included).`,
    badgeFree: "Dates available",
    badgeBooked: "Booked",
    bookedHint: "These dates are taken — the calendar shows available slots.",
    cta: "Continue to booking",
    ctaBooked: "See available dates",
    ariaLess: "Less",
    ariaMore: "More",
  },
  nl: {
    eyebrow: "Snelle prijscheck",
    title: "Wat kost jullie verblijf?",
    arrival: "Aankomst",
    departure: "Vertrek",
    adults: "Volwassenen",
    adultsHint: "16+",
    children: "Kinderen",
    childrenHint: "4–15 jr",
    hintDates: (n) => `Kies aankomst & vertrek (min. ${n} nachten) — de prijs verschijnt direct.`,
    hintPersons: "Minimaal 1 persoon opgeven.",
    hintMaxPersons: (max) => `Maximaal ${max} personen.`,
    errorGeneric: "De prijs kon nu niet worden berekend — probeer het zo nog eens.",
    loading: "Prijs wordt berekend …",
    totalLabel: "Totaalprijs",
    nights: (n) => `${n} nachten`,
    extras: (dep, kur) => `plus ${dep} borg + ${kur} toeristenbelasting`,
    minOccupancyNote: (floor) =>
      `Onder ${floor} personen geldt het prijsniveau van ${floor} personen (al inbegrepen).`,
    badgeFree: "Periode vrij",
    badgeBooked: "Bezet",
    bookedHint: "Deze periode is bezet — in de kalender vind je vrije data.",
    cta: "Verder naar boeken",
    ctaBooked: "Bekijk vrije data",
    ariaLess: "Minder",
    ariaMore: "Meer",
  },
};

const addDaysIso = (iso: string, days: number): string => {
  // ISO als UTC-Mitternacht rechnen — kein Lokalzeit-Drift beim Addieren.
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const nightsBetweenIso = (a: string, b: string): number =>
  Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) /
      86_400_000
  );

export const PriceQuickCheck = ({ locale = "de" }: { locale?: QcLocale }) => {
  const tt = QC_COPY[locale];
  const todayIso = toLocalIso(new Date());

  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  // Default 15 Erwachsene: entspricht der Mindestbelegungs-Abrechnung —
  // so sieht die typische Gruppe sofort einen realistischen Preis.
  const [adults, setAdults] = useState(15);
  const [children, setChildren] = useState(0);

  const total = adults + children;

  // Clientseitige Vorpruefung — abgeleitet statt als State, damit der Effect
  // ausschliesslich den asynchronen Server-Call macht (kein sync setState).
  const precheckHint =
    !arrival || !departure || nightsBetweenIso(arrival, departure) < RULES.minNights
      ? tt.hintDates(RULES.minNights)
      : total < RULES.minPersons
        ? tt.hintPersons
        : total > RULES.maxPersons
          ? tt.hintMaxPersons(RULES.maxPersons)
          : null;

  // Der Key bindet ein Ergebnis an die Eingaben, zu denen es gehoert —
  // veraltete Antworten koennen so nie als Preis fuer neue Eingaben stehen.
  const inputKey = `${arrival}|${departure}|${adults}|${children}`;
  const [result, setResult] = useState<{ key: string; res: QuickPriceResult } | null>(null);
  // Laufende Request-Nummer — verwirft verspaetete Antworten aelterer,
  // bereits ueberholter Aufrufe (Schreib-Reihenfolge-Guard).
  const reqIdRef = useRef(0);

  useEffect(() => {
    reqIdRef.current++;
    if (precheckHint) return; // Eingabe unvollstaendig → nichts zu laden
    // Debounce: Tippen/Steppen sammelt sich, erst nach 400 ms Ruhe rechnen.
    const reqId = reqIdRef.current;
    const timer = setTimeout(() => {
      quickPrice({ arrival, departure, adults, children, locale })
        .then((res) => {
          if (reqIdRef.current !== reqId) return; // veraltete Antwort
          setResult({ key: inputKey, res });
        })
        .catch(() => {
          if (reqIdRef.current !== reqId) return;
          setResult({ key: inputKey, res: { error: QC_COPY[locale].errorGeneric } });
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [arrival, departure, adults, children, locale, precheckHint, inputKey]);

  // Nur ein Ergebnis anzeigen, das exakt zu den aktuellen Eingaben gehoert.
  const current = result && result.key === inputKey ? result.res : null;
  const ready = current && !("error" in current) ? current : null;
  const errorMsg = current && "error" in current ? current.error : null;
  const loading = !precheckHint && !current;
  // CTA: bei freiem Zeitraum mit voller Vorauswahl in den Buchungsflow,
  // sonst nur mit Personen (Datum sucht der Gast dann im Kalender).
  const personsQuery = `adults=${adults}&children=${children}`;
  const bookingHref =
    ready && ready.available
      ? `/buchen?arrival=${arrival}&departure=${departure}&${personsQuery}`
      : `/buchen?${personsQuery}`;

  return (
    <div className="w-full max-w-3xl rounded-2xl bg-white text-[var(--color-wh-black)] shadow-[var(--shadow-deep)] p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[var(--color-wh-fg-muted)]">
            {tt.eyebrow}
          </div>
          <div className="text-lg sm:text-xl font-display font-bold text-[var(--color-wh-deep-green)] mt-0.5">
            {tt.title}
          </div>
        </div>
      </div>

      {/* Eingaben: mobil einspaltig, ab sm zweispaltig (Daten / Personen). */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          id="qc-arrival"
          type="date"
          label={tt.arrival}
          min={todayIso}
          value={arrival}
          onChange={(e) => {
            const v = e.target.value;
            setArrival(v);
            // Abreise automatisch mitziehen, wenn sie unter das
            // Mindestaufenthalts-Fenster faellt — spart einen Korrektur-Klick.
            if (v && departure && nightsBetweenIso(v, departure) < RULES.minNights) {
              setDeparture(addDaysIso(v, RULES.minNights));
            }
          }}
        />
        <Input
          id="qc-departure"
          type="date"
          label={tt.departure}
          min={arrival ? addDaysIso(arrival, RULES.minNights) : todayIso}
          value={departure}
          onChange={(e) => setDeparture(e.target.value)}
        />
        <QcStepper
          label={tt.adults}
          hint={tt.adultsHint}
          value={adults}
          onChange={setAdults}
          ariaLess={tt.ariaLess}
          ariaMore={tt.ariaMore}
        />
        <QcStepper
          label={tt.children}
          hint={tt.childrenHint}
          value={children}
          onChange={setChildren}
          ariaLess={tt.ariaLess}
          ariaMore={tt.ariaMore}
        />
      </div>

      {/* Ergebnis-Bereich — aria-live, damit Screenreader Preisupdates hoeren. */}
      <div aria-live="polite" className="mt-4 pt-4 border-t border-[var(--color-wh-winter-grey)]/60">
        {precheckHint && (
          <p className="text-sm text-[var(--color-wh-fg-muted)] m-0">{precheckHint}</p>
        )}
        {loading && (
          <p className="text-sm text-[var(--color-wh-fg-muted)] m-0 inline-flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            {tt.loading}
          </p>
        )}
        {errorMsg && (
          <p className="text-sm text-[var(--color-wh-sunset)] m-0">{errorMsg}</p>
        )}
        {ready && (
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[13px] text-[var(--color-wh-fg-muted)]">
                  {tt.totalLabel} · {tt.nights(ready.nights)}
                </span>
                {ready.available ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    {tt.badgeFree}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
                    {tt.badgeBooked}
                  </span>
                )}
              </div>
              <div className="text-[32px] sm:text-[36px] font-display font-bold leading-tight text-[var(--color-wh-deep-green)]">
                {formatEuro(ready.subtotalCents, locale)}
              </div>
              <div className="text-xs text-[var(--color-wh-fg-muted)]">
                {tt.extras(
                  formatEuro(ready.depositCents, locale),
                  formatEuro(ready.kurtaxeCents, locale)
                )}
              </div>
              {total < RULES.minOccupancyFloor && (
                <div className="text-xs text-[var(--color-wh-fg-muted)] mt-1">
                  {tt.minOccupancyNote(RULES.minOccupancyFloor)}
                </div>
              )}
              {!ready.available && (
                <div className="text-xs text-[var(--color-wh-sunset)] mt-1">{tt.bookedHint}</div>
              )}
            </div>
            <Link
              href={bookingHref}
              className="inline-flex h-12 px-5 items-center justify-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] font-semibold no-underline hover:bg-[var(--color-wh-deep-green-hover)] transition-colors shrink-0"
            >
              {ready.available ? tt.cta : tt.ctaBooked}
              <ArrowRight size={17} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

// Kompakter Personen-Stepper: −/+ Buttons plus direkt editierbares Zahlenfeld
// (gleiche Bedienlogik wie die PersonRow im Buchungsflow, nur dichter).
const QcStepper = ({
  label,
  hint,
  value,
  onChange,
  ariaLess,
  ariaMore,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  ariaLess: string;
  ariaMore: string;
}) => {
  const clamp = (n: number) =>
    Math.max(0, Math.min(RULES.maxPersons, Number.isFinite(n) ? Math.round(n) : 0));
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-wh-winter-grey)] px-3.5 h-16 sm:h-auto sm:py-2.5">
      <div className="min-w-0">
        <div className="text-sm font-medium text-[var(--color-wh-deep-green)]">{label}</div>
        <div className="text-xs text-[var(--color-wh-fg-muted)]">{hint}</div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          className="w-8 h-8 rounded-full border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)] cursor-pointer font-semibold disabled:opacity-40 disabled:cursor-default"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= 0}
          aria-label={`${ariaLess}: ${label}`}
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={RULES.maxPersons}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          aria-label={label}
          className="w-11 h-8 text-center rounded-lg border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-black)] font-semibold focus:border-[var(--color-wh-deep-green)] focus:outline-none"
        />
        <button
          type="button"
          className="w-8 h-8 rounded-full border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)] cursor-pointer font-semibold disabled:opacity-40 disabled:cursor-default"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= RULES.maxPersons}
          aria-label={`${ariaMore}: ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
};
