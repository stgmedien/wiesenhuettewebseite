import { NextRequest, NextResponse } from "next/server";
import { warmUpDb } from "@/lib/db/warmup";
import { sendMail } from "@/lib/mail/send";
import { computeTourismStats } from "@/lib/tourism-stats";
import TourismStatsDigestEmail from "@/lib/mail/templates/tourism-stats-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron — laeuft am 2. jeden Monats. Rechnet Ankuenfte/Uebernachtungen
 * des VORMONATS aus (siehe lib/tourism-stats.ts) und schickt sie per Mail,
 * damit die IT.NRW-Monatserhebung (BeherbStatG, Meldepflicht jeden Monat)
 * nicht manuell per SQL nachgeschaut werden muss. Meldet nichts automatisch
 * bei IDEV — das bleibt ein manueller Schritt.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await warmUpDb();

  const now = new Date();
  const prevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const monthIso = `${prevMonth.getUTCFullYear()}-${String(prevMonth.getUTCMonth() + 1).padStart(2, "0")}`;

  const stats = await computeTourismStats(monthIso);

  const internalTo = process.env.MAIL_INTERNAL_TO;
  if (internalTo) {
    try {
      await sendMail({
        to: internalTo,
        subject: `IT.NRW-Tourismusstatistik ${stats.monthLabel}: ${stats.arrivals} Ankünfte, ${stats.overnightStays} Übernachtungen`,
        template: "tourism-stats-digest",
        react: TourismStatsDigestEmail({ stats }),
      });
    } catch (err) {
      console.error("[cron/tourism-stats-check] Digest-Mail fehlgeschlagen:", err);
    }
  }

  return NextResponse.json({
    month: stats.month,
    arrivals: stats.arrivals,
    overnightStays: stats.overnightStays,
  });
}
