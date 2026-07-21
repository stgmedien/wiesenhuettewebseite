import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invoices, customers, bookings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePdf } from "@/lib/invoice-pdf";
import { CANCELLATION_POLICY_CUTOFF } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Params) {
  const { id } = await ctx.params;

  // Browser-Navigation (Klick auf den PDF-Link) vs. programmatischer Aufruf:
  // Browser bekommen bei Auth-Problemen eine Weiterleitung statt rohem JSON —
  // ohne Session (Mail-Link, anderes Gerät, abgelaufene Session) landete der
  // Gast sonst in einer JSON-Sackgasse, die wie „Download kaputt" aussieht.
  const wantsHtml = (req.headers.get("accept") ?? "").includes("text/html");

  const session = await auth();
  if (!session?.user) {
    if (wantsHtml) {
      const login = new URL("/login", req.url);
      login.searchParams.set("callbackUrl", `/api/invoices/${id}/pdf`);
      return NextResponse.redirect(login);
    }
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    if (wantsHtml) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.json({ error: "Session ungültig" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;

  const denied = (status: 403 | 404, msg: string) => {
    // Eingeloggte Browser-Nutzer zurück ins Konto statt in die JSON-Sackgasse.
    if (wantsHtml) return NextResponse.redirect(new URL("/konto", req.url));
    return NextResponse.json({ error: msg }, { status });
  };

  // Invoice laden
  const invRows = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  const invoice = invRows[0];
  if (!invoice) return denied(404, "Rechnung nicht gefunden");

  // Ownership-Check: Customer-Account oder Manager/Admin
  const isManager = role === "manager" || role === "admin";
  if (!isManager) {
    if (!invoice.customerId) {
      return denied(403, "Kein Zugriff");
    }
    const linked = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.userId, userId), eq(customers.id, invoice.customerId)))
      .limit(1);
    if (!linked[0]) {
      return denied(403, "Kein Zugriff");
    }
  }

  // Booking laden
  const bookingRows = invoice.bookingId
    ? await db.select().from(bookings).where(eq(bookings.id, invoice.bookingId)).limit(1)
    : [];
  const booking = bookingRows[0];
  if (!booking) return denied(404, "Buchung nicht gefunden");

  const cs = invoice.customerSnapshot as {
    name: string;
    company?: string;
    street?: string;
    zip?: string;
    city?: string;
    country?: string;
    email?: string;
  };

  // Render mit klarem Log-Marker — falls es je in Prod scheitert, steht die
  // Rechnungsnummer + der Stack in den Vercel-Function-Logs (Issue #91).
  let buffer: Buffer;
  try {
    buffer = await renderToBuffer(
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
      kurtaxeCents: booking.kurtaxeCents,
      kurtaxePersons: booking.adults + booking.members + booking.teachers,
      isLegacy: booking.createdAt < CANCELLATION_POLICY_CUTOFF,
      notes: invoice.notes ?? undefined,
      })
    );
  } catch (err) {
    console.error(`[invoice-pdf] Render fehlgeschlagen für ${invoice.invoiceNumber}:`, err);
    return NextResponse.json(
      { error: "PDF konnte nicht erzeugt werden — der Vorstand wurde informiert, bitte später erneut versuchen." },
      { status: 500 }
    );
  }

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
