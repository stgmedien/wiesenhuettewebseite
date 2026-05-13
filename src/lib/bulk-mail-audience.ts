/**
 * Audience-Resolver für Bulk-Mail-Kampagnen.
 *
 * Gibt Listen von Customer-Records zurück, die Bulk-Mails empfangen sollen
 * (mit Berücksichtigung von emailOptOut + anonymizedAt).
 */

import { db } from "@/lib/db";
import { customers, bookings } from "@/lib/db/schema";
import { and, eq, gte, isNull, isNotNull, ne, inArray } from "drizzle-orm";

export type AudienceKey =
  | "all_customers"
  | "verified_members"
  | "recent_guests"
  | "upcoming_guests";

export const AUDIENCE_LABELS: Record<AudienceKey, string> = {
  all_customers: "Alle aktiven Kunden (mit eingetragener E-Mail, ohne Opt-Out)",
  verified_members: "Verifizierte Vereinsmitglieder",
  recent_guests: "Gäste der letzten 12 Monate (Status abgereist)",
  upcoming_guests: "Gäste mit kommender Buchung",
};

export type AudienceRecipient = {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  preferredLanguage: string;
};

/**
 * Resolve audience to list of recipients. Filtert immer:
 *  - emailOptOut = false
 *  - anonymizedAt IS NULL (gelöschte Accounts raus)
 *  - email muss vorhanden sein (nicht "anon+...@wiesenhuette.invalid")
 */
export async function resolveAudience(audience: AudienceKey): Promise<AudienceRecipient[]> {
  if (audience === "all_customers") {
    const rows = await db
      .select({
        customerId: customers.id,
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
        preferredLanguage: customers.preferredLanguage,
      })
      .from(customers)
      .where(and(eq(customers.emailOptOut, false), isNull(customers.anonymizedAt)));
    return rows.filter((r) => !r.email.endsWith("@wiesenhuette.invalid"));
  }

  if (audience === "verified_members") {
    const rows = await db
      .select({
        customerId: customers.id,
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
        preferredLanguage: customers.preferredLanguage,
      })
      .from(customers)
      .where(
        and(
          eq(customers.emailOptOut, false),
          isNull(customers.anonymizedAt),
          eq(customers.membershipStatus, "verified")
        )
      );
    return rows.filter((r) => !r.email.endsWith("@wiesenhuette.invalid"));
  }

  if (audience === "recent_guests" || audience === "upcoming_guests") {
    // Customers, die in den letzten 12 Monaten "abgereist" sind ODER eine
    // kommende Buchung haben.
    const today = new Date().toISOString().slice(0, 10);
    const oneYearAgo = new Date();
    oneYearAgo.setMonth(oneYearAgo.getMonth() - 12);
    const ago = oneYearAgo.toISOString().slice(0, 10);

    const condition =
      audience === "recent_guests"
        ? and(eq(bookings.status, "abgereist"), gte(bookings.departure, ago))
        : and(
            gte(bookings.arrival, today),
            ne(bookings.status, "storniert")
          );

    const matchingCustomerIds = await db
      .selectDistinct({ customerId: bookings.customerId })
      .from(bookings)
      .where(condition);
    const ids = matchingCustomerIds.map((r) => r.customerId).filter((x): x is string => !!x);
    if (ids.length === 0) return [];

    const rows = await db
      .select({
        customerId: customers.id,
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
        preferredLanguage: customers.preferredLanguage,
      })
      .from(customers)
      .where(
        and(
          eq(customers.emailOptOut, false),
          isNull(customers.anonymizedAt),
          inArray(customers.id, ids)
        )
      );
    return rows.filter((r) => !r.email.endsWith("@wiesenhuette.invalid"));
  }

  return [];
}

/**
 * One-Click-Opt-Out-Token-Hilfsfunktion. Wir signieren die Customer-ID via
 * Hash mit MAIL_OPTOUT_SECRET (env-var). Bei Klick auf /opt-out?id=...&t=...
 * wird Token verifiziert + customer.emailOptOut auf true gesetzt.
 *
 * Vermeidet eigene token-Tabelle (Mass-Mails fluten sonst die DB).
 */
import crypto from "crypto";

export function buildOptOutToken(customerId: string): string {
  const secret = process.env.MAIL_OPTOUT_SECRET ?? process.env.NEXTAUTH_SECRET ?? "fallback-please-set-secret";
  return crypto.createHmac("sha256", secret).update(customerId).digest("hex").slice(0, 24);
}

export function verifyOptOutToken(customerId: string, token: string): boolean {
  const expected = buildOptOutToken(customerId);
  // Constant-time comparison
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}
