import { db } from "@/lib/db";
import { emailLog } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

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
