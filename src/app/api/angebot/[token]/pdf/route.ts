import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { offers } from "@/lib/db/schema";
import { OfferPdf } from "@/lib/offer-pdf";
import { nightsBetween } from "@/lib/pricing";
import { toLocalIso } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

/**
 * PDF-Download für ein teilbares Angebot. Kein Auth — der Token ist das
 * Secret (48 Hex-Zeichen, nicht erratbar). Bewusst KEINE Rechnungsnummer
 * und KEIN Bezug zur invoice_seq: Angebote sind keine Rechnungen.
 */
export async function GET(_req: NextRequest, ctx: Params) {
  const { token } = await ctx.params;
  if (!/^[a-f0-9]{48}$/.test(token)) {
    return NextResponse.json({ error: "Angebot nicht gefunden" }, { status: 404 });
  }

  const rows = await db.select().from(offers).where(eq(offers.token, token)).limit(1);
  const offer = rows[0];
  if (!offer) {
    return NextResponse.json({ error: "Angebot nicht gefunden" }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.wiesenhuette.de";
  const nights = nightsBetween(offer.arrival, offer.departure);
  const persons = offer.adults + offer.children + offer.pupils + offer.teachers;
  // Personen-Zusammenfassung, z. B. "20 Erwachsene · 4 Lehrkräfte"
  const personsDetail = [
    offer.adults > 0 && `${offer.adults} Erwachsene`,
    offer.children > 0 && `${offer.children} Kinder (4–15 J.)`,
    offer.pupils > 0 && `${offer.pupils} Schüler`,
    offer.teachers > 0 && `${offer.teachers} Lehrkräfte`,
  ]
    .filter(Boolean)
    .join(" · ");

  let buffer: Buffer;
  try {
    buffer = await renderToBuffer(
      OfferPdf({
        createdAt: offer.createdAt,
        arrival: offer.arrival,
        departure: offer.departure,
        nights,
        persons,
        personsDetail,
        purpose: offer.purpose,
        institution: offer.institution,
        contactName: offer.contactName,
        lineItems: offer.lineItems,
        subtotalCents: offer.subtotalCents,
        depositCents: offer.depositCents,
        kurtaxeCents: offer.kurtaxeCents,
        // Kurtaxenpflichtig ab 16 J.: Erwachsene + Lehrkräfte (Angebot rechnet ohne Mitglieder)
        kurtaxePersons: offer.adults + offer.teachers,
        validUntil: offer.validUntil,
        expired: offer.validUntil < toLocalIso(new Date()),
        onlineUrl: `${baseUrl}/angebot/${offer.token}`,
      })
    );
  } catch (err) {
    console.error(`[offer-pdf] Render fehlgeschlagen für Angebot ${offer.id}:`, err);
    return NextResponse.json(
      { error: "PDF konnte nicht erzeugt werden — bitte später erneut versuchen." },
      { status: 500 }
    );
  }

  const filename = `Angebot_Wiesenhuette_${offer.arrival}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
