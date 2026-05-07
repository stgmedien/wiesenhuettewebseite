/**
 * Aufloesung aller GLOBAL_MAIL_VARIABLES fuer einen gegebenen Buchungs-Kontext.
 * Wird sowohl im Manager-Backend (Vorschau / Mail-Versand) als auch in
 * Lifecycle-Mails verwendet.
 */

import { db } from "@/lib/db";
import { bookings, customers, invoices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { formatEuro } from "@/lib/pricing";
import { formatDateLong } from "@/lib/utils";

const baseUrl = () =>
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.xn--wiesenhtte-geb.com";

const fmtShort = (iso: string | Date) => {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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

  const invRow = await db
    .select({ number: invoices.invoiceNumber })
    .from(invoices)
    .where(eq(invoices.bookingId, b.id))
    .limit(1);

  const remainder = Math.max(0, b.subtotalCents - Math.min(b.paidCents, b.subtotalCents));
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

    totalAmount: formatEuro(b.subtotalCents),
    paidAmount: formatEuro(b.paidCents),
    remainderAmount: formatEuro(remainder),
    depositAmount: formatEuro(b.depositCents),
    invoiceNumber: invRow[0]?.number ?? "",
  };
};

const baseVars = (): Record<string, string> => ({
  today: new Date().toLocaleDateString("de-DE"),
  baseUrl: baseUrl(),
});
