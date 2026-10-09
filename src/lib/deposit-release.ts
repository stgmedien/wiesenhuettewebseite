import crypto from "crypto";
import { db } from "@/lib/db";
import { bookings, customers, payments, activityLog } from "@/lib/db/schema";
import { and, eq, gte, inArray, isNull } from "drizzle-orm";
import { sendMail } from "@/lib/mail/send";
import DepositRefundedEmail from "@/lib/mail/templates/deposit-refunded";
import { buildInvoicePdfAttachment } from "@/lib/invoice-attachment";
import { formatEuro } from "@/lib/pricing";
import { formatDateLong } from "@/lib/utils";

/**
 * Kautions-Rückzahlung bei Überweisern in zwei Schritten (10/2026):
 *  1. Manager gibt im Backend frei → Zahlungszeile "rueckerstattung"/"offen"
 *     mit DEPOSIT_RELEASE_METHOD + Auftragsmail an die Vereinsfinanzen.
 *  2. Finanzen überweisen und bestätigen über den Link in der Mail (ohne
 *     Login) → Zeile wird "erstattet", der Gast bekommt die Kautions-Mail.
 *
 * Anlass: Rückzahlungen blieben liegen, weil niemand die Finanzen
 * ausdrücklich beauftragt hat. Bewusst ohne eigene Tabelle — die offene
 * Zahlungszeile IST die Freigabe, der Link ist per HMAC an sie gebunden.
 * Kartenbuchungen betrifft das nicht (Cron release-deposits erstattet über
 * Stripe).
 */

/** Methode der offenen Freigabe-Zeile — daran wird sie wiedererkannt. */
export const DEPOSIT_RELEASE_METHOD = "Banküberweisung (freigegeben)";
/** Methode nach bestätigter Überweisung (wie beim direkten Verbuchen). */
export const DEPOSIT_RETURNED_METHOD = "Banküberweisung (manuell)";

/** Abgereiste Buchungen ohne Freigabe tauchen so lange im Dashboard auf. */
const TODO_LOOKBACK_DAYS = 90;

const releaseSecret = (): string => {
  const secret =
    process.env.DEPOSIT_RELEASE_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Kein Secret für Kautions-Freigabe-Links gesetzt.");
  return secret;
};

export function buildDepositReleaseToken(paymentId: string): string {
  return crypto
    .createHmac("sha256", releaseSecret())
    .update(`deposit-release:${paymentId}`)
    .digest("hex")
    .slice(0, 32);
}

export function verifyDepositReleaseToken(paymentId: string, token: string): boolean {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(buildDepositReleaseToken(paymentId)),
      Buffer.from(token)
    );
  } catch {
    return false;
  }
}

export function buildDepositReleaseUrl(baseUrl: string, paymentId: string): string {
  return `${baseUrl}/kaution-freigabe?id=${paymentId}&t=${buildDepositReleaseToken(paymentId)}`;
}

/** Verwendungszweck für die Rücküberweisung — in Mail und Bestätigungsseite gleich. */
export const depositReturnReference = (bookingNumber: string): string =>
  `Kaution Wiesenhütte ${bookingNumber}`;

export type CompleteReleaseResult =
  | { ok: true; alreadyDone: boolean; amountCents: number }
  | { ok: false; error: string };

/**
 * Schritt 2: Überweisung ist raus. Idempotent — ein zweiter Klick auf den
 * Link verbucht nichts doppelt und verschickt keine zweite Gast-Mail.
 */
export async function completeDepositRelease(
  paymentId: string,
  who: string
): Promise<CompleteReleaseResult> {
  const p = (await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1))[0];
  if (!p || p.kind !== "rueckerstattung") {
    return { ok: false, error: "Diese Freigabe gibt es nicht (mehr) — sie wurde zurückgezogen." };
  }
  if (p.status === "erstattet") return { ok: true, alreadyDone: true, amountCents: p.amountCents };
  if (p.status !== "offen" || p.method !== DEPOSIT_RELEASE_METHOD) {
    return { ok: false, error: "Diese Zahlung ist keine offene Kautions-Freigabe." };
  }

  // Nur umstellen, solange die Zeile noch offen ist — zwei gleichzeitige
  // Klicks dürfen nicht zwei Gast-Mails auslösen.
  const updated = await db
    .update(payments)
    .set({ status: "erstattet", method: DEPOSIT_RETURNED_METHOD, receivedAt: new Date() })
    .where(and(eq(payments.id, p.id), eq(payments.status, "offen")))
    .returning({ id: payments.id });
  if (updated.length === 0) return { ok: true, alreadyDone: true, amountCents: p.amountCents };

  const b = (await db.select().from(bookings).where(eq(bookings.id, p.bookingId)).limit(1))[0];
  await db.insert(activityLog).values({
    who,
    what: `Kaution zurücküberwiesen (Freigabe bestätigt): ${formatEuro(p.amountCents)}`,
    bookingId: p.bookingId,
  });

  if (b?.customerId) {
    const c = (await db.select().from(customers).where(eq(customers.id, b.customerId)).limit(1))[0];
    if (c) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.vercel.app";
      try {
        const attachment = await buildInvoicePdfAttachment(b.id);
        await sendMail({
          to: c.email,
          subject: `Kaution zurücküberwiesen — Buchung ${b.bookingNumber}`,
          template: "deposit-refunded",
          bookingId: b.id,
          attachments: attachment ? [attachment] : undefined,
          react: DepositRefundedEmail({
            guestName: `${c.firstName} ${c.lastName}`.trim(),
            bookingNumber: b.bookingNumber,
            arrival: formatDateLong(b.arrival),
            departure: formatDateLong(b.departure),
            refundCents: p.amountCents,
            baseUrl,
            viaBankTransfer: true,
          }),
        });
      } catch (err) {
        console.error("[completeDepositRelease] Gast-Mail fehlgeschlagen:", err);
      }
    }
  }

  return { ok: true, alreadyDone: false, amountCents: p.amountCents };
}

