/**
 * Voucher-Redemption-Helpers — werden im /buchen-Flow verwendet, parallel
 * zur existierenden discount_codes-Logik. Vouchers sind GELDWERT-Gutscheine,
 * discount_codes sind PROZENT-Rabatte → separate Pipelines.
 *
 * Voucher-Discount = min(voucher.remainingCents, booking.subtotalCents)
 * Beim Booking-Insert wird voucherId + voucherDiscountCents am Booking
 * gespeichert, beim Webhook-Success wird voucher.redeemedCents += discount
 * und gegebenenfalls fullyRedeemed=true gesetzt.
 */

import { eq, and, gt, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { vouchers } from "@/lib/db/schema";
import { normalizeVoucherCode, isValidVoucherCodeShape } from "./voucher-code";

export type VoucherPreview =
  | {
      ok: true;
      voucherId: string;
      code: string;
      remainingCents: number;
      discountCents: number; // tatsächlich anwendbar für diese Buchung
    }
  | { ok: false; error: string };

export async function previewVoucher(
  rawCode: string,
  subtotalCents: number
): Promise<VoucherPreview> {
  const code = normalizeVoucherCode(rawCode);
  if (!isValidVoucherCodeShape(code)) {
    return { ok: false, error: "Ungültiges Code-Format." };
  }
  const rows = await db
    .select()
    .from(vouchers)
    .where(eq(vouchers.code, code))
    .limit(1);
  const v = rows[0];
  if (!v) return { ok: false, error: "Gutschein-Code nicht gefunden." };
  if (!v.paidAt) return { ok: false, error: "Gutschein noch nicht freigegeben (Zahlung steht aus)." };
  if (v.fullyRedeemed) return { ok: false, error: "Gutschein vollständig eingelöst." };
  if (v.expiresAt && v.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "Gutschein abgelaufen." };
  }
  const remainingCents = v.valueCents - v.redeemedCents;
  if (remainingCents <= 0) {
    return { ok: false, error: "Kein Restwert auf dem Gutschein." };
  }
  const discountCents = Math.min(remainingCents, subtotalCents);
  return {
    ok: true,
    voucherId: v.id,
    code: v.code,
    remainingCents,
    discountCents,
  };
}

/**
 * Wird im Stripe-Webhook nach erfolgreicher Anzahlung aufgerufen.
 * Atomar: redeemedCents += discount, ggf. fullyRedeemed=true,
 * firstRedeemedAt setzen wenn null.
 */
export async function markVoucherRedeemed(
  voucherId: string,
  bookingId: string,
  discountCents: number
): Promise<void> {
  const rows = await db.select().from(vouchers).where(eq(vouchers.id, voucherId)).limit(1);
  const v = rows[0];
  if (!v) return;
  const newRedeemed = v.redeemedCents + discountCents;
  const isFully = newRedeemed >= v.valueCents;
  await db
    .update(vouchers)
    .set({
      redeemedCents: newRedeemed,
      firstRedeemedAt: v.firstRedeemedAt ?? new Date(),
      fullyRedeemed: isFully,
      updatedAt: new Date(),
    })
    .where(and(eq(vouchers.id, voucherId), gt(vouchers.valueCents, v.redeemedCents)));
}
