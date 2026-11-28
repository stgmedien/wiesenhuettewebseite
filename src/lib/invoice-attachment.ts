import { db } from "@/lib/db";
import { activityLog, bookings, invoices } from "@/lib/db/schema";
import { and, eq, ne, desc } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePdf } from "@/lib/invoice-pdf";
import { CANCELLATION_POLICY_CUTOFF, hasMinTenPercentStorno } from "@/lib/pricing";
import type { MailAttachment } from "@/lib/mail/send";
import { refreshInvoiceIfOutdated } from "@/lib/invoice";

/**
 * Rendert die aktive Rechnung einer Buchung als PDF-Mail-Anhang — oder
 * `null`, wenn keine aktive Rechnung existiert oder das Rendering fehlschlägt
 * (best-effort, ruft den Aufrufer nie zum Absturz).
 */
export async function buildInvoicePdfAttachment(
  bookingId: string
): Promise<MailAttachment | null> {
  try {
    const bRows = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    const b = bRows[0];
    if (!b) return null;

    const invRows = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.bookingId, bookingId), ne(invoices.status, "storniert")))
      .orderBy(desc(invoices.createdAt))
      .limit(1);
    const activeInvoice = invRows[0];
    if (!activeInvoice) return null;

    const pdfBuffer = await renderToBuffer(
      InvoicePdf({
        invoiceNumber: activeInvoice.invoiceNumber,
        issueDate: activeInvoice.issueDate ?? activeInvoice.createdAt,
        bookingNumber: b.bookingNumber,
        customer: activeInvoice.customerSnapshot as {
          name: string;
          company?: string;
          street?: string;
          zip?: string;
          city?: string;
          country?: string;
          email?: string;
        },
        arrival: b.arrival,
        departure: b.departure,
        nights: b.nights,
        persons: b.persons,
        lineItems: activeInvoice.lineItems as {
          label: string;
          qty: number;
          unitCents: number;
          totalCents: number;
        }[],
        subtotalCents: activeInvoice.subtotalCents,
        depositCents: b.depositCents,
        kurtaxeCents: b.kurtaxeCents,
        kurtaxePersons: b.adults + b.members + b.teachers,
        isLegacy: b.createdAt < CANCELLATION_POLICY_CUTOFF,
        stornoMinTen: hasMinTenPercentStorno(b),
        notes: activeInvoice.notes ?? undefined,
      })
    );

    return {
      filename: `Rechnung_${activeInvoice.invoiceNumber}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    };
  } catch (err) {
    console.error(`[invoice-attachment] PDF-Rendering fehlgeschlagen für Buchung ${bookingId}:`, err);
    return null;
  }
}

/**
 * Abschlussrechnung für die Mail „Kaution zurücküberwiesen“: bringt die
 * Rechnung vorher auf den aktuellen Buchungsstand (erstellt bzw. stellt neu
 * aus, siehe refreshInvoiceIfOutdated) und hängt sie dann an. Best-effort —
 * scheitert die Aktualisierung, geht die bisherige Rechnung mit.
 */
export async function buildFinalInvoicePdfAttachment(
  bookingId: string
): Promise<MailAttachment | null> {
  try {
    const r = await refreshInvoiceIfOutdated(bookingId);
    if (r.action !== "unchanged") {
      await db.insert(activityLog).values({
        who: "System",
        what:
          r.action === "reissued"
            ? `Rechnung ${r.cancelledNumbers.join(", ")} storniert und als ${r.invoiceNumber} neu ausgestellt — Buchung hatte sich seit der Ausstellung geändert (vor Versand mit der Kautionsrückzahlung).`
            : `Abschlussrechnung ${r.invoiceNumber} erstellt (vor Versand mit der Kautionsrückzahlung).`,
        bookingId,
      });
    }
  } catch (err) {
    console.error(`[invoice] Aktualisierung vor Abschlussmail fehlgeschlagen (${bookingId}):`, err);
  }
  return buildInvoicePdfAttachment(bookingId);
}
