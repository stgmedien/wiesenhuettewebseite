import { NextResponse } from "next/server";
import { blockedDatesInRange } from "@/lib/availability";
import { buildBelegungIcs, coalesceDaysToRanges } from "@/lib/ical";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// So viele Tage in die Zukunft exportieren (deckt den Buchungshorizont ab).
const HORIZON_DAYS = 730;

const toIso = (d: Date) => d.toISOString().slice(0, 10);

type Params = { params: Promise<{ token: string }> };

/**
 * Öffentlicher, aber token-geschützter iCal-Feed des Belegungskalenders.
 * URL-Form:  /api/ical/<ICAL_FEED_TOKEN>        oder  /api/ical/<TOKEN>.ics
 * Der Token kommt ausschließlich aus der Env-Variable ICAL_FEED_TOKEN
 * (Repo ist öffentlich → kein Secret im Code). Fail-closed: ohne gesetzten
 * Token liefert der Feed 503, bei falschem Token 404.
 */
export async function GET(_req: Request, ctx: Params) {
  const expected = process.env.ICAL_FEED_TOKEN;
  if (!expected) {
    return new NextResponse("iCal-Feed ist nicht konfiguriert.", { status: 503 });
  }
  const { token: raw } = await ctx.params;
  const token = raw.replace(/\.ics$/i, ""); // .ics-Endung tolerieren
  if (token !== expected) {
    return new NextResponse("Not found", { status: 404 });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const from = toIso(today);
  const toDate = new Date(today);
  toDate.setUTCDate(toDate.getUTCDate() + HORIZON_DAYS);
  const to = toIso(toDate);

  const blocked = await blockedDatesInRange(from, to);
  const ranges = coalesceDaysToRanges(blocked);
  const ics = buildBelegungIcs({ ranges, now: new Date() });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="wiesenhuette-belegung.ics"',
      // Portale pollen periodisch — 15 Min Cache schont die Datenbank.
      "Cache-Control": "public, max-age=900, s-maxage=900",
    },
  });
}
