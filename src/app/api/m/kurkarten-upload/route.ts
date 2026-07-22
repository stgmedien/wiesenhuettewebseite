import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put, del } from "@vercel/blob";
import { db } from "@/lib/db";
import { bookings, customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildKurkartenFilename } from "@/lib/kurkarten";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "manager" || role === "admin";
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await requireManager())) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const form = await req.formData();
  const bookingId = form.get("bookingId");
  const file = form.get("file");
  if (typeof bookingId !== "string" || !(file instanceof Blob)) {
    return NextResponse.json({ error: "bookingId + file erforderlich" }, { status: 400 });
  }
  if ((file as File).type !== "application/pdf") {
    return NextResponse.json({ error: "Nur PDF-Dateien erlaubt." }, { status: 400 });
  }

  const [booking] = await db
    .select({ arrival: bookings.arrival, customerId: bookings.customerId })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!booking) {
    return NextResponse.json({ error: "Buchung nicht gefunden" }, { status: 404 });
  }
  const [customer] = booking.customerId
    ? await db.select({ lastName: customers.lastName }).from(customers).where(eq(customers.id, booking.customerId)).limit(1)
    : [];

  const displayName = buildKurkartenFilename(customer?.lastName ?? "Gast", booking.arrival);
  const filename = `kurkarten/${bookingId}/${displayName}`;

  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/pdf",
  });

  await db
    .update(bookings)
    .set({ kurkartenPdfUrl: blob.url })
    .where(eq(bookings.id, bookingId));

  return NextResponse.json({ url: blob.url });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireManager())) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const { bookingId } = (await req.json().catch(() => ({}))) as { bookingId?: string };
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId erforderlich" }, { status: 400 });
  }

  const [booking] = await db
    .select({ url: bookings.kurkartenPdfUrl })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (booking?.url) {
    try {
      await del(booking.url);
    } catch (err) {
      console.error("[kurkarten-upload] Blob-Löschung fehlgeschlagen:", err);
    }
  }

  await db
    .update(bookings)
    .set({ kurkartenPdfUrl: null })
    .where(eq(bookings.id, bookingId));

  return NextResponse.json({ ok: true });
}
