import { Download, ExternalLink } from "lucide-react";
import {
  computeTourismStats,
  lastCompletedMonths,
  TOURISM_STATS_TO_DEFAULT,
} from "@/lib/tourism-stats";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tourismusstatistik · Wiesenhütte Manager" };

const MONTHS = 12;

export default async function TourismusstatistikPage() {
  const months = lastCompletedMonths(MONTHS);
  const stats = await Promise.all(months.map((m) => computeTourismStats(m)));
  const statsTo = process.env.MAIL_TOURISM_STATS_TO || TOURISM_STATS_TO_DEFAULT;

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[1200px]">
      <div className="eyebrow">Meldungen</div>
      <h1 className="text-[40px] mt-2 mb-1">Tourismusstatistik</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 max-w-[760px]">
        Zahlen für die monatliche Meldung an IT.NRW (BeherbStatG). Am 2. jedes Monats gehen die
        Zahlen des Vormonats automatisch per Mail an <strong>{statsTo}</strong>. Eingetragen wird
        bei{" "}
        <a
          href="https://www.idev.nrw.de"
          target="_blank"
          rel="noreferrer"
          className="text-[var(--color-wh-deep-green)] inline-flex items-center gap-1"
        >
          idev.nrw.de <ExternalLink size={11} />
        </a>
        . Stornierte Buchungen und Sperrzeiten zählen nicht mit.
      </p>

      <a
        href={`/api/m/tourismusstatistik?monate=${MONTHS}`}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2.5 text-sm font-semibold no-underline"
      >
        <Download size={15} /> Letzte {MONTHS} Monate als Datei (CSV)
      </a>

      <section className="mt-8 bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)]">
              <th className="py-2 pr-3">Monat</th>
              <th className="py-2 pr-3 text-right">Ankünfte</th>
              <th className="py-2 pr-3 text-right">Übernachtungen</th>
              <th className="py-2">Buchungen</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.month} className="border-t border-[var(--color-wh-winter-grey)] align-top">
                <td className="py-2 pr-3 whitespace-nowrap font-medium">{s.monthLabel}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{s.arrivals}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{s.overnightStays}</td>
                <td className="py-2">
                  {s.bookings.length === 0 ? (
                    <span className="text-[var(--color-wh-fg-muted)]">keine</span>
                  ) : (
                    <details>
                      <summary className="cursor-pointer text-[var(--color-wh-fg-muted)]">
                        {s.bookings.length} {s.bookings.length === 1 ? "Buchung" : "Buchungen"}
                      </summary>
                      <ul className="m-0 mt-1 p-0 list-none space-y-0.5 text-xs">
                        {s.bookings.map((b) => (
                          <li key={b.bookingNumber}>
                            {b.bookingNumber} · {b.arrival} → {b.departure} · {b.persons} Pers. ·{" "}
                            {b.nightsInMonth} {b.nightsInMonth === 1 ? "Nacht" : "Nächte"} im Monat
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
