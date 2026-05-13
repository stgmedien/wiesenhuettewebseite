import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildPackliste, type PackInput } from "@/lib/packliste-rules";
import { PacklistePdf } from "@/lib/packliste-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({
  season: z.enum(["winter", "uebergang", "sommer"]),
  persons: z.coerce.number().int().min(1).max(40),
  nights: z.coerce.number().int().min(1).max(21),
  activities: z.array(z.enum(["wandern", "ski", "lagerfeuer", "klassenfahrt"])).default([]),
});

/**
 * GET /api/packliste?season=winter&persons=8&nights=3&activities=wandern,lagerfeuer
 *   → application/pdf Download mit personalisierter Packliste.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const raw = {
    season: url.searchParams.get("season") || "uebergang",
    persons: url.searchParams.get("persons") || "8",
    nights: url.searchParams.get("nights") || "3",
    activities:
      url.searchParams
        .get("activities")
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) ?? [],
  };
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabe", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const input: PackInput = parsed.data;
  const cats = buildPackliste(input);
  const buf = await renderToBuffer(PacklistePdf({ input, categories: cats }));

  return new NextResponse(buf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="packliste-wiesenhuette-${input.season}-${input.persons}p-${input.nights}n.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
