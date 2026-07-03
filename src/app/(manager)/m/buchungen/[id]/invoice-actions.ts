"use server";

import { auth } from "@/lib/auth";
import {
  createInvoiceForBooking,
  reissueInvoiceForBooking,
  getActiveInvoiceForBooking,
} from "@/lib/invoice";
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
  return getActiveInvoiceForBooking(bookingId);
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
