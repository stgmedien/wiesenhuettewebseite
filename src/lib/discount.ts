/**
 * Discount-Code-Validierung und -Einloesung.
 *
 * Wir verwenden die existierende discountCodes-Tabelle. Loyalty-Codes sind an
 * customerId gebunden — sie funktionieren nur fuer den jeweiligen Kunden.
 * Manager-Codes ohne customerId koennen jeder einloesen.
 */

import { db } from "@/lib/db";
import { discountCodes } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export type DiscountCheck =
  | {
      ok: true;
      codeId: string;
      code: string;
      percentOff: number;
      fixedOffCents: number;
      issuedReason: string | null;
    }
  | { ok: false; error: string };

export const validateDiscountCode = async (
  rawCode: string,
  customerId: string | null,
  subtotalCents: number
): Promise<DiscountCheck> => {
  const cleaned = rawCode.trim().toUpperCase();
  if (!cleaned) return { ok: false, error: "Bitte Rabatt-Code eingeben." };

  const found = await db
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.code, cleaned))
    .limit(1);
  const dc = found[0];
  if (!dc) return { ok: false, error: "Rabatt-Code unbekannt." };
  if (!dc.active) return { ok: false, error: "Rabatt-Code ist nicht mehr aktiv." };

  // Datum-Range
  const today = new Date().toISOString().slice(0, 10);
  if (dc.validFrom && dc.validFrom > today) {
    return { ok: false, error: "Rabatt-Code ist noch nicht gültig." };
  }
  if (dc.validUntil && dc.validUntil < today) {
    return { ok: false, error: "Rabatt-Code ist abgelaufen." };
  }

  // Redemptions
  if (dc.redemptions >= dc.maxRedemptions) {
    return { ok: false, error: "Rabatt-Code wurde bereits maximal eingelöst." };
  }

  // Personalisiert (Loyalty-Code)?
  if (dc.customerId && dc.customerId !== customerId) {
    return {
      ok: false,
      error: "Dieser Rabatt-Code gehört zu einem anderen Konto.",
    };
  }

  // Mindestbetrag
  if (subtotalCents < dc.minSubtotalCents) {
    return {
      ok: false,
      error: `Mindest-Buchungssumme von ${(dc.minSubtotalCents / 100).toFixed(2)} € nicht erreicht.`,
    };
  }

  return {
    ok: true,
    codeId: dc.id,
    code: dc.code,
    percentOff: dc.percentOff,
    fixedOffCents: dc.fixedOffCents,
    issuedReason: dc.issuedReason ?? null,
  };
};

export const calculateDiscountCents = (
  subtotalCents: number,
  percentOff: number,
  fixedOffCents: number
): number => {
  let off = 0;
  if (percentOff > 0) off += Math.round((subtotalCents * percentOff) / 100);
  if (fixedOffCents > 0) off += fixedOffCents;
  return Math.min(off, subtotalCents);
};

export const markDiscountRedeemed = async (
  codeId: string,
  bookingId: string
): Promise<void> => {
  // Atomar: erhoehe redemptions, aber nur wenn redemptions < maxRedemptions
  const found = await db
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.id, codeId))
    .limit(1);
  const dc = found[0];
  if (!dc) return;
  if (dc.redemptions >= dc.maxRedemptions) return;
  await db
    .update(discountCodes)
    .set({
      redemptions: dc.redemptions + 1,
      redeemedBookingId: bookingId,
      redeemedAt: new Date(),
      // Wenn voll eingeloest, deaktivieren
      active: dc.redemptions + 1 >= dc.maxRedemptions ? false : dc.active,
    })
    .where(and(eq(discountCodes.id, codeId), eq(discountCodes.redemptions, dc.redemptions)));
};

/**
 * Server-Action-tauglich: validiert nur (kein DB-Write).
 */
export const previewDiscount = async (
  rawCode: string,
  customerId: string | null,
  subtotalCents: number
): Promise<
  | { ok: true; code: string; percentOff: number; fixedOffCents: number; discountCents: number }
  | { ok: false; error: string }
> => {
  const r = await validateDiscountCode(rawCode, customerId, subtotalCents);
  if (!r.ok) return r;
  const discountCents = calculateDiscountCents(subtotalCents, r.percentOff, r.fixedOffCents);
  return {
    ok: true,
    code: r.code,
    percentOff: r.percentOff,
    fixedOffCents: r.fixedOffCents,
    discountCents,
  };
};
