import { db } from "@/lib/db";
import { bookings, customers, payments, activityLog, inquiries } from "@/lib/db/schema";
import { eq, gte, lte, and, desc, ne, sql } from "drizzle-orm";
import Link from "next/link";
import { formatEuro } from "@/lib/pricing";
import { formatDateLong } from "@/lib/utils";
import {
  CalendarArrowDown,
  CalendarArrowUp,
  Mail,
  BadgeEuro,
  AlertCircle,
  CalendarClock,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard · Wiesenhütte Manager" };

export default async function Dashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString().slice(0, 10);
  const in7d = new Date(today);
  in7d.setDate(in7d.getDate() + 7);
  const in7dIso = in7d.toISOString().slice(0, 10);
  const last30 = new Date(today);
  last30.setDate(last30.getDate() - 30);
  const last30Iso = last30.toISOString().slice(0, 10);

  const arrivalsSoon = await db
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
        gte(bookings.arrival, todayIso),
        lte(bookings.arrival, in7dIso)
      )
    )
    .orderBy(bookings.arrival)
    .limit(10);

  const departuresSoon = await db
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
        gte(bookings.departure, todayIso),
        lte(bookings.departure, in7dIso)
      )
    )
    .orderBy(bookings.departure)
    .limit(10);

  const allRecent = await db
    .select({
      id: bookings.id,
      bookingNumber: bookings.bookingNumber,
      status: bookings.status,
      paidCents: bookings.paidCents,
      totalCents: bookings.subtotalCents,
      depositCents: bookings.depositCents,
    })
    .from(bookings);

  const totalRevenueCents = allRecent
    .filter((b) => b.status === "bezahlt" || b.status === "angereist" || b.status === "abgereist")
    .reduce((acc, b) => acc + b.paidCents, 0);

  const openRequests = allRecent.filter((b) => b.status === "angefragt").length;

  // Heute-Block: Anreisen + Abreisen am heutigen Datum
  const arrivalsToday = arrivalsSoon.filter((b) => b.arrival === todayIso);
  const departuresToday = departuresSoon.filter((b) => b.departure === todayIso);

  // Offene Zahlungen (Restzahlung & angefragt-Bookings) — kommende 30 Tage
  const in30d = new Date(today);
  in30d.setDate(in30d.getDate() + 30);
  const in30dIso = in30d.toISOString().slice(0, 10);

  const openPaymentRows = await db
    .select({
      id: payments.id,
      bookingId: payments.bookingId,
      kind: payments.kind,
      amountCents: payments.amountCents,
      status: payments.status,
    })
    .from(payments)
    .where(
      and(
        eq(payments.status, "offen"),
        ne(payments.kind, "kaution"),
        ne(payments.kind, "rueckerstattung")
      )
    );
  const openPaymentTotalCents = openPaymentRows.reduce(
    (a, p) => a + Math.max(0, p.amountCents),
    0
  );
  const openPaymentBookingIds = Array.from(
    new Set(openPaymentRows.map((p) => p.bookingId))
  );
  const openPaymentBookings = openPaymentBookingIds.length
    ? await db
        .select({
          id: bookings.id,
          bookingNumber: bookings.bookingNumber,
          arrival: bookings.arrival,
          customerId: bookings.customerId,
          subtotalCents: bookings.subtotalCents,
          paidCents: bookings.paidCents,
        })
        .from(bookings)
        .where(
          and(
            sql`${bookings.id} IN (${sql.join(
              openPaymentBookingIds.map((id) => sql`${id}`),
              sql`, `
            )})`,
            lte(bookings.arrival, in30dIso)
          )
        )
        .orderBy(bookings.arrival)
        .limit(10)
    : [];

  // Offene Anfragen (Inquiries-Tabelle, separater Workflow von angefragt-Bookings)
  const openInquiries = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.status, "new"))
    .orderBy(desc(inquiries.createdAt))
    .limit(10);

  const recentActivity = await db
    .select()
    .from(activityLog)
    .orderBy(desc(activityLog.at))
    .limit(8);

  // Pull customer names for arrivals/departures
  const customerIds = Array.from(
    new Set([...arrivalsSoon, ...departuresSoon].map((b) => b.customerId).filter(Boolean) as string[])
  );
  const custMap = new Map<string, { firstName: string; lastName: string }>();
  if (customerIds.length > 0) {
    const { inArray } = await import("drizzle-orm");
    const rows = await db
      .select({ id: customers.id, firstName: customers.firstName, lastName: customers.lastName })
      .from(customers)
      .where(inArray(customers.id, customerIds));
    for (const r of rows) custMap.set(r.id, { firstName: r.firstName, lastName: r.lastName });
  }

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[1400px]">
      <div className="eyebrow">Dashboard</div>
      <h1 className="text-[28px] sm:text-[40px] mt-2 mb-1">Heute auf der Wiesenhütte.</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0">
        {formatDateLong(today)}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8 sm:mt-10">
        <Kpi
          icon={<CalendarClock />}
          label="Heute An/Ab"
          value={`${arrivalsToday.length}/${departuresToday.length}`}
          tone={arrivalsToday.length + departuresToday.length > 0 ? "warm" : "default"}
        />
        <Kpi
          icon={<CalendarArrowDown />}
          label="Anreisen (7 T.)"
          value={String(arrivalsSoon.length)}
        />
        <Kpi
          icon={<Mail />}
          label="Offene Anfragen"
          value={String(openInquiries.length + openRequests)}
          tone={openInquiries.length + openRequests > 0 ? "warm" : "default"}
        />
        <Kpi
          icon={<BadgeEuro />}
          label="Offene Zahlungen"
          value={formatEuro(openPaymentTotalCents)}
          tone={openPaymentTotalCents > 0 ? "warm" : "default"}
        />
      </div>

      {/* Heute-Block — kompakt oben */}
      {(arrivalsToday.length > 0 || departuresToday.length > 0) && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {arrivalsToday.length > 0 && (
            <Section title={`Heute Anreise (${arrivalsToday.length})`}>
              {arrivalsToday.map((b) => {
                const c = b.customerId ? custMap.get(b.customerId) : null;
                return (
                  <Row
                    key={b.id}
                    href={`/m/buchungen/${b.id}`}
                    date={b.arrival}
                    title={c ? `${c.firstName} ${c.lastName}` : "—"}
                    subtitle={`${b.bookingNumber} · ${b.persons} Personen`}
                  />
                );
              })}
            </Section>
          )}
          {departuresToday.length > 0 && (
            <Section title={`Heute Abreise (${departuresToday.length})`}>
              {departuresToday.map((b) => {
                const c = b.customerId ? custMap.get(b.customerId) : null;
                return (
                  <Row
                    key={b.id}
                    href={`/m/buchungen/${b.id}`}
                    date={b.departure}
                    title={c ? `${c.firstName} ${c.lastName}` : "—"}
                    subtitle={`${b.bookingNumber} · ${b.persons} Personen`}
                  />
                );
              })}
            </Section>
          )}
        </div>
      )}

      {/* Offene Zahlungen + Anfragen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
        <Section title={`Offene Zahlungen (${openPaymentBookings.length})`}>
          {openPaymentBookings.length === 0 ? (
            <p className="text-[var(--color-wh-fg-muted)] text-sm">
              Keine offenen Zahlungen in den nächsten 30 Tagen.
            </p>
          ) : (
            openPaymentBookings.map((b) => {
              const c = b.customerId ? custMap.get(b.customerId) : null;
              const open = b.subtotalCents - b.paidCents;
              return (
                <Row
                  key={b.id}
                  href={`/m/buchungen/${b.id}`}
                  date={b.arrival}
                  title={c ? `${c.firstName} ${c.lastName}` : "—"}
                  subtitle={`${b.bookingNumber} · offen ${formatEuro(open)}`}
                />
              );
            })
          )}
        </Section>
        <Section
          title={`Offene Anfragen (${openInquiries.length + openRequests})`}
        >
          {openInquiries.length === 0 && openRequests === 0 && (
            <p className="text-[var(--color-wh-fg-muted)] text-sm">
              Keine offenen Anfragen.
            </p>
          )}
          {openInquiries.map((i) => (
            <Row
              key={i.id}
              href={`/m/buchungen?inquiry=${i.id}`}
              date={i.arrival ?? i.createdAt.toISOString().slice(0, 10)}
              title={i.name}
              subtitle={`Anfrage · ${i.email}${i.persons ? ` · ${i.persons} Personen` : ""}`}
            />
          ))}
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
        <Section title="Anreisen — nächste 7 Tage">
          {arrivalsSoon.length === 0 && (
            <p className="text-[var(--color-wh-fg-muted)] text-sm">Keine Anreisen.</p>
          )}
          {arrivalsSoon.map((b) => {
            const c = b.customerId ? custMap.get(b.customerId) : null;
            return (
              <Row
                key={b.id}
                href={`/m/buchungen/${b.id}`}
                date={b.arrival}
                title={c ? `${c.firstName} ${c.lastName}` : "—"}
                subtitle={`${b.bookingNumber} · ${b.persons} Personen`}
              />
            );
          })}
        </Section>
        <Section title="Abreisen — nächste 7 Tage">
          {departuresSoon.length === 0 && (
            <p className="text-[var(--color-wh-fg-muted)] text-sm">Keine Abreisen.</p>
          )}
          {departuresSoon.map((b) => {
            const c = b.customerId ? custMap.get(b.customerId) : null;
            return (
              <Row
                key={b.id}
                href={`/m/buchungen/${b.id}`}
                date={b.departure}
                title={c ? `${c.firstName} ${c.lastName}` : "—"}
                subtitle={`${b.bookingNumber} · ${b.persons} Personen`}
              />
            );
          })}
        </Section>
      </div>

      <Section title="Aktivität" className="mt-10">
        {recentActivity.length === 0 && (
          <p className="text-[var(--color-wh-fg-muted)] text-sm">Noch keine Aktivität.</p>
        )}
        <ul className="divide-y divide-[var(--color-wh-winter-grey)]">
          {recentActivity.map((a) => (
            <li key={a.id} className="py-3 flex items-start gap-3 text-sm">
              <div className="text-xs text-[var(--color-wh-fg-muted)] uppercase tracking-wider min-w-[120px]">
                {new Date(a.at).toLocaleString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="flex-1">
                <span className="font-semibold">{a.who}: </span>
                <span>{a.what}</span>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

const Kpi = ({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "warm";
}) => (
  <div
    className={`rounded-[var(--radius-card)] border border-[var(--color-wh-winter-grey)] bg-white p-4 sm:p-5 flex flex-col gap-2.5 sm:gap-3 ${
      tone === "warm" ? "bg-[var(--color-wh-beige)]" : ""
    }`}
  >
    <div className="text-[var(--color-wh-deep-green)] flex items-center justify-between">
      <span className="opacity-80">{icon}</span>
    </div>
    <div>
      <div className="font-display text-[30px] sm:text-[40px] leading-none font-bold text-[var(--color-wh-deep-green)] break-words">
        {value}
      </div>
      <div className="text-sm text-[var(--color-wh-fg-muted)] mt-2">{label}</div>
    </div>
  </div>
);

const Section = ({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section className={`bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 ${className}`}>
    <h3 className="text-[20px] m-0 mb-4">{title}</h3>
    {children}
  </section>
);

const Row = ({
  href,
  date,
  title,
  subtitle,
}: {
  href: string;
  date: string;
  title: string;
  subtitle: string;
}) => (
  <Link
    href={href}
    className="flex items-center gap-4 py-3 border-b border-[var(--color-wh-winter-grey)] last:border-b-0 no-underline text-[var(--color-wh-black)] hover:bg-[var(--color-wh-green-soft)]/40 -mx-2 px-2 rounded-md transition-colors"
  >
    <div className="text-xs uppercase tracking-wider text-[var(--color-wh-fg-muted)] min-w-[88px]">
      {new Date(date).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "short",
      })}
    </div>
    <div className="flex-1">
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-[var(--color-wh-fg-muted)]">{subtitle}</div>
    </div>
  </Link>
);
