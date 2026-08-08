import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookingHubs, bookings, hubEntries } from "@/lib/db/schema";
import { formatDateLong } from "@/lib/utils";
import { hubDays } from "@/lib/hub-shared";
import { HubClient, type HubEntryView } from "./HubClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gruppen-Hub · Wiesenhütte",
  description:
    "Plant Euren Wiesenhütten-Aufenthalt gemeinsam: Packliste, Essensplan, Zimmeraufteilung und Mitfahrbörse.",
  // Token-Seite — Suchmaschinen haben hier nichts verloren.
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

export default async function GruppenHubPage({ params }: Props) {
  const { token } = await params;

  // Hub über den Token laden + Buchung joinen für den Kopf.
  // Bewusst NUR Zeitraum + Personenzahl selektieren — KEINE Buchungsnummer
  // und KEINE Gast-Daten: der Link wandert durch Gruppen-Chats.
  const rows = await db
    .select({
      hubId: bookingHubs.id,
      arrival: bookings.arrival,
      departure: bookings.departure,
      persons: bookings.persons,
      nights: bookings.nights,
    })
    .from(bookingHubs)
    .innerJoin(bookings, eq(bookingHubs.bookingId, bookings.id))
    .where(eq(bookingHubs.token, token))
    .limit(1);
  const hub = rows[0];
  if (!hub) notFound();

  const entryRows = await db
    .select()
    .from(hubEntries)
    .where(eq(hubEntries.hubId, hub.hubId))
    .orderBy(asc(hubEntries.createdAt));

  const entries: HubEntryView[] = entryRows.map((e) => ({
    id: e.id,
    kind: e.kind,
    title: e.title,
    details: e.details,
    authorName: e.authorName,
    done: e.done,
    meta: e.meta ?? null,
  }));

  const days = hubDays(hub.arrival, hub.departure);

  return (
    <div className="bg-[var(--color-wh-snow)] min-h-screen">
      <section className="bg-[var(--color-wh-beige)] px-4 sm:px-8 py-10 sm:py-14">
        <div className="max-w-[880px] mx-auto">
          <div className="eyebrow mb-2">Gemeinsam planen</div>
          <h1 className="text-[30px] sm:text-[44px] m-0 mb-3 leading-[1.08] font-display font-bold text-[var(--color-wh-deep-green)]">
            🏔️ Euer Gruppen-Hub.
          </h1>
          <p className="text-[15px] sm:text-[17px] leading-relaxed max-w-2xl text-[var(--color-wh-black)] m-0 mb-4">
            Hier plant Ihr Euren Hütten-Aufenthalt zusammen — wer bringt was mit, wer
            kocht wann, wer schläft wo und wer fährt mit wem. Alles ohne Login: Wer den
            Link hat, ist dabei.
          </p>
          <div className="flex flex-wrap gap-2 text-[13px] sm:text-sm">
            <span className="rounded-full bg-white/80 border border-[var(--color-wh-winter-grey)]/60 px-3 py-1.5 font-medium text-[var(--color-wh-deep-green)]">
              📅 {formatDateLong(hub.arrival)} – {formatDateLong(hub.departure)}
            </span>
            <span className="rounded-full bg-white/80 border border-[var(--color-wh-winter-grey)]/60 px-3 py-1.5 font-medium text-[var(--color-wh-deep-green)]">
              👥 {hub.persons} Personen · {hub.nights} {hub.nights === 1 ? "Nacht" : "Nächte"}
            </span>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-[880px] mx-auto">
          <HubClient
            token={token}
            days={days}
            persons={hub.persons}
            entries={entries}
          />
        </div>
      </section>
    </div>
  );
}
