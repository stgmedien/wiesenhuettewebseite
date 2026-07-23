import { db } from "@/lib/db";
import { bookings, customers, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { formatDateLong } from "@/lib/utils";

/**
 * Erzeugt die Feuerwehr-Meldeliste als PDF und speichert sie + die Namen an
 * der Buchung. Wird sowohl direkt nach dem Kurkarten-Upload (automatisch, mit
 * den KI-vorgeschlagenen Namen) als auch beim manuellen Nachkorrigieren durch
 * Dana im Manager-Tool aufgerufen — daher als gemeinsame Funktion ausgelagert.
 */
export async function generateFeuerwehrListePdf(
  bookingId: string,
  names: string[],
  actor: string
): Promise<string> {
  const cleanNames = names.map((n) => n.trim()).filter(Boolean);
  if (cleanNames.length === 0) {
    throw new Error("Mindestens ein Name erforderlich.");
  }

  const b = (await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1))[0];
  if (!b) throw new Error("Buchung nicht gefunden.");

  const customerRows = b.customerId
    ? await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1)
    : [];
  const customer = customerRows[0];
  const groupName = customer
    ? `${customer.firstName} ${customer.lastName}`.trim() || b.bookingNumber
    : b.bookingNumber;

  const { renderToBuffer } = await import("@react-pdf/renderer");
  const { FeuerwehrListePdf } = await import("@/lib/feuerwehr-liste-pdf");
  const { put, del } = await import("@vercel/blob");

  const pdfBuffer = await renderToBuffer(
    FeuerwehrListePdf({
      bookingNumber: b.bookingNumber,
      groupName,
      arrival: formatDateLong(b.arrival),
      departure: formatDateLong(b.departure),
      names: cleanNames,
    })
  );

  if (b.feuerwehrListePdfUrl) {
    try {
      await del(b.feuerwehrListePdfUrl);
    } catch (err) {
      console.error("[generateFeuerwehrListePdf] alte PDF-Löschung fehlgeschlagen:", err);
    }
  }

  const blob = await put(`feuerwehrliste/${bookingId}/liste.pdf`, pdfBuffer, {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/pdf",
  });

  await db
    .update(bookings)
    .set({ feuerwehrNames: cleanNames, feuerwehrListePdfUrl: blob.url })
    .where(eq(bookings.id, bookingId));

  await db.insert(activityLog).values({
    who: actor,
    what: `Feuerwehr-Meldeliste erzeugt (${cleanNames.length} Namen).`,
    bookingId,
  });

  return blob.url;
}
