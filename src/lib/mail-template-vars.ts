/**
 * Aufloesung aller GLOBAL_MAIL_VARIABLES fuer einen gegebenen Buchungs-Kontext.
 * Wird sowohl im Manager-Backend (Vorschau / Mail-Versand) als auch in
 * Lifecycle-Mails verwendet.
 */

import { db } from "@/lib/db";
import { bookings, customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { formatEuro, RULES } from "@/lib/pricing";
import { formatDateLong } from "@/lib/utils";
import { getActiveInvoiceForBooking } from "@/lib/invoice";

const baseUrl = () =>
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.wiesenhuette.de";

const fmtShort = (iso: string | Date) => {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Anreise minus 14 Tage, aus den lokalen Datumskomponenten (nicht ueber
// new Date(isoString) + UTC-Parsing, siehe toLocalIso-Kommentar in utils.ts).
const minusDaysFromIso = (iso: string, days: number): Date => {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() - days);
  return date;
};

export const buildBookingVars = async (
  bookingId: string
): Promise<Record<string, string>> => {
  const found = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  const b = found[0];
  if (!b) return baseVars();

  const customer = b.customerId
    ? (await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1))[0]
    : null;

  // Kanonischer Lookup: nach einer Neuausstellung darf hier nie die
  // stornierte Rechnungsnummer in Gast-Mails landen.
  const activeInvoice = await getActiveInvoiceForBooking(b.id);

  // b.subtotalCents ist bewusst OHNE Kaution und OHNE Kurtaxe (siehe pricing.ts) --
  // der tatsaechlich vom Gast geschuldete Betrag ist Zwischensumme + Kaution +
  // Kurtaxe. Vorher fehlten hier Kaution und Kurtaxe komplett (z.B. 662,00 €
  // statt 972,80 € bei einer manuellen Buchung mit 300 € Kaution + 10,80 €
  // Kurtaxe -- in der Praxis aufgefallen).
  const totalCents = b.subtotalCents + b.depositCents + b.kurtaxeCents;
  const remainder = Math.max(0, totalCents - Math.min(b.paidCents, totalCents));

  // Standard-Zahlungssplit (siehe buchen/actions.ts + T-14-Cron): Anzahlung
  // (50 % der Zwischensumme) ist heute faellig, Kaution + Kurtaxe werden NICHT
  // bei Buchung eingezogen, sondern zusammen mit der Restzahlung bei T-14
  // (Vorstandsbeschluss). Gilt nur fuer den Normalfall (Anreise >= 14 Tage
  // entfernt) -- bei kurzfristigen Buchungen wird abweichend alles sofort
  // faellig, das bildet dieser Split hier nicht ab.
  const prepaymentCents = Math.round((b.subtotalCents * RULES.prepaymentPercent) / 100);
  const restzahlungCents = b.subtotalCents - prepaymentCents + b.depositCents + b.kurtaxeCents;
  const restzahlungDate = minusDaysFromIso(b.arrival, 14);

  const guestFirst = customer?.firstName ?? "";
  const guestLast = customer?.lastName ?? "";

  return {
    ...baseVars(),
    firstName: guestFirst,
    lastName: guestLast,
    guestName: `${guestFirst} ${guestLast}`.trim() || "Gast",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    salutation: guestFirst ? `Hallo ${guestFirst},` : "Hallo,",

    bookingNumber: b.bookingNumber,
    arrival: formatDateLong(b.arrival),
    departure: formatDateLong(b.departure),
    arrivalShort: fmtShort(b.arrival),
    departureShort: fmtShort(b.departure),
    nights: String(b.nights),
    persons: String(b.persons),
    purpose: b.purpose ?? "",
    bookingUrl: `${baseUrl()}/konto/buchungen/${b.id}`,

    totalAmount: formatEuro(totalCents),
    paidAmount: formatEuro(b.paidCents),
    remainderAmount: formatEuro(remainder),
    depositAmount: formatEuro(b.depositCents),
    kurtaxeAmount: formatEuro(b.kurtaxeCents),
    prepaymentAmount: formatEuro(prepaymentCents),
    restzahlungAmount: formatEuro(restzahlungCents),
    restzahlungDate: formatDateLong(restzahlungDate),
    invoiceNumber: activeInvoice?.invoiceNumber ?? "",
  };
};

const baseVars = (): Record<string, string> => ({
  today: new Date().toLocaleDateString("de-DE"),
  baseUrl: baseUrl(),
});
