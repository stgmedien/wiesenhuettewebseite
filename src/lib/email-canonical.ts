import { db } from "@/lib/db";
import { bookings, customers } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

/**
 * Gmail ignoriert Punkte und „+Zusatz“ im Namensteil: finn.anders@gmail.com,
 * finnanders@gmail.com und finnanders+wh@googlemail.com landen im selben
 * Postfach. Liefert für Gmail-Adressen den kanonischen Namensteil, sonst null.
 */
export function gmailLocalPart(email: string): string | null {
  const [local, domain] = email.trim().toLowerCase().split("@");
  if (!local || !domain || !GMAIL_DOMAINS.has(domain)) return null;
  return local.split("+")[0].replace(/\./g, "");
}

/**
 * Login per Magic-Link: Tippt ein Gast seine Gmail-Adresse anders als bei der
 * Buchung (mit/ohne Punkt), landete er bisher in einem leeren Konto (Finn
 * 11/2026). Gibt die bei einer BUCHUNG hinterlegte Schreibweise zurück, falls
 * es eine gibt — die Mail kommt so oder so im selben Postfach an, es wird
 * also kein fremdes Konto geöffnet. Sonst die eingegebene Adresse.
 */
export async function resolveLoginEmail(email: string): Promise<string> {
  const local = gmailLocalPart(email);
  if (!local) return email;
  const rows = await db
    .select({ email: customers.email })
    .from(customers)
    .innerJoin(bookings, eq(bookings.customerId, customers.id))
    .where(
      sql`split_part(lower(${customers.email}), '@', 2) in ('gmail.com', 'googlemail.com')
        and replace(split_part(split_part(lower(${customers.email}), '@', 1), '+', 1), '.', '') = ${local}`
    )
    .orderBy(desc(bookings.createdAt))
    .limit(1);
  return rows[0]?.email.toLowerCase() ?? email;
}
