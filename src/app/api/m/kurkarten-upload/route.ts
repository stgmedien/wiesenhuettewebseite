import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put, del } from "@vercel/blob";
import { db } from "@/lib/db";
import { bookings, customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildKurkartenFilename } from "@/lib/kurkarten";
import { extractNamesFromKurkartenPdf } from "@/lib/kurkarten-names";
import { generateFeuerwehrListePdf } from "@/lib/generate-feuerwehr-liste";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") return null;
  return session;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await requireManager();
  if (!session) {
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

  // Namen per KI aus der Kurkarten-PDF extrahieren und die Feuerwehr-Meldeliste
  // direkt automatisch daraus erzeugen — Dana kann sie danach im Manager-Tool
  // noch korrigieren, muss dafuer aber nicht mehr selbst einen Erzeugen-Schritt
  // anstossen.
  const suggestedNames = await extractNamesFromKurkartenPdf(Buffer.from(await file.arrayBuffer()));

  let feuerwehrListeUrl: string | null = null;
  if (suggestedNames.length > 0) {
    try {
      feuerwehrListeUrl = await generateFeuerwehrListePdf(
        bookingId,
        suggestedNames,
        session.user?.name ?? session.user?.email ?? "Manager"
      );
    } catch (err) {
      console.error("[kurkarten-upload] automatische Feuerwehr-Liste fehlgeschlagen:", err);
    }
  }

  // generateFeuerwehrListePdf setzt bei Erfolg bereits feuerwehrNames +
  // feuerwehrListePdfUrl an der Buchung — hier nur noch die Kurkarten-PDF-URL
  // nachtragen (bzw. bei leerer Liste/Fehlschlag auch die Namen selbst).
  await db
    .update(bookings)
    .set(
      feuerwehrListeUrl
        ? { kurkartenPdfUrl: blob.url }
        : { kurkartenPdfUrl: blob.url, feuerwehrNames: suggestedNames }
    )
    .where(eq(bookings.id, bookingId));

  return NextResponse.json({ url: blob.url, suggestedNames, feuerwehrListeUrl });
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
