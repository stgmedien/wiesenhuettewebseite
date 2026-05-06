import { db } from "@/lib/db";
import { bookings, customers } from "@/lib/db/schema";
import { eq, gte, lte, and } from "drizzle-orm";
import { CalendarGrid } from "./CalendarGrid";
import { RULES } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kalender · Wiesenhütte Manager" };

type Props = { searchParams: Promise<{ y?: string; m?: string }> };

export default async function CalendarPage({ searchParams }: Props) {
  const { y, m } = await searchParams;
  const now = new Date();
  const year = y ? Number(y) : now.getFullYear();
  const monthIdx = m ? Number(m) - 1 : now.getMonth();

  const monthStart = new Date(year, monthIdx, 1);
  const monthEnd = new Date(year, monthIdx + 1, 0);
  const fromIso = monthStart.toISOString().slice(0, 10);
  const toIso = monthEnd.toISOString().slice(0, 10);

  const list = await db
    .select({
      id: bookings.id,
      bookingNumber: bookings.bookingNumber,
      status: bookings.status,
      arrival: bookings.arrival,
      departure: bookings.departure,
      persons: bookings.persons,
      customerFirst: customers.firstName,
      customerLast: customers.lastName,
    })
    .from(bookings)
    .leftJoin(customers, eq(customers.id, bookings.customerId))
    .where(and(lte(bookings.arrival, toIso), gte(bookings.departure, fromIso)));

  const events = list.map((b) => ({
    id: b.id,
    bookingNumber: b.bookingNumber,
    status: b.status,
    arrival: b.arrival,
    departure: b.departure,
    persons: b.persons,
    title:
      b.customerFirst || b.customerLast
        ? `${b.customerFirst ?? ""} ${b.customerLast ?? ""}`.trim()
        : b.bookingNumber,
  }));

  // Cleaning days = day of departure (and following days when cleaningDays > 1) for non-Wartung
  const cleaningDates = new Set<string>();
  for (const e of list) {
    if (e.status === "wartung") continue;
    const dep = new Date(e.departure);
    for (let i = 0; i < RULES.cleaningDaysAfterDeparture; i++) {
      const d = new Date(dep);
      d.setDate(d.getDate() + i);
      cleaningDates.add(d.toISOString().slice(0, 10));
    }
  }

  return (
    <div className="px-8 py-10 max-w-[1400px]">
      <div className="eyebrow">Kalender</div>
      <h1 className="text-[40px] mt-2 mb-0">Belegung</h1>
      <CalendarGrid
        year={year}
        monthIdx={monthIdx}
        events={events}
        cleaningDates={Array.from(cleaningDates)}
      />
    </div>
  );
}
