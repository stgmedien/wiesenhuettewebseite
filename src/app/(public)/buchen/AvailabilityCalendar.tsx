"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Locale } from "@/lib/i18n-shared";
import { toLocalIso } from "@/lib/utils";

const CAL_COPY: Record<Locale, {
  months: readonly string[];
  weekdays: readonly string[];
  prevMonth: string;
  nextMonth: string;
  availability: string;
  selectMonth: string;
  selectYear: string;
  pastLabel: string;
  rangeResetBlocked: string;
  tipCleaning: string;
  tipWartung: string;
  tipBooked: string;
  legendFree: string;
  legendBooked: string;
  legendCleaning: string;
  legendWartung: string;
  legendSelected: string;
  legendArrivalDeparture: string;
}> = {
  de: {
    months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    weekdays: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
    prevMonth: "Vorheriger Monat",
    nextMonth: "Nächster Monat",
    availability: "Verfügbarkeit",
    selectMonth: "Monat wählen",
    selectYear: "Jahr wählen",
    pastLabel: "vergangen",
    rangeResetBlocked:
      "In diesem Zeitraum liegt ein belegter Tag — die Auswahl wurde zurückgesetzt. Bitte einen durchgehend freien Zeitraum wählen.",
    tipCleaning: "Reinigungstag — nicht buchbar",
    tipWartung: "Wartung",
    tipBooked: "Belegt",
    legendFree: "frei",
    legendBooked: "belegt",
    legendCleaning: "Reinigungstag",
    legendWartung: "Wartung",
    legendSelected: "ausgewählt",
    legendArrivalDeparture: "An-/Abreise",
  },
  en: {
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    prevMonth: "Previous month",
    nextMonth: "Next month",
    availability: "Availability",
    selectMonth: "Select month",
    selectYear: "Select year",
    pastLabel: "past",
    rangeResetBlocked:
      "There's a booked day within that range — the selection was reset. Please choose a fully free range.",
    tipCleaning: "Cleaning day — not bookable",
    tipWartung: "Maintenance",
    tipBooked: "Booked",
    legendFree: "free",
    legendBooked: "booked",
    legendCleaning: "Cleaning day",
    legendWartung: "Maintenance",
    legendSelected: "selected",
    legendArrivalDeparture: "Arrival / departure",
  },
  nl: {
    months: ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
    weekdays: ["ma", "di", "wo", "do", "vr", "za", "zo"],
    prevMonth: "Vorige maand",
    nextMonth: "Volgende maand",
    availability: "Beschikbaarheid",
    selectMonth: "Maand kiezen",
    selectYear: "Jaar kiezen",
    pastLabel: "verleden",
    rangeResetBlocked:
      "In die periode zit een geboekte dag — de selectie is gewist. Kies een volledig vrije periode.",
    tipCleaning: "Schoonmaakdag — niet boekbaar",
    tipWartung: "Onderhoud",
    tipBooked: "Geboekt",
    legendFree: "vrij",
    legendBooked: "geboekt",
    legendCleaning: "Schoonmaakdag",
    legendWartung: "Onderhoud",
    legendSelected: "geselecteerd",
    legendArrivalDeparture: "Aankomst / vertrek",
  },
};

const todayIso = () => toLocalIso(new Date());

type State =
  | "past"
  | "booked"
  | "cleaning"
  | "wartung"
  | "free"
  | "selected"
  | "in-range";

type Props = {
  bookedDates: string[];
  cleaningDates: string[];
  wartungDates: string[];
  arrival: string;
  departure: string;
  onSelect: (arrival: string, departure: string) => void;
  locale?: Locale;
};

