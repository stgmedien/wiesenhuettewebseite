import { BookingFlow } from "./BookingFlow";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { gte } from "drizzle-orm";

export const metadata = { title: "Buchen · Wiesenhütte" };

export const dynamic = "force-dynamic";

export default async function BuchenPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString().slice(0, 10);

  const upcoming = await db
    .select({
      arrival: bookings.arrival,
      departure: bookings.departure,
      status: bookings.status,
    })
    .from(bookings)
    .where(gte(bookings.departure, todayIso))
    .limit(500);

  // Build a flat set of blocked dates for the calendar
  const blocked = new Set<string>();
  const blocking = ["angefragt", "bestaetigt", "bezahlt", "angereist", "wartung"];
  for (const b of upcoming) {
    if (!blocking.includes(b.status)) continue;
    const start = new Date(b.arrival);
    const end = new Date(b.departure);
    const cur = new Date(start);
    while (cur < end) {
      blocked.add(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
  }

  return (
    <div className="bg-[var(--color-wh-snow)] min-h-screen px-4 sm:px-8 py-12 sm:py-16">
      <div className="max-w-[1080px] mx-auto">
        <div className="eyebrow">Buchen</div>
        <h1 className="text-[44px] sm:text-[56px] mt-4 mb-2">Wann kommt Ihr?</h1>
        <p className="text-[var(--color-wh-fg-muted)] text-[18px] max-w-xl mt-4">
          Mindestaufenthalt 2 Nächte, Mindestbelegung 10 Personen, maximal 33 Personen.
          Preise und Pauschalen werden live berechnet.
        </p>
        <div className="mt-12">
          <BookingFlow blockedDates={Array.from(blocked)} />
        </div>
      </div>
    </div>
  );
}
