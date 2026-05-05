"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const STATUS_COLOR: Record<string, string> = {
  angefragt: "#EFE6D8",
  bestaetigt: "#e3ecdc",
  bezahlt: "#6FA05F",
  angereist: "#2F4A35",
  abgereist: "#C8CEC4",
  storniert: "#f3d5cb",
  wartung: "#111111",
};

const STATUS_FG: Record<string, string> = {
  angefragt: "#8A5A38",
  bestaetigt: "#2F4A35",
  bezahlt: "#F7F7F2",
  angereist: "#F7F7F2",
  abgereist: "#2F4A35",
  storniert: "#B85C38",
  wartung: "#F7F7F2",
};

type Event = {
  id: string;
  bookingNumber: string;
  status: string;
  arrival: string;
  departure: string;
  persons: number;
  title: string;
};

export const CalendarGrid = ({
  year,
  monthIdx,
  events,
}: {
  year: number;
  monthIdx: number;
  events: Event[];
}) => {
  const firstOfMonth = new Date(year, monthIdx, 1);
  // 0=Sun 1=Mon ... — convert to Mo-first
  const dayOfWeek = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < dayOfWeek; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(year, monthIdx, i));

  // Pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push(null);

  const prevYear = monthIdx === 0 ? year - 1 : year;
  const prevMonth = monthIdx === 0 ? 12 : monthIdx;
  const nextYear = monthIdx === 11 ? year + 1 : year;
  const nextMonth = monthIdx === 11 ? 1 : monthIdx + 2;

  const eventsForDay = (d: Date) => {
    const iso = d.toISOString().slice(0, 10);
    return events.filter((e) => iso >= e.arrival && iso < e.departure);
  };

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[24px] m-0">
          {MONTHS[monthIdx]} {year}
        </h3>
        <div className="flex gap-2">
          <Link
            href={`/m/kalender?y=${prevYear}&m=${prevMonth}`}
            className="inline-flex w-10 h-10 items-center justify-center rounded-full border border-[var(--color-wh-winter-grey)] no-underline text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)]"
          >
            <ChevronLeft size={18} />
          </Link>
          <Link
            href={`/m/kalender?y=${new Date().getFullYear()}&m=${new Date().getMonth() + 1}`}
            className="inline-flex h-10 px-4 items-center rounded-[var(--radius-pill)] border border-[var(--color-wh-winter-grey)] text-sm font-semibold no-underline text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)]"
          >
            Heute
          </Link>
          <Link
            href={`/m/kalender?y=${nextYear}&m=${nextMonth}`}
            className="inline-flex w-10 h-10 items-center justify-center rounded-full border border-[var(--color-wh-winter-grey)] no-underline text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)]"
          >
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)] mb-2">
        {WEEKDAYS.map((w) => (
          <div key={w} className="px-2">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((d, idx) => {
          if (!d) return <div key={idx} className="bg-transparent min-h-[110px]" />;
          const iso = d.toISOString().slice(0, 10);
          const dayEvents = eventsForDay(d);
          const isToday = iso === todayIso;
          return (
            <div
              key={idx}
              className={`bg-white border rounded-[var(--radius-md)] min-h-[110px] p-2 flex flex-col gap-1 ${
                isToday ? "border-[var(--color-wh-deep-green)] border-2" : "border-[var(--color-wh-winter-grey)]"
              }`}
            >
              <div className="text-xs font-semibold text-[var(--color-wh-deep-green)]">
                {d.getDate()}
              </div>
              <div className="flex flex-col gap-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((e) => (
                  <Link
                    key={e.id}
                    href={`/m/buchungen/${e.id}`}
                    className="text-[10px] uppercase tracking-wider px-1.5 py-1 rounded font-semibold no-underline truncate"
                    style={{
                      background: STATUS_COLOR[e.status] ?? "#EFE6D8",
                      color: STATUS_FG[e.status] ?? "#8A5A38",
                    }}
                    title={`${e.title} · ${e.persons} P · ${e.bookingNumber}`}
                  >
                    {e.title}
                  </Link>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-[var(--color-wh-fg-muted)]">
                    +{dayEvents.length - 3} mehr
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
