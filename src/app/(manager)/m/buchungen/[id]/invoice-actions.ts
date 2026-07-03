"use server";

import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { eq, and, ne, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { createInvoiceForBooking, reissueInvoiceForBooking } from "@/lib/invoice";
import { revalidatePath } from "next/cache";

const requireManager = async () => {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Unauthorized");
  return session;
};

export type CreateInvoiceResult =
  | { ok: true; invoiceId: string; invoiceNumber: string; isNew: boolean }
  | { ok: false; error: string };

/** Legt eine Rechnung für die Buchung an (idempotent — bestehende wird zurückgegeben). */
export async function createInvoiceForBookingAction(
  bookingId: string
): Promise<CreateInvoiceResult> {
  await requireManager();
  try {
    const { id, invoiceNumber, isNew } = await createInvoiceForBooking(bookingId);
    revalidatePath(`/m/buchungen/${bookingId}`);
    return { ok: true, invoiceId: id, invoiceNumber, isNew };
  } catch (e) {
    console.error("[invoice-actions] create failed", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Rechnung konnte nicht erstellt werden.",
    };
  }
}

export type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string | null;
};

/** Gibt die aktive (nicht stornierte) Rechnung einer Buchung zurück, falls vorhanden. */
export async function getInvoiceForBooking(
  bookingId: string
): Promise<InvoiceRow | null> {
  const rows = await db
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
}

export type ReissueInvoiceResult =
  | { ok: true; invoiceId: string; invoiceNumber: string; cancelledNumbers: string[] }
  | { ok: false; error: string };

/**
 * Storniert die bestehende Rechnung und stellt eine neue mit aktuellem
 * Buchungsstand aus (neue laufende Nummer, GoBD-konform).
 */
export async function reissueInvoiceForBookingAction(
  bookingId: string
): Promise<ReissueInvoiceResult> {
  await requireManager();
  try {
    const { id, invoiceNumber, cancelledNumbers } = await reissueInvoiceForBooking(bookingId);
    revalidatePath(`/m/buchungen/${bookingId}`);
    return { ok: true, invoiceId: id, invoiceNumber, cancelledNumbers };
  } catch (e) {
    console.error("[invoice-actions] reissue failed", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Rechnung konnte nicht neu erstellt werden.",
    };
  }
}
