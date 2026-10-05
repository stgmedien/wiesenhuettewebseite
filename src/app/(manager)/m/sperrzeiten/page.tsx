import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { eq, gte, desc } from "drizzle-orm";
import SperrzeitForm from "./SperrzeitForm";
import { StatusPill } from "@/components/manager/StatusPill";
import { formatDateLong } from "@/lib/utils";
import { isReservation, sperrzeitLabel } from "@/lib/reservation";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sperrzeiten · Wiesenhütte Manager" };

export default async function SperrzeitenPage() {
  const today = new Date().toISOString().slice(0, 10);
  const list = await db
    .select()
    .from(bookings)
    .where(eq(bookings.status, "wartung"))
    .orderBy(desc(bookings.arrival));

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[1100px]">
      <div className="eyebrow">Sperrzeiten</div>
      <h1 className="text-[40px] mt-2 mb-1">Sperrzeiten & Reservierungen</h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0">
        Sperre Zeiträume, in denen die Hütte nicht buchbar ist (Wartung, Vereinsveranstaltung,
        Eigennutzung) — oder halte einen Termin für eine geplante Fahrt frei (z.&nbsp;B. ESG),
        bis Klasse und Personenzahl feststehen.
      </p>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6 mt-8">
        <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6">
          <h3 className="text-[20px] m-0 mb-4">Aktuelle Sperrzeiten & Reservierungen</h3>
          {list.length === 0 ? (
            <p className="text-[var(--color-wh-fg-muted)] text-sm m-0">Keine Sperrzeiten.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-wh-winter-grey)]">
              {list.map((b) => (
                <li key={b.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{sperrzeitLabel(b.purpose) || "Wartung"}</div>
                    <div className="text-sm text-[var(--color-wh-fg-muted)]">
                      {formatDateLong(b.arrival)} → {formatDateLong(b.departure)}
                    </div>
                    {isReservation(b) && b.departure >= today && (
                      <Link
                        href={`/m/manuell?reservation=${b.id}`}
                        className="inline-block mt-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-wh-deep-green)] hover:underline"
                      >
                        In Buchung umwandeln →
                      </Link>
                    )}
                  </div>
                  <StatusPill status={isReservation(b) ? "reserviert" : b.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside>
          <SperrzeitForm />
        </aside>
      </div>
    </div>
  );
}
