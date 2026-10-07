import { NextRequest, NextResponse } from "next/server";
import { warmUpDb } from "@/lib/db/warmup";
import { sendMail } from "@/lib/mail/send";
import { findBookingIssues } from "@/lib/payment-consistency";
import PriceConsistencyDigestEmail from "@/lib/mail/templates/price-consistency-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron — läuft täglich. Nutzt findBookingIssues(): Preisfelder
 * (lib/price-consistency.ts) UND Zahlungen (lib/payment-consistency.ts).
 * Meldet Treffer per Mail an Dana/Johannes — korrigiert NICHTS automatisch.
 *
 * Mail-Takt: täglich, solange mindestens ein Befund dringend ist (Anreise in
 * höchstens 21 Tagen); sonst nur montags — ein offener Posten in zehn Monaten
 * soll nicht jeden Morgen eine Mail auslösen. Im Dashboard stehen immer alle
 * Befunde.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await warmUpDb();

  const rows = await findBookingIssues();
  const isMonday =
    new Date().toLocaleDateString("en-US", { weekday: "short", timeZone: "Europe/Berlin" }) === "Mon";
  const sendDigest = rows.length > 0 && (isMonday || rows.some((r) => r.urgent));

  if (sendDigest) {
    const internalTo = process.env.MAIL_INTERNAL_TO;
    if (internalTo) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.vercel.app";
      try {
        await sendMail({
          to: internalTo,
          bcc: "johannesleiskau@gmail.com",
          subject: `${rows.length} ${rows.length === 1 ? "Buchung" : "Buchungen"} mit Auffälligkeiten bei Preis oder Zahlung`,
          template: "price-consistency-digest",
          react: PriceConsistencyDigestEmail({ rows, baseUrl }),
        });
      } catch (err) {
        console.error("[cron/price-consistency-check] Digest-Mail fehlgeschlagen:", err);
      }
    }
  }

  return NextResponse.json({ mismatches: rows.length });
}
