import { db } from "@/lib/db";
import { customers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { promoteToMemberRole } from "@/lib/membership-role";

/**
 * Stellt sicher, dass ein Kunden-Datensatz mit einem Gastkonto (users-Zeile)
 * verknüpft ist — wie bei der Online-Buchung: Rolle "customer", kein
 * Passwort, Login per Magic-Link an die hinterlegte E-Mail.
 *
 * Für manuell im Manager angelegte Buchungen (vorher ohne Konto, dadurch
 * keine Willkommens-Mail möglich). Ein bestehendes Konto gleicher Adresse
 * wird verknüpft statt dupliziert; ein gelöschtes Konto wird NICHT
 * reaktiviert (dann null).
 */
export async function ensureCustomerAccount(
  customerId: string
): Promise<{ userId: string; created: boolean } | null> {
  const customer = (
    await db.select().from(customers).where(eq(customers.id, customerId)).limit(1)
  )[0];
  if (!customer) return null;
  if (customer.userId) return { userId: customer.userId, created: false };

  const email = customer.email.toLowerCase().trim();
  const existing = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
  if (existing?.deletedAt) return null;

  let userId: string;
  let created = false;
  if (existing) {
    userId = existing.id;
  } else {
    const ins = await db
      .insert(users)
      .values({
        email,
        name: `${customer.firstName} ${customer.lastName}`.trim() || null,
        role: "customer",
      })
      .returning({ id: users.id });
    userId = ins[0].id;
    created = true;
  }

  await db.update(customers).set({ userId }).where(eq(customers.id, customerId));
  // Verifizierte Mitglieder bekommen die Rolle "member" (wie beim Magic-Link-Login).
  await promoteToMemberRole(email);
  return { userId, created };
}