export const AvailabilityCalendar = ({
  bookedDates,
  cleaningDates,
  wartungDates,
  arrival,
  departure,
  onSelect,
  locale = "de",
}: Props) => {
  const c = CAL_COPY[locale];
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIdx, setMonthIdx] = useState(now.getMonth());
  // Kurzer Hinweis, wenn eine Range zurückgesetzt wurde, weil ein belegter
  // Tag dazwischen lag.
  const [resetHint, setResetHint] = useState(false);
  // Jahre für den Schnellsprung: aktuelles Jahr + 2 (Buchungshorizont ~720 Tage).
  const yearOptions = [now.getFullYear(), now.getFullYear() + 1, now.getFullYear() + 2];

  const bookedSet = useMemo(() => new Set(bookedDates), [bookedDates]);
  const cleaningSet = useMemo(() => new Set(cleaningDates), [cleaningDates]);
  const wartungSet = useMemo(() => new Set(wartungDates), [wartungDates]);
  const blockedSet = useMemo(() => {
    const all = new Set<string>();
    bookedSet.forEach((d) => all.add(d));
    cleaningSet.forEach((d) => all.add(d));
    wartungSet.forEach((d) => all.add(d));
    return all;
  }, [bookedSet, cleaningSet, wartungSet]);

  const today = todayIso();

  const goPrev = () => {
    if (monthIdx === 0) {
      setMonthIdx(11);
      setYear(year - 1);
    } else setMonthIdx(monthIdx - 1);
  };
  const goNext = () => {
    if (monthIdx === 11) {
      setMonthIdx(0);
      setYear(year + 1);
    } else setMonthIdx(monthIdx + 1);
  };

  const renderMonth = (yr: number, mi: number) => {
    const firstOfMonth = new Date(yr, mi, 1);
    const dayOfWeek = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(yr, mi + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < dayOfWeek; i++) cells.push(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(yr, mi, i));
    while (cells.length % 7 !== 0) cells.push(null);

    const stateOf = (d: Date): State => {
      const iso = toLocalIso(d);
      if (iso < today) return "past";
      if (arrival && iso === arrival) return "selected";
      if (departure && iso === departure) return "selected";
      if (arrival && departure && iso > arrival && iso < departure) return "in-range";
      if (wartungSet.has(iso)) return "wartung";
      if (cleaningSet.has(iso)) return "cleaning";
      if (bookedSet.has(iso)) return "booked";
      return "free";
    };

    const titleOf = (d: Date): string | undefined => {
      const iso = toLocalIso(d);
      if (cleaningSet.has(iso)) return c.tipCleaning;
      if (wartungSet.has(iso)) return c.tipWartung;
      if (bookedSet.has(iso)) return c.tipBooked;
      return undefined;
    };

    const handleClick = (d: Date) => {
      const iso = toLocalIso(d);
      const state = stateOf(d);
      if (
        state === "past" ||
        state === "booked" ||
        state === "cleaning" ||
        state === "wartung"
      )
        return;
      // first click sets arrival, second sets departure (must be after arrival)
      if (!arrival || (arrival && departure)) {
        setResetHint(false);
        onSelect(iso, "");
      } else if (arrival && !departure) {
        if (iso <= arrival) {
          setResetHint(false);
          onSelect(iso, "");
        } else {
          // check no blocked day in between [arrival, iso)
          const cur = new Date(arrival);
          const end = new Date(iso);
          let hasBlocked = false;
          while (cur < end) {
            if (blockedSet.has(toLocalIso(cur))) {
              hasBlocked = true;
              break;
            }
            cur.setDate(cur.getDate() + 1);
          }
          if (hasBlocked) {
            // Belegter Tag in der Spanne → Auswahl auf neuen Anreisetag
            // zurücksetzen und Nutzer kurz darüber informieren.
            setResetHint(true);
            onSelect(iso, "");
          } else {
            setResetHint(false);
            onSelect(arrival, iso);
          }
        }
      }
    };

    // Beschreibendes aria-label: Datum + Status (für Screenreader).
    const ariaLabelOf = (d: Date): string => {
      const human = `${d.getDate()}. ${c.months[mi]} ${yr}`;
      const s = stateOf(d);
      const stateText =
        s === "past"
          ? c.pastLabel
          : s === "booked"
          ? c.legendBooked
          : s === "cleaning"
          ? c.legendCleaning
          : s === "wartung"
          ? c.legendWartung
          : s === "selected" || s === "in-range"
          ? c.legendSelected
          : c.legendFree;
      return `${human} — ${stateText}`;
    };

    const cls: Record<State, string> = {
      past: "text-[var(--color-wh-winter-grey)] cursor-not-allowed line-through",
      booked:
        "bg-[var(--color-wh-winter-grey)]/60 text-[var(--color-wh-fg-muted)] cursor-not-allowed line-through",
      cleaning:
        "bg-[var(--color-wh-wood)]/15 text-[var(--color-wh-wood)] cursor-not-allowed",
      wartung:
        "bg-[var(--color-wh-black)]/80 text-[var(--color-wh-snow)] cursor-not-allowed line-through",
      free: "text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)] cursor-pointer",
      selected:
        "bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] font-bold cursor-pointer",
      "in-range":
        "bg-[var(--color-wh-green-soft)] text-[var(--color-wh-deep-green)] cursor-pointer",
    };

    return cells.map((d, idx) => {
      if (!d) return <div key={idx} className="aspect-square" />;
      const state = stateOf(d);
      const isCleaning = state === "cleaning";
      const base =
        "aspect-square flex items-center justify-center text-sm font-medium rounded-md transition-colors relative";
      return (
        <button
          key={idx}
          type="button"
          disabled={
            state === "past" ||
            state === "booked" ||
            state === "cleaning" ||
            state === "wartung"
          }
          onClick={() => handleClick(d)}
          title={titleOf(d)}
          aria-label={ariaLabelOf(d)}
          className={`${base} ${cls[state]}`}
          style={
            isCleaning
              ? {
                  backgroundImage:
                    "repeating-linear-gradient(45deg, rgba(138,90,56,0.18) 0 4px, transparent 4px 8px)",
                }
              : undefined
          }
        >
          {d.getDate()}
        </button>
      );
    });
  };

  const nextMonthIdx = monthIdx === 11 ? 0 : monthIdx + 1;
  const nextYear = monthIdx === 11 ? year + 1 : year;

  return (
    <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <button
          type="button"
          onClick={goPrev}
          className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-full border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)] cursor-pointer"
          aria-label={c.prevMonth}
        >
          <ChevronLeft size={18} />
        </button>
        {/* Schnellsprung: Monat + Jahr direkt wählbar (2-Jahres-Horizont). */}
        <div className="flex items-center gap-2">
          <select
            value={monthIdx}
            onChange={(e) => setMonthIdx(Number(e.target.value))}
            aria-label={c.selectMonth}
            className="rounded-md border border-[var(--color-wh-winter-grey)] bg-white px-2 py-1.5 text-sm font-semibold text-[var(--color-wh-deep-green)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-wh-green)]"
          >
            {c.months.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            aria-label={c.selectYear}
            className="rounded-md border border-[var(--color-wh-winter-grey)] bg-white px-2 py-1.5 text-sm font-semibold text-[var(--color-wh-deep-green)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-wh-green)]"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={goNext}
          className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-full border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)] cursor-pointer"
          aria-label={c.nextMonth}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MonthBlock
          title={`${c.months[monthIdx]} ${year}`}
          weekdays={[...c.weekdays]}
          cells={renderMonth(year, monthIdx)}
        />
        <MonthBlock
          title={`${c.months[nextMonthIdx]} ${nextYear}`}
          weekdays={[...c.weekdays]}
          cells={renderMonth(nextYear, nextMonthIdx)}
        />
      </div>

      <div className="mt-5 pt-4 border-t border-[var(--color-wh-winter-grey)] flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--color-wh-fg-muted)]">
        <Legend swatch="bg-white border border-[var(--color-wh-winter-grey)]" label={c.legendFree} />
        <Legend swatch="bg-[var(--color-wh-winter-grey)]/60" label={c.legendBooked} />
        <Legend
          swatchStyle={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(138,90,56,0.18) 0 4px, transparent 4px 8px)",
            border: "1px solid rgba(138,90,56,0.3)",
          }}
          label={c.legendCleaning}
        />
        <Legend swatch="bg-[var(--color-wh-black)]/80" label={c.legendWartung} />
        <Legend swatch="bg-[var(--color-wh-green-soft)]" label={c.legendSelected} />
        <Legend swatch="bg-[var(--color-wh-deep-green)]" label={c.legendArrivalDeparture} />
      </div>

      {resetHint && (
        <div
          role="status"
          className="mt-4 rounded-[var(--radius-md)] border-l-4 border-[var(--color-wh-sunset)] bg-[var(--color-wh-sunset)]/10 px-4 py-2.5 text-sm text-[var(--color-wh-sunset)]"
        >
          {c.rangeResetBlocked}
        </div>
      )}
    </div>
  );
};

const MonthBlock = ({
  title,
  weekdays,
  cells,
}: {
  title: string;
  weekdays: string[];
  cells: React.ReactNode;
}) => (
  <div>
    <div className="text-center font-semibold text-[var(--color-wh-deep-green)] mb-3">
      {title}
    </div>
    <div className="grid grid-cols-7 gap-1 text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-2 text-center">
      {weekdays.map((w) => (
        <div key={w}>{w}</div>
      ))}
    </div>
    <div className="grid grid-cols-7 gap-1">{cells}</div>
  </div>
);

const Legend = ({
  swatch,
  swatchStyle,
  label,
}: {
  swatch?: string;
  swatchStyle?: React.CSSProperties;
  label: string;
}) => (
  <span className="inline-flex items-center gap-2">
    <span
      className={`inline-block w-3 h-3 rounded-sm ${swatch ?? ""}`}
      style={swatchStyle}
    />
    {label}
  </span>
);
