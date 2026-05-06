import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  customers,
  bookings,
  payments,
  invoices,
  inquiries,
  emailLog,
  activityLog,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import JSZip from "jszip";

export const dynamic = "force-dynamic";

/**
 * DSGVO Auskunftsrecht: Kunde kann alle ihn betreffenden Daten als ZIP runterladen.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Session ungültig" }, { status: 401 });
  }

  const userRow = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const u = userRow[0];
  if (!u) return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });

  const customerRow = await db.select().from(customers).where(eq(customers.userId, userId)).limit(1);
  const customer = customerRow[0];

  const myBookings = customer
    ? await db.select().from(bookings).where(eq(bookings.customerId, customer.id))
    : [];
  const bookingIds = myBookings.map((b) => b.id);

  const myPayments = bookingIds.length
    ? await db
        .select()
        .from(payments)
        .where(eq(payments.bookingId, bookingIds[0])) // Drizzle: ueber inArray erweitern
    : [];

  // Drizzle inArray-fallback per Loop (vereinfacht, paar Buchungen sind OK)
  const allPayments: typeof myPayments = [];
  for (const id of bookingIds) {
    const ps = await db.select().from(payments).where(eq(payments.bookingId, id));
    allPayments.push(...ps);
  }

  const myInvoices = customer
    ? await db.select().from(invoices).where(eq(invoices.customerId, customer.id))
    : [];

  const myInquiries = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.email, customer?.email ?? u.email));

  const myEmails = bookingIds.length
    ? await (async () => {
        const rows: (typeof emailLog.$inferSelect)[] = [];
        for (const id of bookingIds) {
          const r = await db.select().from(emailLog).where(eq(emailLog.bookingId, id));
          rows.push(...r);
        }
        return rows;
      })()
    : [];

  const myActivity = await db
    .select()
    .from(activityLog)
    .where(eq(activityLog.who, u.email));

  // Sensitive Felder rauswerfen
  const safeUser = {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    emailVerified: u.emailVerified,
    twoFactorEnabled: u.twoFactorEnabled,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    // passwordHash, twoFactorSecret, twoFactorBackupCodes weggelassen (Sicherheits-Daten)
  };

  const zip = new JSZip();
  zip.file(
    "README.txt",
    [
      "Wiesenhütte — Datenexport gemäß Art. 15 DSGVO (Auskunftsrecht)",
      "",
      `Erstellt am: ${new Date().toLocaleString("de-DE")}`,
      `Konto: ${u.email}`,
      "",
      "Inhalte:",
      "- user.json — Dein Login-Konto (ohne Passwort-Hashes/2FA-Secrets)",
      "- customer.json — Dein Kontakt-Datensatz",
      "- bookings.json — Deine Buchungen",
      "- payments.json — Zahlungen zu Deinen Buchungen",
      "- invoices.json — Rechnungen (sofern vorhanden)",
      "- inquiries.json — Deine Anfragen",
      "- email_log.json — Mail-Versand-Log zu Deinen Buchungen",
      "- activity_log.json — Audit-Log Deiner Aktionen",
      "",
      "Bei Fragen: hello@wiesenhütte.com",
    ].join("\n")
  );
  zip.file("user.json", JSON.stringify(safeUser, null, 2));
  zip.file("customer.json", JSON.stringify(customer ?? null, null, 2));
  zip.file("bookings.json", JSON.stringify(myBookings, null, 2));
  zip.file("payments.json", JSON.stringify(allPayments, null, 2));
  zip.file("invoices.json", JSON.stringify(myInvoices, null, 2));
  zip.file("inquiries.json", JSON.stringify(myInquiries, null, 2));
  zip.file("email_log.json", JSON.stringify(myEmails, null, 2));
  zip.file("activity_log.json", JSON.stringify(myActivity, null, 2));

  const buffer = await zip.generateAsync({ type: "uint8array" });
  const filename = `wiesenhuette-data-${u.email.replace(/[^a-z0-9._-]/gi, "_")}-${new Date()
    .toISOString()
    .slice(0, 10)}.zip`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
