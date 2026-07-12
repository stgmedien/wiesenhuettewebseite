import { and, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { bookings, payments, activityLog } from "@/lib/db/schema";
import { BOOKING_BLOCKS_TAG } from "@/lib/availability";
import { stripe } from "@/lib/stripe";

/**
 * Sofort-Freigabe einer Buchung, deren Stripe-Checkout der Gast abgebrochen
 * hat (cancel_url → /api/buchen/abbruch). Ohne diesen Pfad blieben die Tage
 * bis zum Ablauf der Checkout-Session (24 h, checkout.session.expired-
 * Webhook) als "angefragt" blockiert.
 *
 * Spiegelt die Freigabe-Logik des expired-Webhooks und ist idempotent:
 * Webhook und Cron-Safety-Net finden danach eine bereits stornierte Buchung
 * vor und fassen sie nicht mehr an. Schul-Aufschub (payment_mode
 * "school_deferred") und Vorstands-Review (requiresReview) haben einen
 * eigenen Lebenszyklus und werden — wie im Webhook — NICHT freigegeben.
 *
 * `token` muss dem Anfang der Buchungs-UUID entsprechen (steckt in der
 * cancel_url, die nur der Gast kennt) — Buchungsnummern allein sind
 * erratbar (WH-JJJJ-1000…9999) und dürfen keine Storno-Berechtigung sein.
 *
 * Nur aus Route-Handlern/Server-Actions aufrufen — revalidateTag ist
 * während des Seiten-Renderings verboten.
 */
export async function releaseAbortedBooking(
  bookingNumber: string,
  token: string
): Promise<boolean> {
  const found = await db
    .select()
    .from(bookings)
    .where(eq(bookings.bookingNumber, bookingNumber))
    .limit(1);
  const booking = found[0];
  if (!booking) return false;
  if (!token || !booking.id.startsWith(token)) return false;
  if (
    booking.status !== "angefragt" ||
    booking.paidCents > 0 ||
    booking.paymentMode !== "standard" ||
    booking.requiresReview
  ) {
    return false; // nichts freizugeben
  }

  // Erst die Checkout-Session serverseitig beenden: Der Zahlungslink wäre
  // sonst noch bis zu 24 h gültig — der Gast könnte nach der Freigabe (und
  // ggf. Neuvergabe) der Tage doch noch bezahlen. Wenn die Session sich
  // nicht beenden lässt, weil sie schon bezahlt wurde (Race mit dem
  // completed-Webhook), darf die Buchung NICHT storniert werden.
  if (booking.stripeSessionId) {
    try {
      await stripe.checkout.sessions.expire(booking.stripeSessionId);
    } catch (err) {
      try {
        const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
        if (session.status !== "open" && session.status !== "expired") {
          return false; // Session ist "complete" — Zahlung läuft, nichts stornieren
        }
      } catch {
        // Session-Status unklar → konservativ nichts tun; der expired-Webhook
        // bzw. das Cron-Safety-Net geben die Buchung später frei.
        console.error("[abbruch-release] Stripe-Session-Status unklar:", err);
        return false;
      }
    }
  }

  await db
    .update(bookings)
    .set({ status: "storniert", updatedAt: new Date() })
    .where(eq(bookings.id, booking.id));
  // offene Zahlungs-Zeilen als fehlgeschlagen markieren (Aufräumen)
  await db
    .update(payments)
    .set({ status: "fehlgeschlagen" })
    .where(and(eq(payments.bookingId, booking.id), eq(payments.status, "offen")));
  await db.insert(activityLog).values({
    who: "Portal",
    what: `Checkout abgebrochen — Buchung ${booking.bookingNumber} sofort storniert, Tage wieder frei.`,
    bookingId: booking.id,
  });
  // Öffentlichen Verfügbarkeits-Cache invalidieren → Tage sofort wieder buchbar.
  revalidateTag(BOOKING_BLOCKS_TAG, "max");
  return true;
}
