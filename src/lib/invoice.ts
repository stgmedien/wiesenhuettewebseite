/**
 * GoBD-konforme Rechnungsnummern via Postgres-Sequence (atomar, lueckenlos).
 *
 * Format: WH-YYYY-NNNNN  (z.B. WH-2026-00012)
 * Hinweis: lueckenlos pro Sequence, NICHT pro Jahr — wir gehen einfach
 * fortlaufend ueber Jahresgrenzen hinweg, das ist GoBD-konform und einfacher.
 */

import { db } from "@/lib/db";
import { invoices, bookings, customers, payments } from "@/lib/db/schema";
import { sql, eq, and, ne, desc } from "drizzle-orm";
import { resolveTariffs } from "@/lib/pricing-tariffs";
import { PRICES } from "@/lib/pricing";

export const allocateInvoiceNumber = async (): Promise<{ number: string; n: number }> => {
  const r = await db.execute(sql`SELECT nextval('invoice_seq') AS n`);
  const rows = (r as unknown as { n: string | number }[]) || [];
  const n = Number(rows[0]?.n ?? 1);
  const year = new Date().getFullYear();
  return { number: `WH-${year}-${String(n).padStart(5, "0")}`, n };
};

/**
 * Erzeugt eine atomare Invoice-Row fuer eine Buchung.
 * Idempotent: wenn fuer die Buchung schon eine Invoice existiert, wird
 * diese zurueckgegeben.
 */
