import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, customers, magicLinkTokens, activityLog, bookings, payments } from "@/lib/db/schema";
import { eq, and, lt, isNotNull } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { BOOKING_BLOCKS_TAG } from "@/lib/availability";
import { cleanupExpiredMagicLinkTokens } from "@/lib/magic-link";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SOFT_DELETE_DAYS = 30;
const ANON_PREFIX = "[Anonymisiert nach DSGVO-Antrag]";
// Safety-Net: verwaiste, unbezahlte Standard-Buchungen (Checkout nie
// abgeschlossen) nach dieser Frist freigeben. Der checkout.session.expired-
// Webhook erledigt das i.d.R. schon nach ~1 h; dies fängt verpasste Events ab.
const STALE_BOOKING_HOURS = 3;

/**
 * Vercel-Cron: laeuft taeglich.
 *  - Magic-Link-Tokens > 24h alt loeschen
 *  - Soft-deleted Users (deletedAt > 30 Tage) anonymisieren
 *  - Linked Customer-Records anonymisieren (PII raus, aber Buchungen bleiben)
 *
 * Aufruf-Schutz: Vercel sendet "x-vercel-cron-signature" beim Cron-Trigger.
 * Wir akzeptieren auch einen einfachen Bearer-Token (CRON_SECRET) fuer manuelle Tests.
 */
export async function GET(req: Request) {
  // Aufruf-Schutz — fail-closed: ohne CRON_SECRET kein externer Aufruf moeglich
  const auth = req.headers.get("authorization") || "";
  const isVercelCron = !!req.headers.get("x-vercel-cron-signature");
  if (!isVercelCron) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const stats = {
    magicLinksDeleted: 0,
    usersAnonymized: 0,
    customersAnonymized: 0,
    staleBookingsReleased: 0,
  };

  // 0) Verwaiste, unbezahlte Standard-Buchungen freigeben (Checkout nie
  //    abgeschlossen). Schul-Aufschub + Vorstands-Review bleiben unberührt.
  const staleCutoff = new Date(Date.now() - STALE_BOOKING_HOURS * 60 * 60 * 1000);
  const staleBookings = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "angefragt"),
        eq(bookings.paymentMode, "standard"),
        eq(bookings.requiresReview, false),
        eq(bookings.paidCents, 0),
        lt(bookings.createdAt, staleCutoff)
      )
    );
  for (const b of staleBookings) {
    await db
      .update(bookings)
      .set({ status: "storniert", updatedAt: new Date() })
      .where(eq(bookings.id, b.id));
    await db
      .update(payments)
      .set({ status: "fehlgeschlagen" })
      .where(and(eq(payments.bookingId, b.id), eq(payments.status, "offen")));
    await db.insert(activityLog).values({
      who: "System (Cron)",
      what: `Verwaiste unbezahlte Buchung ${b.bookingNumber} automatisch storniert (Checkout nicht abgeschlossen, > ${STALE_BOOKING_HOURS} h alt) — Tage wieder frei.`,
      bookingId: b.id,
    });
    stats.staleBookingsReleased++;
  }
  if (stats.staleBookingsReleased > 0) {
    revalidateTag(BOOKING_BLOCKS_TAG, "max");
  }

  // 1) Magic-Link-Tokens aufraeumen
  await cleanupExpiredMagicLinkTokens();
  stats.magicLinksDeleted = -1; // wir kennen den Count nicht (Drizzle delete liefert keine rowCount auf postgres-js zuverlaessig)

  // 2) Soft-deleted Users finden
  const cutoff = new Date(Date.now() - SOFT_DELETE_DAYS * 24 * 60 * 60 * 1000);
  const toAnonymize = await db
    .select()
    .from(users)
    .where(and(isNotNull(users.deletedAt), lt(users.deletedAt, cutoff)));

  for (const u of toAnonymize) {
    // Customer-Record anonymisieren (Buchungen bleiben mit anonymisiertem Namen)
    const linked = await db.select().from(customers).where(eq(customers.userId, u.id));
    for (const c of linked) {
      await db
        .update(customers)
        .set({
          firstName: ANON_PREFIX,
          lastName: "",
          email: `anon+${c.id}@wiesenhuette.invalid`,
          phone: null,
          street: null,
          zip: null,
          city: null,
          notes: null,
          tags: [],
          memberId: null,
          membershipStatus: "none",
          membershipVerifiedAt: null,
          membershipVerifiedBy: null,
          membershipRejectedReason: null,
          userId: null,
          anonymizedAt: new Date(),
        })
        .where(eq(customers.id, c.id));
      stats.customersAnonymized++;
    }

    // User selbst hard-deleten (keine Buchungen direkt am User-Record)
    await db.delete(users).where(eq(users.id, u.id));
    stats.usersAnonymized++;

    await db.insert(activityLog).values({
      who: "System (DSGVO-Cron)",
      what: `Konto endgueltig anonymisiert (User-ID ${u.id}) — 30-Tage-Frist abgelaufen`,
    });
  }

  return NextResponse.json({ ok: true, stats });
}
