import { NextRequest, NextResponse } from "next/server";
import { warmUpDb } from "@/lib/db/warmup";
import { sendMail } from "@/lib/mail/send";
import { findPriceMismatches } from "@/lib/price-consistency";
import PriceConsistencyDigestEmail from "@/lib/mail/templates/price-consistency-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron — läuft täglich. Nutzt findPriceMismatches() (siehe
 * lib/price-consistency.ts für die Begründung der Prüf-Logik) und meldet
 * Treffer per Mail an Dana/Johannes — korrigiert NICHTS automatisch.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await warmUpDb();

  const rows = await findPriceMismatches();

  if (rows.length > 0) {
    const internalTo = process.env.MAIL_INTERNAL_TO;
    if (internalTo) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.vercel.app";
      try {
        await sendMail({
          to: internalTo,
          bcc: "johannesleiskau@gmail.com",
          subject: `${rows.length} ${rows.length === 1 ? "Buchung" : "Buchungen"} mit inkonsistenten Preisfeldern`,
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
