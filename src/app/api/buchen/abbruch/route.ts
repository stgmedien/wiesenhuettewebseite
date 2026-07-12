import { NextRequest, NextResponse } from "next/server";
import { releaseAbortedBooking } from "@/lib/booking-release";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe-cancel_url-Ziel: Gast hat den Checkout abgebrochen. Gibt die
 * Buchung sofort frei und leitet auf die Abbruch-Seite weiter.
 *
 * Als Route-Handler (nicht in der Page), weil revalidateTag während des
 * Seiten-Renderings verboten ist — hier ist es erlaubt.
 *
 * `t` ist ein Anti-Enumeration-Token (Anfang der Buchungs-UUID, nur dem
 * Gast über die cancel_url bekannt): Buchungsnummern sind erratbar
 * (WH-JJJJ-1000…9999), und ohne Token könnte jeder fremde, noch unbezahlte
 * Buchungen durch Ausprobieren stornieren.
 */
export async function GET(req: NextRequest) {
  const bn = req.nextUrl.searchParams.get("bn") ?? "";
  const token = req.nextUrl.searchParams.get("t") ?? "";
  const target = new URL("/buchen/abbruch", req.nextUrl.origin);

  if (/^WH-\d{4}-\d{4}$/.test(bn) && /^[0-9a-f]{8}$/.test(token)) {
    try {
      const released = await releaseAbortedBooking(bn, token);
      if (released) target.searchParams.set("freigegeben", "1");
    } catch (err) {
      // Best-Effort — Webhook (session.expired) und Cron-Safety-Net räumen
      // sonst wie bisher auf.
      console.error("[abbruch-route] Sofort-Freigabe fehlgeschlagen:", err);
    }
  }

  return NextResponse.redirect(target, 303);
}
