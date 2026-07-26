import { db } from "@/lib/db";
import { bookings, customers } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { PRICES, formatEuro } from "@/lib/pricing";

export type PriceMismatch = {
  bookingId: string;
  bookingNumber: string;
  guestName: string;
  issues: string[];
};

/**
 * Reine Selbstkonsistenz-Prüfung der gespeicherten Preisfelder — siehe
 * ausführlichen Kommentar in api/cron/price-consistency-check/route.ts dazu,
 * warum hier bewusst NICHT gegen resolveTariffs()/calculatePrice() geprüft
 * wird (Tarifpreis-Änderungen würden sonst ältere, korrekte Buchungen
 * fälschlich als inkonsistent melden).
 *
 * Von Cron (Mail-Digest) UND Dashboard-Widget genutzt, damit beide exakt
 * dieselbe Logik verwenden.
 */
export async function findPriceMismatches(): Promise<PriceMismatch[]> {
  const relevant = await db
    .select()
    .from(bookings)
    .where(inArray(bookings.status, ["angefragt", "bestaetigt", "bezahlt", "angereist"]));

  const raw: { bookingId: string; bookingNumber: string; customerId: string | null; issues: string[] }[] = [];

  for (const b of relevant) {
    const issues: string[] = [];

    const expectedSubtotal =
      b.accommodationCents +
      b.energyFlatCents +
      b.cleaningCents +
      b.soloSurchargeCents +
      b.minOccupancySurchargeCents +
      b.extrasCents -
      b.discountCents;
    if (expectedSubtotal !== b.subtotalCents) {
      issues.push(
        `Zwischensumme stimmt nicht: gespeichert ${formatEuro(b.subtotalCents)}, aus Einzelposten ${formatEuro(expectedSubtotal)}.`
      );
    }
    if (b.totalCents !== b.subtotalCents) {
      issues.push(
        `Gesamtsumme ≠ Zwischensumme: ${formatEuro(b.totalCents)} vs. ${formatEuro(b.subtotalCents)}.`
      );
    }

    const kurtaxePersons = b.adults + b.members + b.teachers;
    const expectedKurtaxe = kurtaxePersons * b.nights * PRICES.kurtaxeRateCents;
    if (expectedKurtaxe !== b.kurtaxeCents) {
      issues.push(
        `Kurtaxe stimmt nicht: gespeichert ${formatEuro(b.kurtaxeCents)}, erwartet ${formatEuro(expectedKurtaxe)} (${kurtaxePersons} Pers. × ${b.nights} Nächte × ${formatEuro(PRICES.kurtaxeRateCents)}).`
      );
    }

    if (issues.length > 0) {
      raw.push({ bookingId: b.id, bookingNumber: b.bookingNumber, customerId: b.customerId, issues });
    }
  }

  if (raw.length === 0) return [];

  const customerIds = [...new Set(raw.map((m) => m.customerId).filter((v): v is string => Boolean(v)))];
  const customerRows =
    customerIds.length > 0
      ? await db.select().from(customers).where(inArray(customers.id, customerIds))
      : [];
  const customerById = new Map(customerRows.map((c) => [c.id, c]));

  return raw.map((m) => {
    const c = m.customerId ? customerById.get(m.customerId) : undefined;
    return {
      bookingId: m.bookingId,
      bookingNumber: m.bookingNumber,
      guestName: c ? `${c.firstName} ${c.lastName}`.trim() : "—",
      issues: m.issues,
    };
  });
}
