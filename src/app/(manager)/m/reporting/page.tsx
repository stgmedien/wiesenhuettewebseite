import { db } from "@/lib/db";
import { bookings, payments } from "@/lib/db/schema";
import { gte, lte, and, eq, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatEuro } from "@/lib/pricing";
import {
  RevenueByMonth,
  OccupancyByMonth,
  StatusBreakdown,
  CancellationRate,
} from "./Charts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reporting · Wiesenhütte Manager" };

const MONTHS_DE = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

const MAX_BEDS = 33;

export default async function ReportingPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  // Zeitraum: letzte 12 Monate
  const today = new Date();
  const start = new Date(today);
  start.setDate(1);
  start.setMonth(start.getMonth() - 11);
  start.setHours(0, 0, 0, 0);

  const allBookings = await db
    .select({
      id: bookings.id,
      arrival: bookings.arrival,
      departure: bookings.departure,
      nights: bookings.nights,
      persons: bookings.persons,
      status: bookings.status,
      subtotalCents: bookings.subtotalCents,
      paidCents: bookings.paidCents,
    })
    .from(bookings)
    .where(and(gte(bookings.arrival, start.toISOString().slice(0, 10))));

  // Umsatz nach Monat (basierend auf erhaltenen Zahlungen, nicht subtotal)
  const allPayments = await db
    .select({
      amountCents: payments.amountCents,
      status: payments.status,
      kind: payments.kind,
      receivedAt: payments.receivedAt,
    })
    .from(payments)
    .where(and(gte(payments.receivedAt, start), eq(payments.status, "erhalten")));

  // Build month buckets
  const months: { key: string; label: string; year: number; month: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    months.push({
      key: d.toISOString().slice(0, 7),
      label: MONTHS_DE[d.getMonth()] + (d.getMonth() === 0 ? ` ${String(d.getFullYear()).slice(2)}` : ""),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }

  const revenueData = months.map((m) => {
    const sum = allPayments
      .filter((p) => {
        if (!p.receivedAt) return false;
        if (p.kind === "kaution" || p.kind === "rueckerstattung") return false;
        return p.receivedAt.toISOString().slice(0, 7) === m.key;
      })
      .reduce((acc, p) => acc + p.amountCents, 0);
    return { month: m.label, revenueCents: sum };
  });

  // Auslastung nach Monat: belegte Naechte / mögliche Naechte (* Betten)
  const daysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const occupancyData = months.map((m) => {
    let nightsBooked = 0;
    for (const b of allBookings) {
      if (b.status === "storniert" || b.status === "wartung") continue;
      const arr = new Date(b.arrival);
      const dep = new Date(b.departure);
      // Iteriere ueber Naechte
      for (
        let d = new Date(arr);
        d < dep;
        d.setDate(d.getDate() + 1)
      ) {
        if (d.getFullYear() === m.year && d.getMonth() === m.month) {
          nightsBooked += b.persons;
        }
      }
    }
    const possible = daysInMonth(m.year, m.month) * MAX_BEDS;
    const pct = possible > 0 ? (nightsBooked / possible) * 100 : 0;
    return { month: m.label, occupancyPct: pct, nightsBooked };
  });

  // Status-Breakdown
  const statusCounts: Record<string, number> = {};
  for (const b of allBookings) {
    statusCounts[b.status] = (statusCounts[b.status] ?? 0) + 1;
  }
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  // Stornoquote nach Monat
  const cancelData = months.map((m) => {
    const inMonth = allBookings.filter((b) => b.arrival.startsWith(m.key));
    const total = inMonth.length;
    const cancelled = inMonth.filter((b) => b.status === "storniert").length;
    const pct = total > 0 ? (cancelled / total) * 100 : 0;
    return { month: m.label, cancellationPct: pct };
  });

  // Total-KPIs
  const totalRevenue = revenueData.reduce((a, d) => a + d.revenueCents, 0);
  const totalNights = occupancyData.reduce((a, d) => a + d.nightsBooked, 0);
  const avgOccupancy =
    occupancyData.reduce((a, d) => a + d.occupancyPct, 0) / occupancyData.length;
  const cancelTotal =
    allBookings.length > 0
      ? (allBookings.filter((b) => b.status === "storniert").length /
          allBookings.length) *
        100
      : 0;

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[1400px]">
      <div className="eyebrow">Manager · Reporting</div>
      <h1 className="text-[36px] mt-2 mb-1">Auslastung, Umsatz, Storno.</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0 mb-8">
        Letzte 12 Monate · Daten basieren auf erhaltenen Zahlungen und gebuchten Personen-Nächten.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi label="Umsatz (12 M.)" value={formatEuro(totalRevenue)} />
        <Kpi label="Personen-Nächte" value={String(totalNights)} />
        <Kpi label="Ø Auslastung" value={`${avgOccupancy.toFixed(1)} %`} />
        <Kpi label="Stornoquote" value={`${cancelTotal.toFixed(1)} %`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Umsatz nach Monat">
          <RevenueByMonth data={revenueData} />
        </Section>
        <Section title="Auslastung nach Monat (% der Bettnächte)">
          <OccupancyByMonth data={occupancyData} />
        </Section>
        <Section title="Buchungen nach Status">
          <StatusBreakdown data={statusData} />
        </Section>
        <Section title="Stornoquote nach Anreise-Monat">
          <CancellationRate data={cancelData} />
        </Section>
      </div>

      <section className="mt-10 bg-[var(--color-wh-beige)] border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
        <h3 className="text-[18px] m-0 mb-2">Buchhaltung</h3>
        <p className="text-sm m-0 mb-4">
          DATEV-konformer CSV-Export der Zahlungseingänge zum manuellen Import in DATEV
          Pro / SKR04. Verein ist gemeinnützig (USt-frei nach §4 UStG).
        </p>
        <a
          href={`/api/m/datev-export?from=${start.toISOString().slice(0, 10)}&to=${today.toISOString().slice(0, 10)}`}
          className="inline-block rounded-full bg-[var(--color-wh-deep-green)] text-white px-5 py-2.5 text-sm font-semibold no-underline"
        >
          DATEV-CSV exportieren (12 Monate)
        </a>
      </section>
    </div>
  );
}

const Kpi = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[var(--radius-card)] border border-[var(--color-wh-winter-grey)] bg-white p-5">
    <div className="font-display text-[28px] leading-none font-bold text-[var(--color-wh-deep-green)]">
      {value}
    </div>
    <div className="text-xs text-[var(--color-wh-fg-muted)] mt-2 uppercase tracking-wider">
      {label}
    </div>
  </div>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
    <h3 className="text-[18px] m-0 mb-4">{title}</h3>
    {children}
  </section>
);
