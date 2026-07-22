import { db } from "@/lib/db";
import { emailLog, bookings, customers } from "@/lib/db/schema";
import { and, desc, eq, gte, inArray, or } from "drizzle-orm";

const DELIVERY_FAILURE_STATUSES = ["bounced", "blocked", "spam", "invalid"] as const;

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  bounced: "Bounce (Adresse nimmt nicht an)",
  blocked: "Vom Empfänger-Server blockiert",
  spam: "Als Spam eingestuft",
  invalid: "Ungültige E-Mail-Adresse",
};

/**
 * Idempotenz-Helper: prueft, ob fuer (bookingId, template) bereits eine
 * erfolgreich versendete Mail im emailLog steht. Schuetzt vor doppelten
 * Mails bei Stripe-Webhook-Retries, mehreren Stripe-Events oder erneuter
 * manueller Zahlungsbestaetigung fuer dieselbe Buchung.
 */
export async function wasMailSent(bookingId: string, template: string): Promise<boolean> {
  const r = await db
    .select({ id: emailLog.id })
    .from(emailLog)
    .where(
      and(
        eq(emailLog.bookingId, bookingId),
        eq(emailLog.template, template),
        eq(emailLog.status, "sent")
      )
    )
    .limit(1);
  return !!r[0];
}

export type MailFailure = {
  id: string;
  bookingId: string | null;
  bookingNumber: string;
  guestName: string;
  to: string;
  template: string;
  subject: string;
  error: string | null;
  sentAt: Date;
};

/**
 * Fehlgeschlagene ODER nachweislich nicht zugestellte Mails (Bounce/Block/
 * Spam laut Brevo-Webhook) der letzten `sinceDays` Tage, bei denen NICHT
 * danach schon ein erfolgreicher Versand derselben Vorlage an dieselbe
 * Buchung nachgewiesen ist (z. B. durch die Resend-Funktion nach einer
 * Adresskorrektur) — genau die Faelle, die noch echte Aufmerksamkeit
 * brauchen. Ohne Buchungsbezug (bookingId null) wird konservativ immer
 * angezeigt, da es keine Moeglichkeit gibt, einen spaeteren Erfolg
 * zuzuordnen.
 */
export async function getUnresolvedMailFailures(sinceDays = 14): Promise<MailFailure[]> {
  const since = new Date(Date.now() - sinceDays * 86_400_000);
  const failed = await db
    .select()
    .from(emailLog)
    .where(
      and(
        gte(emailLog.sentAt, since),
        or(
          eq(emailLog.status, "failed"),
          inArray(emailLog.deliveryStatus, [...DELIVERY_FAILURE_STATUSES])
        )
      )
    )
    .orderBy(desc(emailLog.sentAt));
  if (failed.length === 0) return [];

  const bookingIds = [...new Set(failed.map((f) => f.bookingId).filter((id): id is string => !!id))];
  const laterSent =
    bookingIds.length > 0
      ? await db
          .select({ bookingId: emailLog.bookingId, template: emailLog.template, sentAt: emailLog.sentAt })
          .from(emailLog)
          .where(and(inArray(emailLog.bookingId, bookingIds), eq(emailLog.status, "sent")))
      : [];

  const unresolved = failed.filter((f) => {
    if (!f.bookingId) return true;
    return !laterSent.some(
      (s) => s.bookingId === f.bookingId && s.template === f.template && s.sentAt > f.sentAt
    );
  });
  if (unresolved.length === 0) return [];

  const relevantBookingIds = [...new Set(unresolved.map((f) => f.bookingId).filter((id): id is string => !!id))];
  const bookingRows =
    relevantBookingIds.length > 0
      ? await db
          .select({ id: bookings.id, bookingNumber: bookings.bookingNumber, customerId: bookings.customerId })
          .from(bookings)
          .where(inArray(bookings.id, relevantBookingIds))
      : [];
  const bookingMap = new Map(bookingRows.map((b) => [b.id, b]));

  const customerIds = [...new Set(bookingRows.map((b) => b.customerId).filter((id): id is string => !!id))];
  const customerRows =
    customerIds.length > 0
      ? await db
          .select({ id: customers.id, firstName: customers.firstName, lastName: customers.lastName })
          .from(customers)
          .where(inArray(customers.id, customerIds))
      : [];
  const customerMap = new Map(customerRows.map((c) => [c.id, c]));

  return unresolved.map((f) => {
    const b = f.bookingId ? bookingMap.get(f.bookingId) : undefined;
    const c = b?.customerId ? customerMap.get(b.customerId) : undefined;
    const deliveryLabel = f.deliveryStatus ? DELIVERY_STATUS_LABELS[f.deliveryStatus] : null;
    return {
      id: f.id,
      bookingId: f.bookingId,
      bookingNumber: b?.bookingNumber ?? "—",
      guestName: c ? `${c.firstName} ${c.lastName}`.trim() : "—",
      to: f.to,
      template: f.template,
      subject: f.subject,
      error: f.error ?? deliveryLabel,
      sentAt: f.sentAt,
    };
  });
}
