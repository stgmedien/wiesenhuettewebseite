import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { computeTourismStats, lastCompletedMonths, tourismStatsCsv } from "@/lib/tourism-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** CSV-Download der Monatszahlen fuer die IT.NRW-Meldung (nur Manager/Admin). */
export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const requested = Number(req.nextUrl.searchParams.get("monate") ?? 12);
  const count = Number.isFinite(requested) ? Math.min(Math.max(Math.trunc(requested), 1), 36) : 12;
  // Aelteste zuerst, so wie man es bei IDEV nachtraegt.
  const months = lastCompletedMonths(count).reverse();
  const stats = await Promise.all(months.map((m) => computeTourismStats(m)));

  return new NextResponse(tourismStatsCsv(stats), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tourismusstatistik-${months[0]}-bis-${months[months.length - 1]}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