export const createInvoiceForBooking = async (
  bookingId: string
): Promise<{ id: string; invoiceNumber: string; isNew: boolean }> => {
  // Existing invoice? Stornierte zaehlen nicht — nach einer Neuausstellung
  // (reissueInvoiceForBooking) muss hier die aktive Rechnung gefunden bzw.
  // eine neue erstellt werden.
  const existing = await db
    .select({ id: invoices.id, invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(and(eq(invoices.bookingId, bookingId), ne(invoices.status, "storniert")))
    .orderBy(desc(invoices.createdAt))
    .limit(1);
  if (existing[0]) {
    return { id: existing[0].id, invoiceNumber: existing[0].invoiceNumber, isNew: false };
  }

  const bookingRows = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  const booking = bookingRows[0];
  if (!booking) throw new Error("Buchung nicht gefunden");

  const customerRows = booking.customerId
    ? await db.select().from(customers).where(eq(customers.id, booking.customerId)).limit(1)
    : [];
  const customer = customerRows[0];

  const { number: invoiceNumber } = await allocateInvoiceNumber();
  const today = new Date().toISOString().slice(0, 10);

  // Line items snapshot
  const lineItems: { label: string; qty: number; unitCents: number; totalCents: number }[] = [];
  if (booking.accommodationCents > 0) {
    const tariffs = await resolveTariffs(booking.arrival);
    const nights = booking.nights;
    const categories = [
      { count: booking.adults,   unitCents: tariffs.nichtmitglied ?? PRICES.adultNonMemberCents, label: "Übernachtung — Erwachsene" },
      { count: booking.members,  unitCents: tariffs.mitglied      ?? PRICES.adultMemberCents,     label: "Übernachtung — Mitglied (−50 %)" },
      { count: booking.children, unitCents: tariffs.kind          ?? PRICES.childCents,            label: "Übernachtung — Kinder/Schüler bis 16 J." },
      { count: booking.pupils,   unitCents: tariffs.schueler      ?? PRICES.pupilCents,            label: "Übernachtung — Schüler Mitglied (−50 %)" },
      { count: booking.teachers, unitCents: tariffs.lehrer        ?? PRICES.adultNonMemberCents,   label: "Übernachtung — Lehrkräfte" },
    ] as const;

    let remainingCents = booking.accommodationCents;
    const activeCats = categories.filter((c) => c.count > 0);
    activeCats.forEach((cat, idx) => {
      const isLast = idx === activeCats.length - 1;
      const total = isLast ? remainingCents : cat.count * cat.unitCents * nights;
      remainingCents -= total;
      lineItems.push({
        label: `${cat.label} × ${nights} Nächte`,
        qty: cat.count * nights,
        unitCents: cat.unitCents,
        totalCents: total,
      });
    });
  }
  if (booking.energyFlatCents > 0) {
    lineItems.push({
      label: `Energiepauschale (${booking.nights} Nächte × 22,00 €)`,
      qty: booking.nights,
      unitCents: 2200,
      totalCents: booking.energyFlatCents,
    });
  }
  if (booking.cleaningCents > 0) {
    lineItems.push({
      label: "Endreinigung (Pflicht)",
      qty: 1,
      unitCents: booking.cleaningCents,
      totalCents: booking.cleaningCents,
    });
  }
  if (booking.soloSurchargeCents > 0) {
    lineItems.push({
      label: "Aufschlag Allein-/Exklusivnutzung",
      qty: 1,
      unitCents: booking.soloSurchargeCents,
      totalCents: booking.soloSurchargeCents,
    });
  }
  if (booking.minOccupancySurchargeCents > 0) {
    lineItems.push({
      label: "Aufschlag Mindestbelegung (15 Personen)",
      qty: 1,
      unitCents: booking.minOccupancySurchargeCents,
      totalCents: booking.minOccupancySurchargeCents,
    });
  }
  if (booking.extrasCents > 0) {
    lineItems.push({
      label: "Extras",
      qty: 1,
      unitCents: booking.extrasCents,
      totalCents: booking.extrasCents,
    });
  }

  const customerSnapshot = {
    name: customer
      ? `${customer.firstName} ${customer.lastName}`.trim()
      : "Anonymer Kunde",
    company: customer?.company ?? undefined,
    street: customer?.street ?? undefined,
    zip: customer?.zip ?? undefined,
    city: customer?.city ?? undefined,
    country: customer?.country ?? "DE",
    email: customer?.email ?? undefined,
  };

  // Gemeinnütziger Verein: keine USt fuer Vereinszweck-Vermietung
  const inserted = await db
    .insert(invoices)
    .values({
      invoiceNumber,
      bookingId: booking.id,
      customerId: customer?.id ?? null,
      status: "ausgestellt",
      issueDate: today,
      dueDate: today, // Anzahlung ist bereits erfolgt
      customerSnapshot,
      lineItems,
      subtotalCents: booking.subtotalCents,
      taxCents: 0,
      totalCents: booking.subtotalCents,
      notes:
        "Skifreunde Gütersloh e.V. ist als gemeinnütziger Verein anerkannt. Die Vermietung der Hütte erfolgt im Rahmen des satzungsmäßigen Zwecks und ist gemäß §4 UStG umsatzsteuerfrei. Freistellungsbescheid auf Anfrage.",
    })
    .returning({ id: invoices.id });

  return { id: inserted[0].id, invoiceNumber, isNew: true };
};

/**
 * Stellt die Rechnung einer Buchung neu aus (GoBD-konform):
 * Die bestehende Rechnung wird storniert (bleibt als Beleg erhalten),
 * anschliessend wird eine neue Rechnung mit neuer laufender Nummer und
 * aktuellem Buchungsstand (Personen, Preise, Adresse) erzeugt.
 *
 * Reihenfolge ist bewusst Storno-zuerst: schlaegt die Neuerstellung fehl,
 * existiert keine aktive Rechnung mehr und der Manager kann einfach erneut
 * "Rechnung erstellen" klicken — kein inkonsistenter Doppel-Zustand.
 */
export const reissueInvoiceForBooking = async (
  bookingId: string
): Promise<{ id: string; invoiceNumber: string; cancelledNumbers: string[] }> => {
  const active = await db
    .select({ id: invoices.id, invoiceNumber: invoices.invoiceNumber, notes: invoices.notes })
    .from(invoices)
    .where(and(eq(invoices.bookingId, bookingId), ne(invoices.status, "storniert")));

  const cancelledNumbers: string[] = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const inv of active) {
    await db
      .update(invoices)
      .set({
        status: "storniert",
        updatedAt: new Date(),
        notes: `${inv.notes ? inv.notes + "\n\n" : ""}STORNIERT am ${today} — ersetzt durch Neuausstellung.`,
      })
      .where(eq(invoices.id, inv.id));
    cancelledNumbers.push(inv.invoiceNumber);
  }

  const created = await createInvoiceForBooking(bookingId);
  return { id: created.id, invoiceNumber: created.invoiceNumber, cancelledNumbers };
};
