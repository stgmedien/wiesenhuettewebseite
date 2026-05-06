import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invoices, customers, bookings, payments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Session ungültig" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  const { id } = await ctx.params;

  // Invoice laden
  const invRows = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  const invoice = invRows[0];
  if (!invoice) return NextResponse.json({ error: "Rechnung nicht gefunden" }, { status: 404 });

  // Ownership-Check: Customer-Account oder Manager/Admin
  const isManager = role === "manager" || role === "admin";
  if (!isManager) {
    if (!invoice.customerId) {
      return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
    }
    const linked = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.userId, userId), eq(customers.id, invoice.customerId)))
      .limit(1);
    if (!linked[0]) {
      return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
    }
  }

  // Booking + payments laden fuer den Zahlungs-Block
  const bookingRows = invoice.bookingId
    ? await db.select().from(bookings).where(eq(bookings.id, invoice.bookingId)).limit(1)
    : [];
  const booking = bookingRows[0];
  if (!booking) return NextResponse.json({ error: "Buchung nicht gefunden" }, { status: 404 });

  const pmts = await db
    .select()
    .from(payments)
    .where(eq(payments.bookingId, booking.id));

  const cs = invoice.customerSnapshot as {
    name: string;
    company?: string;
    street?: string;
    zip?: string;
    city?: string;
    country?: string;
    email?: string;
  };

  const buffer = await renderToBuffer(
    InvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate ?? invoice.createdAt,
      bookingNumber: booking.bookingNumber,
      customer: cs,
      arrival: booking.arrival,
      departure: booking.departure,
      nights: booking.nights,
      persons: booking.persons,
      lineItems: invoice.lineItems as {
        label: string;
        qty: number;
        unitCents: number;
        totalCents: number;
      }[],
      subtotalCents: invoice.subtotalCents,
      depositCents: booking.depositCents,
      payments: pmts
        .filter((p) => p.status === "erhalten" || p.status === "erstattet")
        .map((p) => ({
          kind: p.kind,
          method: p.method ?? null,
          receivedAt: p.receivedAt,
          amountCents: p.amountCents,
        })),
      notes: invoice.notes ?? undefined,
    })
  );

  const filename = `Rechnung_${invoice.invoiceNumber}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
