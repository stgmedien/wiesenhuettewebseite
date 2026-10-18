import { db } from "@/lib/db";
import { bookings, customers, meterReadings } from "@/lib/db/schema";
import { and, asc, gte, inArray, lte, notInArray } from "drizzle-orm";
import { formatDateLong } from "@/lib/utils";
import { formatEuro } from "@/lib/pricing";
import {
  COLD_START_DAYS,
  HEATING_BASE_C,
  buildIntervals,
  costCents,
  formatAmount,
  summarize,
  type Interval,
  type Meter,
  type MeterSummary,
} from "@/lib/energy";
import { fetchDailyMeanTemps } from "@/lib/weather-history";
import MeterReadingForm from "./MeterReadingForm";
import { DeleteReadingButton } from "./DeleteReadingButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Energie · Wiesenhütte Manager" };

const KIND_LABEL: Record<Interval["kind"], string> = {
  belegt: "belegt",
  leer: "Leerstand",
  gemischt: "teils belegt",
};

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export default async function EnergiePage() {
  const todayIso = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
  const readings = await db.select().from(meterReadings).orderBy(asc(meterReadings.readOn), asc(meterReadings.createdAt));

  const first = readings[0]?.readOn ?? todayIso;
  const rangeFrom = addDays(first < todayIso ? first : todayIso, -60);

  // Belegung im Ablese-Zeitraum + Auswahl für das Formular (letzte 60 Tage bis 7 Tage voraus)
  const stayRows = await db
    .select({
      id: bookings.id,
      bookingNumber: bookings.bookingNumber,
      arrival: bookings.arrival,
      departure: bookings.departure,
      persons: bookings.persons,
      customerId: bookings.customerId,
    })
    .from(bookings)
    .where(
      and(
        notInArray(bookings.status, ["storniert", "wartung", "angefragt"]),
        gte(bookings.departure, rangeFrom),
        lte(bookings.arrival, addDays(todayIso, 7))
      )
    )
    .orderBy(asc(bookings.arrival));

  const customerIds = [...new Set(stayRows.map((b) => b.customerId).filter((v): v is string => Boolean(v)))];
  const names =
    customerIds.length > 0
      ? await db
          .select({ id: customers.id, firstName: customers.firstName, lastName: customers.lastName })
          .from(customers)
          .where(inArray(customers.id, customerIds))
      : [];
  const nameById = new Map(names.map((c) => [c.id, `${c.firstName} ${c.lastName}`.trim()]));

  const temps = readings.length > 1 ? await fetchDailyMeanTemps(readings[0].readOn, todayIso) : new Map<string, number>();
  const intervals = buildIntervals(readings, stayRows, temps);
  const summary = summarize(intervals, todayIso);
  const issues = intervals.filter((x) => x.issues.length > 0);

  const bookingOptions = stayRows
    .filter((b) => b.departure >= addDays(todayIso, -60))
    .reverse()
    .map((b) => ({
      id: b.id,
      label: `${b.bookingNumber} · ${(b.customerId && nameById.get(b.customerId)) || "—"} · ${formatDateLong(b.arrival)} → ${formatDateLong(b.departure)}`,
    }));
  const bookingLabel = new Map(stayRows.map((b) => [b.id, `${b.bookingNumber} · ${(b.customerId && nameById.get(b.customerId)) || "—"}`]));

  const intervalByReading = new Map<string, Partial<Record<Meter, Interval>>>();
  for (const x of intervals) {
    const entry = intervalByReading.get(x.toReadingId) ?? {};
    entry[x.meter] = x;
    intervalByReading.set(x.toReadingId, entry);
  }

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[1200px]">
      <div className="eyebrow">Energie</div>
      <h1 className="text-[40px] mt-2 mb-1">Zählerstände Strom & Gas</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 max-w-[760px]">
        Am aussagekräftigsten sind Ablesungen bei jeder Anreise und Abreise: Dann trennt die
        Auswertung den Verbrauch der Gruppen vom Verbrauch bei Leerstand. Die Außentemperatur
        kommt automatisch dazu (Open-Meteo), damit kalte Wochen fair verglichen werden.
      </p>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_360px] gap-6 mt-8 items-start">
        <div className="space-y-6 min-w-0">
          <div className="grid md:grid-cols-2 gap-4">
            {summary.map((s) => (
              <SummaryCard key={s.meter} s={s} />
            ))}
          </div>

          {issues.length > 0 && (
            <section className="bg-[#FBEDE6] border border-[#E7C3B0] rounded-[var(--radius-card)] p-5">
              <h3 className="text-[18px] m-0 mb-2 text-[#7a3a20]">Auffälligkeiten ({issues.length})</h3>
              <ul className="m-0 pl-5 text-sm space-y-1">
                {issues.map((x) =>
                  x.issues.map((t, i) => (
                    <li key={`${x.meter}-${x.toReadingId}-${i}`}>
                      {x.meter === "electricity" ? "Strom" : "Gas"}, {formatDateLong(x.from)} → {formatDateLong(x.to)}: {t}
                    </li>
                  ))
                )}
              </ul>
            </section>
          )}

          <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5 overflow-x-auto">
            <h3 className="text-[20px] m-0 mb-4">Ablesungen</h3>
            {readings.length === 0 ? (
              <p className="text-sm text-[var(--color-wh-fg-muted)] m-0">Noch keine Zählerstände erfasst.</p>
            ) : (
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)]">
                    <th className="py-2 pr-3">Datum</th>
                    <th className="pr-3">Strom</th>
                    <th className="pr-3">Gas</th>
                    <th className="pr-3">Zeitraum davor</th>
                    <th className="pr-3">Vorher leer</th>
                    <th className="pr-3">Ø Außen</th>
                    <th className="pr-3">Buchung / Notiz</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {[...readings].reverse().map((r) => {
                    const iv = intervalByReading.get(r.id) ?? {};
                    const ref = iv.electricity ?? iv.gas;
                    return (
                      <tr key={r.id} className="border-t border-[var(--color-wh-winter-grey)] align-top">
                        <td className="py-2 pr-3 whitespace-nowrap">{formatDateLong(r.readOn)}</td>
                        <td className="pr-3 whitespace-nowrap">
                          <Reading value={r.electricityKwhX10 === null ? null : r.electricityKwhX10 / 10} iv={iv.electricity} meter="electricity" />
                        </td>
                        <td className="pr-3 whitespace-nowrap">
                          <Reading value={r.gasM3X100 === null ? null : r.gasM3X100 / 100} iv={iv.gas} meter="gas" />
                        </td>
                        <td className="pr-3 whitespace-nowrap">
                          {ref ? (
                            <>
                              {ref.days} {ref.days === 1 ? "Tag" : "Tage"} · {KIND_LABEL[ref.kind]}
                              {ref.occupiedNights > 0 && (
                                <div className="text-xs text-[var(--color-wh-fg-muted)]">
                                  {ref.occupiedNights} N. belegt · {ref.personNights} Personennächte
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-[var(--color-wh-fg-muted)]">erste Ablesung</span>
                          )}
                        </td>
                        <td className="pr-3 whitespace-nowrap">
                          {ref?.emptyDaysBefore == null
                            ? "—"
                            : ref.emptyDaysBefore === 0
                              ? "direkt nach Gruppe"
                              : `${ref.emptyDaysBefore} ${ref.emptyDaysBefore === 1 ? "Tag" : "Tage"}`}
                          {ref?.emptyDaysBefore != null && ref.emptyDaysBefore >= COLD_START_DAYS && (
                            <div className="text-xs text-[var(--color-wh-fg-muted)]">Hütte ausgekühlt</div>
                          )}
                        </td>
                        <td className="pr-3 whitespace-nowrap">
                          {ref?.avgTemp != null ? `${ref.avgTemp.toLocaleString("de-DE")} °C` : "—"}
                        </td>
                        <td className="pr-3">
                          {r.bookingId && <div>{bookingLabel.get(r.bookingId) ?? "Buchung"}</div>}
                          {r.note && <div className="text-xs text-[var(--color-wh-fg-muted)]">{r.note}</div>}
                        </td>
                        <td className="text-right">
                          <DeleteReadingButton id={r.id} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <MeterReadingForm todayIso={todayIso} bookingOptions={bookingOptions} />
      </div>
    </div>
  );
}

function Reading({ value, iv, meter }: { value: number | null; iv?: Interval; meter: Meter }) {
  if (value === null) return <span className="text-[var(--color-wh-fg-muted)]">—</span>;
  return (
    <>
      {value.toLocaleString("de-DE", { minimumFractionDigits: meter === "electricity" ? 1 : 2 })}
      {iv && (
        <div className={`text-xs ${iv.issues.length > 0 ? "text-[#7a3a20] font-semibold" : "text-[var(--color-wh-fg-muted)]"}`}>
          {iv.delta >= 0 ? "+" : "−"}
          {formatAmount(Math.abs(iv.delta), meter)}
          {iv.perDay !== null && ` · ${formatAmount(iv.perDay, meter)}/Tag`}
        </div>
      )}
    </>
  );
}

function SummaryCard({ s }: { s: MeterSummary }) {
  const title = s.meter === "electricity" ? "Strom" : "Gas";
  const fmt = (v: number | null) => (v === null ? "—" : formatAmount(v, s.meter));
  const euro = (v: number | null) => {
    if (v === null) return null;
    const c = costCents(v, s.meter);
    return c === null ? null : formatEuro(c);
  };
  const rows: Array<[string, string, string | null]> = [
    ["Ø pro Tag, belegt", fmt(s.perDayOccupied), euro(s.perDayOccupied)],
    ["Ø pro Tag, Leerstand", fmt(s.perDayEmpty), euro(s.perDayEmpty)],
    ["pro Person und Nacht", fmt(s.perPersonNight), euro(s.perPersonNight)],
    ["letzte 30 Tage", fmt(s.last30Days), euro(s.last30Days)],
  ];
  if (s.meter === "gas") rows.push([`pro Heizgradtag (Basis ${HEATING_BASE_C} °C)`, fmt(s.perHeatingDegreeDay), null]);
  return (
    <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5">
      <h3 className="text-[18px] m-0 mb-3">{title}</h3>
      <dl className="m-0 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm">
        {rows.map(([label, value, money]) => (
          <div key={label} className="contents">
            <dt className="text-[var(--color-wh-fg-muted)]">{label}</dt>
            <dd className="m-0 text-right font-semibold whitespace-nowrap">
              {value}
              {money && <span className="font-normal text-[var(--color-wh-fg-muted)]"> · {money}</span>}
            </dd>
          </div>
        ))}
      </dl>
      {s.emptyShare !== null && (
        <p className="text-xs text-[var(--color-wh-fg-muted)] m-0 mt-3">
          {Math.round(s.emptyShare * 100)} % des Verbrauchs fallen auf Leerstand.
        </p>
      )}
    </section>
  );
}
