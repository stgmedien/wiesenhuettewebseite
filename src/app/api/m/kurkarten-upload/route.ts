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
import ArrivalReminderEmail from "@/lib/mail/templates/arrival-reminder";
import HuettenwartArrivalReminderEmail from "@/lib/mail/templates/huettenwart-arrival-reminder";
import { HUETTENWART_EMAIL, HUETTENWART_CC } from "@/lib/huettenwart";
import { formatDateLong } from "@/lib/utils";
import { wasMailSent } from "@/lib/mail-log";

// Tage bis zur Anreise (lokale Kalendertage, unabhaengig von Uhrzeit).
function daysUntil(arrivalIso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const arrival = new Date(`${arrivalIso}T00:00:00`);
  return Math.round((arrival.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

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
        .select({
          firstName: customers.firstName,
          lastName: customers.lastName,
          email: customers.email,
          phone: customers.phone,
        })
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

  // Kurkarten werden NICHT sofort verschickt — sie warten planmaessig auf
  // die T-3-Erinnerung (arrival_reminder/huettenwart_arrival_reminder), die
  // sie ohnehin schon mitschickt, wenn vorhanden. Nur wenn der Upload SO
  // kurz vor der Anreise passiert, dass der T-3-Lauf schon vorbei ist (oder
  // fuer diese Buchung nie mehr kommt), wird hier sofort nachgeholt — sonst
  // wuerde der Gast seine Kurkarten nie automatisch bekommen. Toni hat sie
  // im Zweifel ohnehin schon (er bekommt dieselbe Mail parallel).
  const daysLeft = daysUntil(booking.arrival);
  if (daysLeft <= 3) {
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

    if (customer?.email && !(await wasMailSent(bookingId, "arrival_reminder"))) {
      try {
        await sendMail({
          to: customer.email,
          subject: `In ${Math.max(daysLeft, 0)} Tagen geht's los — Buchung ${booking.bookingNumber}`,
          template: "arrival_reminder",
          bookingId,
          attachments: sharedAttachments,
          react: ArrivalReminderEmail({
            firstName: customer.firstName,
            bookingNumber: booking.bookingNumber,
            arrival: formatDateLong(booking.arrival),
            daysUntilArrival: daysLeft,
            hasAttachments: true,
          }),
        });
      } catch (err) {
        console.error("[kurkarten-upload] arrival_reminder mail failed:", err);
      }
    }

    if (!(await wasMailSent(bookingId, "huettenwart_arrival_reminder"))) {
      try {
        await sendMail({
          to: HUETTENWART_EMAIL,
          bcc: HUETTENWART_CC,
          subject: `In ${Math.max(daysLeft, 0)} Tagen: ${customer ? `${customer.firstName} ${customer.lastName}`.trim() : booking.bookingNumber} — ${booking.bookingNumber}`,
          template: "huettenwart_arrival_reminder",
          bookingId,
          attachments: sharedAttachments,
          react: HuettenwartArrivalReminderEmail({
            bookingNumber: booking.bookingNumber,
            guestName: customer ? `${customer.firstName} ${customer.lastName}`.trim() : booking.bookingNumber,
            guestPhone: customer?.phone,
            arrival: formatDateLong(booking.arrival),
            daysUntilArrival: daysLeft,
            hasAttachments: true,
          }),
        });
      } catch (err) {
        console.error("[kurkarten-upload] huettenwart_arrival_reminder mail failed:", err);
      }
    }
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
