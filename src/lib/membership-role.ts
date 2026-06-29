import { db } from "@/lib/db";
import { users, customers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Hebt das Login-Konto einer verifizierten Mitglieds-Adresse auf die Rolle
 * "member" (Anzeige "Mitglied" statt "Kunde" in der Benutzerliste).
 *
 * Selbst-prüfend und sicher an jeder Mitgliedschafts-Vergabe aufrufbar:
 * - Wirkt NUR, wenn die Adresse ein verifiziertes Mitglieds-`customers`-Profil hat.
 * - Wirkt NUR auf reine Kunden-Konten (`role = "customer"`); Manager/Admin bleiben
 *   unangetastet (ein Vorstandsmitglied mit Backend-Zugang behält seine Rolle).
 * - No-op, wenn (noch) kein Konto existiert — dann greift es beim Magic-Link-Login.
 *
 * Mitgliederpreise hängen weiterhin allein an `customers.membershipStatus`; diese
 * Rolle ist reine Kategorisierung/Anzeige.
 */
export async function promoteToMemberRole(email: string): Promise<void> {
  const lower = email.toLowerCase().trim();
  if (!lower) return;

  const member = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        eq(customers.email, lower),
        eq(customers.membershipStatus, "verified"),
        eq(customers.type, "mitglied"),
      ),
    )
    .limit(1);
  if (!member[0]) return;

  await db
    .update(users)
    .set({ role: "member", updatedAt: new Date() })
    .where(and(eq(users.email, lower), eq(users.role, "customer")));
}
