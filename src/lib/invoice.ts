/**
 * GoBD-konforme Rechnungsnummern via Postgres-Sequence (atomar, lueckenlos).
 *
 * Format: WH-YYYY-NNNNN  (z.B. WH-2026-00012)
 * Hinweis: lueckenlos pro Sequence, NICHT pro Jahr — wir gehen einfach
 * fortlaufend ueber Jahresgrenzen hinweg, das ist GoBD-konform und einfacher.
 */

import { db } from "@/lib/db";
import { invoices, bookings, customers } from "@/lib/db/schema";
import { sql, eq, and, ne, desc } from "drizzle-orm";
import { resolveBookingTariffs } from "@/lib/pricing-tariffs";
import { PRICES } from "@/lib/pricing";
import { toLocalIso } from "@/lib/utils";

/**
 * Executor-Typ: erlaubt, dieselben Funktionen innerhalb einer Transaktion
 * (tx) oder direkt auf db laufen zu lassen.
 */
type Dbx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export const allocateInvoiceNumber = async (
  dbx: Dbx = db
): Promise<{ number: string; n: number }> => {
  const r = await dbx.execute(sql`SELECT nextval('invoice_seq') AS n`);
  const rows = (r as unknown as { n: string | number }[]) || [];
  const n = Number(rows[0]?.n ?? 1);
  const year = new Date().getFullYear();
  return { number: `WH-${year}-${String(n).padStart(5, "0")}`, n };
};

export type ActiveInvoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string | null;
};

/**
 * Kanonischer Lookup der AKTIVEN (nicht stornierten) Rechnung einer Buchung.
 * Nach einer Neuausstellung existieren storniert + aktiv nebeneinander —
 * alle Anzeige-/Mail-/Export-Pfade muessen diese Funktion nutzen, damit
 * nirgends die stornierte Rechnung auftaucht.
 */
export const getActiveInvoiceForBooking = async (
  bookingId: string,
  dbx: Dbx = db
): Promise<ActiveInvoice | null> => {
  const rows = await dbx
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      issueDate: invoices.issueDate,
    })
    .from(invoices)
    .where(and(eq(invoices.bookingId, bookingId), ne(invoices.status, "storniert")))
    .orderBy(desc(invoices.createdAt))
    .limit(1);
  return rows[0] ?? null;
};

/**
 * Erzeugt eine atomare Invoice-Row fuer eine Buchung.
 * Idempotent: wenn fuer die Buchung schon eine aktive Invoice existiert,
 * wird diese zurueckgegeben.
 */
export const createInvoiceForBooking = async (
  bookingId: string,
  dbx: Dbx = db
): Promise<{ id: string; invoiceNumber: string; isNew: boolean }> => {
  // Existing invoice? Stornierte zaehlen nicht — nach einer Neuausstellung
  // (reissueInvoiceForBooking) muss hier die aktive Rechnung gefunden bzw.
  // eine neue erstellt werden.
  const existing = await getActiveInvoiceForBooking(bookingId, dbx);
  if (existing) {
    return { id: existing.id, invoiceNumber: existing.invoiceNumber, isNew: false };
  }

  const bookingRows = await dbx.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  const booking = bookingRows[0];
  if (!booking) throw new Error("Buchung nicht gefunden");

  const customerRows = booking.customerId
    ? await dbx.select().from(customers).where(eq(customers.id, booking.customerId)).limit(1)
    : [];
  const customer = customerRows[0];

  const { number: invoiceNumber } = await allocateInvoiceNumber(dbx);
  const today = toLocalIso(new Date());

  // Line items snapshot
  const lineItems: { label: string; qty: number; unitCents: number; totalCents: number }[] = [];
  if (booking.accommodationCents > 0) {
    const tariffs = await resolveBookingTariffs(booking);
    const nights = booking.nights;
    const categories = [
      // Lehrkräfte zaehlen als Erwachsene (gleicher Preis) — eine gemeinsame Zeile.
      { count: booking.adults + booking.teachers, unitCents: tariffs.nichtmitglied ?? PRICES.adultNonMemberCents, label: "Übernachtung — Erwachsene" },
      { count: booking.members,  unitCents: tariffs.mitglied      ?? PRICES.adultMemberCents,     label: "Übernachtung — Mitglied (−50 %)" },
      { count: booking.children, unitCents: tariffs.kind          ?? PRICES.childCents,            label: "Übernachtung — Kinder/Schüler bis 16 J." },
      { count: booking.pupils,   unitCents: tariffs.schueler      ?? PRICES.pupilCents,            label: "Übernachtung — Schüler Mitglied (−50 %)" },
    ] as const;

    // Konsistenz-Check statt stiller Rest-Korrektur: Nur wenn die aus den
    // (heute aktiven) Tarifen berechneten Kategorien exakt den gespeicherten
    // Uebernachtungsbetrag ergeben, wird aufgeschluesselt. Weichen sie ab
    // (Tarif zwischenzeitlich geaendert, manuell angepasster Preis, keine
    // Kategorien-Zaehler), faellt die Rechnung auf die ehrliche Sammelzeile
    // zurueck — niemals erfundene Einzelpreise ausweisen.
    const activeCats = categories.filter((c) => c.count > 0);
    const computedTotal = activeCats.reduce(
      (acc, cat) => acc + cat.count * cat.unitCents * nights,
      0
    );
    if (activeCats.length > 0 && computedTotal === booking.accommodationCents) {
      for (const cat of activeCats) {
        lineItems.push({
          label: `${cat.label} × ${nights} Nächte`,
          qty: cat.count * nights,
          unitCents: cat.unitCents,
          totalCents: cat.count * cat.unitCents * nights,
        });
      }
    } else {
      lineItems.push({
        label: `Übernachtung — ${booking.persons} Personen × ${nights} Nächte`,
        qty: booking.persons * nights,
        unitCents: Math.round(booking.accommodationCents / Math.max(1, booking.persons * nights)),
        totalCents: booking.accommodationCents,
      });
    }
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
  const inserted = await dbx
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
 * Laeuft als EINE Transaktion: Storno + Neuerstellung sind atomar. Das
 * FOR UPDATE-Lock auf den aktiven Rechnungen serialisiert gleichzeitige
 * Neuausstellungen (zwei Tabs/Manager) — sonst koennten beide stornieren
 * und beide neu erstellen, mit zwei aktiven Rechnungen als Ergebnis.
 */
export const reissueInvoiceForBooking = async (
  bookingId: string
): Promise<{ id: string; invoiceNumber: string; cancelledNumbers: string[] }> => {
  return db.transaction(async (tx) => {
    const active = await tx
      .select({ id: invoices.id, invoiceNumber: invoices.invoiceNumber, notes: invoices.notes })
      .from(invoices)
      .where(and(eq(invoices.bookingId, bookingId), ne(invoices.status, "storniert")))
      .for("update");

    const cancelledNumbers: string[] = [];
    const today = toLocalIso(new Date());
    for (const inv of active) {
      await tx
        .update(invoices)
        .set({
          status: "storniert",
          updatedAt: new Date(),
          notes: `${inv.notes ? inv.notes + "\n\n" : ""}STORNIERT am ${today} — ersetzt durch Neuausstellung.`,
        })
        .where(eq(invoices.id, inv.id));
      cancelledNumbers.push(inv.invoiceNumber);
    }

    const created = await createInvoiceForBooking(bookingId, tx);
    return { id: created.id, invoiceNumber: created.invoiceNumber, cancelledNumbers };
  });
};
