import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put, del } from "@vercel/blob";
import { db } from "@/lib/db";
import { bookings, customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildKurkartenFilename } from "@/lib/kurkarten";
import { extractNamesFromKurkartenPdf } from "@/lib/kurkarten-names";
import { generateFeuerwehrListePdf } from "@/lib/generate-feuerwehr-liste";
import { sendMail } from "@/lib/mail/send";
import KurkartenReadyEmail from "@/lib/mail/templates/kurkarten-ready";
import HuettenwartKurkartenReadyEmail from "@/lib/mail/templates/huettenwart-kurkarten-ready";
import { HUETTENWART_EMAIL, HUETTENWART_CC } from "@/lib/huettenwart";
import { formatDateLong } from "@/lib/utils";

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
    .select({
      arrival: bookings.arrival,
      departure: bookings.departure,
      customerId: bookings.customerId,
      bookingNumber: bookings.bookingNumber,
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!booking) {
    return NextResponse.json({ error: "Buchung nicht gefunden" }, { status: 404 });
  }
  const [customer] = booking.customerId
    ? await db
        .select({ firstName: customers.firstName, lastName: customers.lastName, email: customers.email })
        .from(customers)
        .where(eq(customers.id, booking.customerId))
        .limit(1)
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

  // Kurkarten-Zustellung ist event-getrieben statt an einen festen Tag
  // gebunden (Dana laedt hoch, wann immer die PDF vom AVS-Portal fertig
  // ist) — Gast UND Toni bekommen beide Dokumente (Kurkarten + Feuerwehr-
  // Meldeliste) automatisch in genau diesem Moment, ohne weiteren
  // manuellen Schritt.
  const sharedAttachments: { filename: string; content: Buffer; contentType: string }[] = [
    {
      filename: displayName,
      content: Buffer.from(await file.arrayBuffer()),
      contentType: "application/pdf",
    },
  ];
  if (feuerwehrListeUrl) {
    try {
      const listeRes = await fetch(feuerwehrListeUrl);
      if (listeRes.ok) {
        sharedAttachments.push({
          filename: `Feuerwehr-Meldeliste-${booking.bookingNumber}.pdf`,
          content: Buffer.from(await listeRes.arrayBuffer()),
          contentType: "application/pdf",
        });
      }
    } catch (err) {
      console.error("[kurkarten-upload] Feuerwehr-Meldeliste-Abruf fehlgeschlagen:", err);
    }
  }

  if (customer?.email) {
    try {
      await sendMail({
        to: customer.email,
        subject: `Eure Kurkarten sind da — Buchung ${booking.bookingNumber}`,
        template: "kurkarten-ready",
        bookingId,
        attachments: sharedAttachments,
        react: KurkartenReadyEmail({
          firstName: customer.firstName,
          bookingNumber: booking.bookingNumber,
          arrival: formatDateLong(booking.arrival),
        }),
      });
    } catch (err) {
      console.error("[kurkarten-upload] kurkarten-ready mail failed:", err);
    }
  }

  try {
    await sendMail({
      to: HUETTENWART_EMAIL,
      bcc: HUETTENWART_CC,
      subject: `Kurkarten sind da — Buchung ${booking.bookingNumber}`,
      template: "huettenwart-kurkarten-ready",
      bookingId,
      attachments: sharedAttachments,
      react: HuettenwartKurkartenReadyEmail({
        bookingNumber: booking.bookingNumber,
        guestName: customer ? `${customer.firstName} ${customer.lastName}`.trim() : booking.bookingNumber,
        arrival: formatDateLong(booking.arrival),
        departure: formatDateLong(booking.departure),
      }),
    });
  } catch (err) {
    console.error("[kurkarten-upload] huettenwart-kurkarten-ready mail failed:", err);
  }

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
