import { db } from "@/lib/db";
import { customers, discountCodes, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const TIER_THRESHOLDS = [
  { tier: 1, stays: 3, percentOff: 10, label: "Stammgast (3+ Aufenthalte)" },
  { tier: 2, stays: 10, percentOff: 15, label: "Treuer Stammgast (10+ Aufenthalte)" },
];

const generateCode = (): string => {
  // Format: WH-XXXX-XXXX
  const bytes = crypto.randomBytes(4);
  const part1 = bytes.toString("hex").slice(0, 4).toUpperCase();
  const part2 = bytes.toString("hex").slice(4, 8).toUpperCase();
  return `WH-${part1}-${part2}`;
};

/**
 * Wird vom Stripe-Webhook aufgerufen, wenn eine Buchung auf "abgereist" wechselt.
 * Inkrementiert completedStays und gibt einen Loyalty-Rabatt-Code aus, falls
 * eine neue Tier-Schwelle erreicht wurde.
 */
export async function recordCompletedStayAndMaybeIssueDiscount(
  customerId: string
): Promise<{ newCount: number; newTier: number; codeIssued?: string }> {
  const found = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
  const c = found[0];
  if (!c) return { newCount: 0, newTier: 0 };

  // Anonymisierte Customer-Records beruehren wir nicht.
  if (c.anonymizedAt) return { newCount: c.completedStays, newTier: c.loyaltyTier };

  const newCount = c.completedStays + 1;
  let newTier = c.loyaltyTier;

  // Tier ermitteln (hoechste erreichte Schwelle)
  for (const t of TIER_THRESHOLDS) {
    if (newCount >= t.stays && c.loyaltyTier < t.tier) {
      newTier = t.tier;
    }
  }

  let codeIssued: string | undefined;

  if (newTier > c.loyaltyTier) {
    // Neue Tier erreicht — Rabatt-Code ausgeben
    const tier = TIER_THRESHOLDS.find((t) => t.tier === newTier);
    if (tier) {
      let code = generateCode();
      // Sehr unwahrscheinlich, aber dedupen
      let attempt = 0;
      while (attempt < 5) {
        const dup = await db
          .select({ id: discountCodes.id })
          .from(discountCodes)
          .where(eq(discountCodes.code, code))
          .limit(1);
        if (!dup[0]) break;
        code = generateCode();
        attempt++;
      }
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 2);

      await db.insert(discountCodes).values({
        code,
        kind: "loyalty",
        percentOff: tier.percentOff,
        customerId: c.id,
        issuedReason: tier.label,
        validUntil: validUntil.toISOString().slice(0, 10),
        maxRedemptions: 1,
        active: true,
      });
      codeIssued = code;

      await db.insert(activityLog).values({
        who: "System (Loyalty)",
        what: `Treue-Rabatt ${tier.percentOff}% ausgegeben fuer Customer ${c.id} — Code ${code}`,
      });
    }
  }

  await db
    .update(customers)
    .set({
      completedStays: newCount,
      loyaltyTier: newTier,
      ...(codeIssued ? { loyaltyDiscountIssuedAt: new Date() } : {}),
    })
    .where(eq(customers.id, c.id));

  return { newCount, newTier, codeIssued };
}

/**
 * Fuer das Konto-UI: alle aktiven, noch nicht eingeloesten Loyalty-Codes des Kunden.
 */
export async function getActiveLoyaltyCodes(customerId: string) {
  return await db
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.customerId, customerId));
}
