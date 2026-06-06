import { db } from "@/lib/db";
import { bookings, customers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { formatEuro } from "@/lib/pricing";
import { StatusPill } from "@/components/manager/StatusPill";

export const dynamic = "force-dynamic";
export const metadata = { title: "Buchungen · Wiesenhütte Manager" };

export default async function BookingsListPage() {
  const rows = await db
    .select({
      id: bookings.id,
      bookingNumber: bookings.bookingNumber,
      status: bookings.status,
      arrival: bookings.arrival,
      departure: bookings.departure,
      nights: bookings.nights,
      persons: bookings.persons,
      totalCents: bookings.subtotalCents,
      paidCents: bookings.paidCents,
      depositCents: bookings.depositCents,
      customerFirst: customers.firstName,
      customerLast: customers.lastName,
      customerType: customers.type,
      customerEmail: customers.email,
    })
    .from(bookings)
    .leftJoin(customers, eq(customers.id, bookings.customerId))
    .orderBy(desc(bookings.arrival));

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="eyebrow">Buchungen</div>
          <h1 className="text-[28px] sm:text-[40px] mt-2 mb-0">Alle Buchungen</h1>
          <p className="text-[var(--color-wh-fg-muted)] m-0 mt-2">{rows.length} insgesamt</p>
        </div>
        <Link
          href="/m/manuell"
          className="inline-flex h-11 px-5 items-center justify-center rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] no-underline font-semibold shrink-0"
        >
          + Manuelle Buchung
        </Link>
      </div>

      <div className="mt-8 bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-[var(--color-wh-snow)] border-b border-[var(--color-wh-winter-grey)]">
            <tr className="text-left">
              <Th>Nr.</Th>
              <Th>Status</Th>
              <Th>Zeitraum</Th>
              <Th>Gast</Th>
              <Th>Personen</Th>
              <Th>Summe</Th>
              <Th>Bezahlt</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-wh-fg-muted)]">
                  Noch keine Buchungen.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-[var(--color-wh-winter-grey)] last:border-b-0 hover:bg-[var(--color-wh-green-soft)]/30 transition-colors cursor-pointer"
              >
                <Td>
                  <Link href={`/m/buchungen/${r.id}`} className="no-underline text-[var(--color-wh-deep-green)] font-semibold">
                    {r.bookingNumber}
                  </Link>
                </Td>
                <Td>
                  <StatusPill status={r.status} />
                </Td>
                <Td>
                  <div>{new Date(r.arrival).toLocaleDateString("de-DE")}</div>
                  <div className="text-xs text-[var(--color-wh-fg-muted)]">
                    bis {new Date(r.departure).toLocaleDateString("de-DE")} · {r.nights} N.
                  </div>
                </Td>
                <Td>
                  <div className="font-semibold">
                    {r.customerFirst} {r.customerLast}
                  </div>
                  <div className="text-xs text-[var(--color-wh-fg-muted)]">{r.customerEmail}</div>
                </Td>
                <Td>{r.persons}</Td>
                <Td>{formatEuro(r.totalCents + r.depositCents)}</Td>
                <Td>
                  <span
                    className={
                      r.paidCents >= r.totalCents + r.depositCents
                        ? "text-[var(--color-wh-deep-green)] font-semibold"
                        : "text-[var(--color-wh-sunset)] font-semibold"
                    }
                  >
                    {formatEuro(r.paidCents)}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[var(--color-wh-fg-muted)]">
    {children}
  </th>
);
const Td = ({ children }: { children: React.ReactNode }) => (
  <td className="px-4 py-3 align-top">{children}</td>
);
