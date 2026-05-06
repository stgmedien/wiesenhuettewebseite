import { BookingFlow } from "./BookingFlow";
import { getBookingBlocks } from "@/lib/availability";

export const metadata = { title: "Buchen · Wiesenhütte" };

export const dynamic = "force-dynamic";

export default async function BuchenPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 720); // ~2 years out

  const { booked, cleaning, wartung } = await getBookingBlocks(today, horizon);

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
          <BookingFlow
            bookedDates={Array.from(booked)}
            cleaningDates={Array.from(cleaning)}
            wartungDates={Array.from(wartung)}
          />
        </div>
      </div>
    </div>
  );
}
