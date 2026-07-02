import { db } from "@/lib/db";
import { bookings, customers } from "@/lib/db/schema";
import { eq, gte, ne, desc } from "drizzle-orm";
import { and } from "drizzle-orm";
import { inArray } from "drizzle-orm";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Buchungsübersicht – Wiesenhütte" };

export default async function DruckenPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString().slice(0, 10);

  const rows = await db
    .select({
      id: bookings.id,
      bookingNumber: bookings.bookingNumber,
      status: bookings.status,
      arrival: bookings.arrival,
      departure: bookings.departure,
      nights: bookings.nights,
      persons: bookings.persons,
      purpose: bookings.purpose,
      customerId: bookings.customerId,
    })
    .from(bookings)
    .where(
      and(
        gte(bookings.arrival, todayIso),
        inArray(bookings.status, ["bezahlt", "bestaetigt"])
      )
    )
    .orderBy(bookings.arrival);

  const customerIds = rows.map((r) => r.customerId).filter(Boolean) as string[];
  const custMap = new Map<string, { firstName: string; lastName: string; email: string; phone: string | null }>();
  if (customerIds.length > 0) {
    const custs = await db
      .select({ id: customers.id, firstName: customers.firstName, lastName: customers.lastName, email: customers.email, phone: customers.phone })
      .from(customers)
      .where(inArray(customers.id, customerIds));
    for (const c of custs) custMap.set(c.id, c);
  }

  // Gruppieren nach Monat
  const byMonth = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = r.arrival.slice(0, 7); // YYYY-MM
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(r);
  }

  const monthLabel = (key: string) => {
    const [year, month] = key.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  const printedOn = today.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .lg\\:grid { display: block !important; }
          .hidden.lg\\:block { display: none !important; }
          header { display: none !important; }
          body { background: white !important; }
          .print-page { padding: 0 !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
          .month-section { page-break-inside: avoid; }
        }
      `}</style>

      <div className="print-page px-6 py-8 max-w-[900px]">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 no-print">
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--color-wh-fg-muted)] font-semibold mb-1">Wiesenhütte · Manager</div>
            <h1 className="text-[28px] font-bold text-[var(--color-wh-deep-green)] m-0">Buchungsübersicht</h1>
            <p className="text-sm text-[var(--color-wh-fg-muted)] mt-1">
              Alle bestätigten Buchungen ab heute · Stand {printedOn}
            </p>
          </div>
          <PrintButton />
        </div>

        {/* Print-Header (nur im Druck sichtbar) */}
        <div className="hidden print:block mb-6">
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#5b5b56", marginBottom: 4 }}>
            Skifreunde Gütersloh e.V. · Wiesenhütte Langewiese
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#2F4A35", marginBottom: 2 }}>
            Buchungsübersicht
          </div>
          <div style={{ fontSize: 12, color: "#5b5b56" }}>
            Alle bestätigten Buchungen ab heute · Stand {printedOn}
          </div>
        </div>

        {rows.length === 0 && (
          <p className="text-[var(--color-wh-fg-muted)]">Keine kommenden Buchungen vorhanden.</p>
        )}

        {[...byMonth.entries()].map(([monthKey, monthRows]) => (
          <div key={monthKey} className="month-section mb-8">
            <h2 className="text-[16px] font-semibold uppercase tracking-wider text-[var(--color-wh-deep-green)] border-b-2 border-[var(--color-wh-deep-green)] pb-1 mb-3">
              {monthLabel(monthKey)} <span className="font-normal text-[var(--color-wh-fg-muted)] text-sm normal-case tracking-normal">({monthRows.length} {monthRows.length === 1 ? "Buchung" : "Buchungen"})</span>
            </h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#EFE6D8] text-[var(--color-wh-deep-green)]">
                  <Th>Zeitraum</Th>
                  <Th>Buchung</Th>
                  <Th>Gast</Th>
                  <Th>Kontakt</Th>
                  <Th center>P.</Th>
                  <Th>Anlass</Th>
                </tr>
              </thead>
              <tbody>
                {monthRows.map((r, i) => {
                  const c = r.customerId ? custMap.get(r.customerId) : null;
                  return (
                    <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? "white" : "#F7F7F2" }}>
                      <Td>
                        <div className="font-semibold whitespace-nowrap">{fmt(r.arrival)}</div>
                        <div className="text-xs text-[var(--color-wh-fg-muted)]">bis {fmt(r.departure)} · {r.nights} N.</div>
                      </Td>
                      <Td>
                        <div className="font-mono text-xs">{r.bookingNumber}</div>
                        <div className="text-xs mt-0.5">
                          <span style={{
                            display: "inline-block",
                            padding: "1px 6px",
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            backgroundColor: r.status === "bezahlt" ? "#C0DD97" : "#FAC775",
                            color: r.status === "bezahlt" ? "#173404" : "#412402",
                          }}>
                            {r.status === "bezahlt" ? "Bezahlt" : "Bestätigt"}
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <div className="font-semibold">{c ? `${c.firstName} ${c.lastName}` : "—"}</div>
                      </Td>
                      <Td>
                        <div className="text-xs">{c?.email ?? "—"}</div>
                        {c?.phone && <div className="text-xs text-[var(--color-wh-fg-muted)]">{c.phone}</div>}
                      </Td>
                      <Td center>{r.persons}</Td>
                      <Td>
                        <div className="text-xs">{r.purpose ?? "—"}</div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

        <div className="mt-10 pt-4 border-t border-[var(--color-wh-winter-grey)] text-xs text-[var(--color-wh-fg-muted)]">
          Skifreunde Gütersloh e.V. · Wiesenhütte Langewiese · hello@wiesenhuette.de · wiesenhuette.de
        </div>
      </div>
    </>
  );
}

const Th = ({ children, center, right }: { children: React.ReactNode; center?: boolean; right?: boolean }) => (
  <th className={`px-3 py-2 text-xs font-semibold text-left ${center ? "text-center" : ""} ${right ? "text-right" : ""}`}>
    {children}
  </th>
);

const Td = ({ children, center, right }: { children: React.ReactNode; center?: boolean; right?: boolean }) => (
  <td className={`px-3 py-2 border-b border-[var(--color-wh-winter-grey)] align-top ${center ? "text-center" : ""} ${right ? "text-right" : ""}`}>
    {children}
  </td>
);
