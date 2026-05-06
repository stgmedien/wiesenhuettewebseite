import { BookingFlow } from "./BookingFlow";
import { getBookingBlocks } from "@/lib/availability";
import { getBookingPrefill } from "./actions";
import { db } from "@/lib/db";
import { bookings, customers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const metadata = { title: "Buchen · Wiesenhütte" };

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ repeat?: string }>;
};

export default async function BuchenPage({ searchParams }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 720); // ~2 years out

  const { booked, cleaning, wartung } = await getBookingBlocks(today, horizon);
  const prefill = await getBookingPrefill();

  // Re-Book: gleiche Personenzahl, +1 Jahr Datum
  const sp = await searchParams;
  let repeatHint:
    | { adults: number; members: number; children: number; pupils: number; teachers: number; soloUse: boolean; arrival: string; departure: string }
    | undefined = undefined;
  if (sp.repeat && prefill.loggedIn) {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (userId) {
      const customerRow = await db
        .select()
        .from(customers)
        .where(eq(customers.userId, userId))
        .limit(1);
      const customer = customerRow[0];
      if (customer) {
        const found = await db
          .select()
          .from(bookings)
          .where(and(eq(bookings.id, sp.repeat), eq(bookings.customerId, customer.id)))
          .limit(1);
        const b = found[0];
        if (b) {
          const plusYear = (iso: string) => {
            const d = new Date(iso);
            d.setFullYear(d.getFullYear() + 1);
            return d.toISOString().slice(0, 10);
          };
          repeatHint = {
            adults: b.adults,
            members: b.members,
            children: b.children,
            pupils: b.pupils,
            teachers: b.teachers,
            soloUse: b.soloUse,
            arrival: plusYear(b.arrival),
            departure: plusYear(b.departure),
          };
        }
      }
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
        {prefill.loggedIn && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-wh-beige)] border border-[var(--color-wh-winter-grey)]/40 px-4 py-2 text-sm">
            <span className="text-[var(--color-wh-deep-green)]">●</span>
            Eingeloggt als <strong>{prefill.email}</strong>
            {prefill.membershipVerified && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                Mitglied
              </span>
            )}
          </div>
        )}
        <div className="mt-12">
          <BookingFlow
            bookedDates={Array.from(booked)}
            cleaningDates={Array.from(cleaning)}
            wartungDates={Array.from(wartung)}
            prefill={prefill}
            repeatHint={repeatHint}
          />
        </div>
      </div>
    </div>
  );
}
