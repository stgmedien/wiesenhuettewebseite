import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { isReservation, sperrzeitLabel } from "@/lib/reservation";
import { formatDateLong } from "@/lib/utils";
import ManualBookingForm from "./ManualBookingForm";

export const metadata = { title: "Manuelle Buchung · Wiesenhütte Manager" };

type Props = { searchParams: Promise<{ reservation?: string }> };

export default async function ManuellPage({ searchParams }: Props) {
  // "In Buchung umwandeln" auf der Sperrzeiten-Seite verlinkt hierher: Zeitraum
  // und Anlass der Reservierung werden vorbelegt, beim Speichern ersetzt die
  // neue Buchung die Reservierung.
  const { reservation: reservationId } = await searchParams;
  let reservation: { id: string; arrival: string; departure: string; label: string } | null = null;
  if (reservationId && /^[0-9a-f-]{36}$/i.test(reservationId)) {
    const found = (
      await db.select().from(bookings).where(eq(bookings.id, reservationId)).limit(1)
    )[0];
    if (found && isReservation(found)) {
      reservation = {
        id: found.id,
        arrival: found.arrival,
        departure: found.departure,
        label: sperrzeitLabel(found.purpose),
      };
    }
  }

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[820px]">
      <div className="eyebrow">Manuelle Buchung</div>
      <h1 className="text-[40px] mt-2 mb-1">
        {reservation ? "Reservierung in Buchung umwandeln" : "Buchung anlegen"}
      </h1>
      <p className="text-[var(--color-wh-fg-muted)] m-0">
        Für telefonische oder E-Mail-Anfragen. Buchung wird direkt mit Status „Bestätigt“
        angelegt — keine Zahlung über Stripe.
      </p>
      {reservation && (
        <div className="mt-4 text-sm bg-[var(--color-wh-green-soft)] p-3 rounded-md">
          Reservierung <strong>{reservation.label}</strong> ({formatDateLong(reservation.arrival)}{" "}
          → {formatDateLong(reservation.departure)}): Zeitraum und Anlass sind vorbelegt. Beim
          Speichern ersetzt die neue Buchung die Reservierung.
        </div>
      )}

      <div className="mt-8">
        <ManualBookingForm reservation={reservation} />
      </div>
    </div>
  );
}