export type DepositTodoRow = {
  bookingId: string;
  bookingNumber: string;
  guestName: string;
  departure: string;
  amountCents: number;
};

/**
 * Für das Dashboard: Überweiser-Buchungen, bei denen die Kaution noch
 * zurück muss — getrennt nach "noch nicht freigegeben" und "freigegeben,
 * Überweisung noch nicht bestätigt".
 */
export async function findDepositReturnTodo(): Promise<{
  toRelease: DepositTodoRow[];
  awaitingTransfer: DepositTodoRow[];
}> {
  const since = new Date();
  since.setDate(since.getDate() - TODO_LOOKBACK_DAYS);
  const sinceIso = since.toISOString().slice(0, 10);

  const openReleases = await db
    .select({ bookingId: payments.bookingId, amountCents: payments.amountCents })
    .from(payments)
    .where(
      and(
        eq(payments.kind, "rueckerstattung"),
        eq(payments.status, "offen"),
        eq(payments.method, DEPOSIT_RELEASE_METHOD)
      )
    );
  const releaseByBooking = new Map(openReleases.map((r) => [r.bookingId, r.amountCents]));

  const departed = await db
    .select({
      id: bookings.id,
      bookingNumber: bookings.bookingNumber,
      departure: bookings.departure,
      customerId: bookings.customerId,
      depositCents: bookings.depositCents,
      paidCents: bookings.paidCents,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "abgereist"),
        isNull(bookings.stripePaymentIntentId),
        gte(bookings.departure, sinceIso)
      )
    );

  const releasedIds = [...releaseByBooking.keys()];
  const extra =
    releasedIds.length > 0
      ? await db
          .select({
            id: bookings.id,
            bookingNumber: bookings.bookingNumber,
            departure: bookings.departure,
            customerId: bookings.customerId,
            depositCents: bookings.depositCents,
            paidCents: bookings.paidCents,
          })
          .from(bookings)
          .where(inArray(bookings.id, releasedIds))
      : [];
  const all = new Map([...departed, ...extra].map((b) => [b.id, b]));
  if (all.size === 0) return { toRelease: [], awaitingTransfer: [] };

  const ids = [...all.keys()];
  const refundRows = await db
    .select({ bookingId: payments.bookingId })
    .from(payments)
    .where(and(inArray(payments.bookingId, ids), eq(payments.kind, "rueckerstattung")));
  const hasRefundRow = new Set(refundRows.map((r) => r.bookingId));

  const customerIds = [...new Set([...all.values()].map((b) => b.customerId).filter((v): v is string => Boolean(v)))];
  const customerRows =
    customerIds.length > 0
      ? await db
          .select({ id: customers.id, firstName: customers.firstName, lastName: customers.lastName })
          .from(customers)
          .where(inArray(customers.id, customerIds))
      : [];
  const nameById = new Map(customerRows.map((c) => [c.id, `${c.firstName} ${c.lastName}`.trim()]));

  const toRelease: DepositTodoRow[] = [];
  const awaitingTransfer: DepositTodoRow[] = [];
  for (const b of all.values()) {
    const base = {
      bookingId: b.id,
      bookingNumber: b.bookingNumber,
      guestName: (b.customerId && nameById.get(b.customerId)) || "—",
      departure: b.departure,
    };
    const released = releaseByBooking.get(b.id);
    if (released !== undefined) {
      awaitingTransfer.push({ ...base, amountCents: released });
    } else if (!hasRefundRow.has(b.id) && b.depositCents > 0 && b.paidCents > 0) {
      toRelease.push({ ...base, amountCents: b.depositCents });
    }
  }
  const byDeparture = (x: DepositTodoRow, y: DepositTodoRow) => x.departure.localeCompare(y.departure);
  return { toRelease: toRelease.sort(byDeparture), awaitingTransfer: awaitingTransfer.sort(byDeparture) };
}
