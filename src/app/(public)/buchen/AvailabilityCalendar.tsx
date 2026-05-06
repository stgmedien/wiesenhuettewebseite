"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const WEEKDAYS_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const todayIso = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

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
};

export const AvailabilityCalendar = ({
  bookedDates,
  cleaningDates,
  wartungDates,
  arrival,
  departure,
  onSelect,
}: Props) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIdx, setMonthIdx] = useState(now.getMonth());

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
      const iso = d.toISOString().slice(0, 10);
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
      const iso = d.toISOString().slice(0, 10);
      if (cleaningSet.has(iso)) return "Reinigungstag — nicht buchbar";
      if (wartungSet.has(iso)) return "Wartung";
      if (bookedSet.has(iso)) return "Belegt";
      return undefined;
    };

    const handleClick = (d: Date) => {
      const iso = d.toISOString().slice(0, 10);
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
        onSelect(iso, "");
      } else if (arrival && !departure) {
        if (iso <= arrival) {
          onSelect(iso, "");
        } else {
          // check no blocked day in between [arrival, iso)
          const cur = new Date(arrival);
          const end = new Date(iso);
          let hasBlocked = false;
          while (cur < end) {
            if (blockedSet.has(cur.toISOString().slice(0, 10))) {
              hasBlocked = true;
              break;
            }
            cur.setDate(cur.getDate() + 1);
          }
          if (hasBlocked) {
            onSelect(iso, "");
          } else {
            onSelect(arrival, iso);
          }
        }
      }
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
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goPrev}
          className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)] cursor-pointer"
          aria-label="Vorheriger Monat"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-sm font-semibold text-[var(--color-wh-deep-green)]">
          Verfügbarkeit
        </div>
        <button
          type="button"
          onClick={goNext}
          className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-[var(--color-wh-winter-grey)] text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)] cursor-pointer"
          aria-label="Nächster Monat"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MonthBlock
          title={`${MONTHS[monthIdx]} ${year}`}
          weekdays={WEEKDAYS_SHORT}
          cells={renderMonth(year, monthIdx)}
        />
        <MonthBlock
          title={`${MONTHS[nextMonthIdx]} ${nextYear}`}
          weekdays={WEEKDAYS_SHORT}
          cells={renderMonth(nextYear, nextMonthIdx)}
        />
      </div>

      <div className="mt-5 pt-4 border-t border-[var(--color-wh-winter-grey)] flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--color-wh-fg-muted)]">
        <Legend swatch="bg-white border border-[var(--color-wh-winter-grey)]" label="frei" />
        <Legend swatch="bg-[var(--color-wh-winter-grey)]/60" label="belegt" />
        <Legend
          swatchStyle={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(138,90,56,0.18) 0 4px, transparent 4px 8px)",
            border: "1px solid rgba(138,90,56,0.3)",
          }}
          label="Reinigungstag"
        />
        <Legend swatch="bg-[var(--color-wh-black)]/80" label="Wartung" />
        <Legend swatch="bg-[var(--color-wh-green-soft)]" label="ausgewählt" />
        <Legend swatch="bg-[var(--color-wh-deep-green)]" label="An-/Abreise" />
      </div>
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
