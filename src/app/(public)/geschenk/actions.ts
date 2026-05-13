"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { vouchers, activityLog } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { generateVoucherCode, voucherExpiryDate } from "@/lib/voucher-code";

const VOUCHER_MIN_CENTS = 25_00;
const VOUCHER_MAX_CENTS = 1000_00;

const schema = z.object({
  valueEuros: z.coerce.number().min(25).max(1000),
  purchaserName: z.string().min(2).max(200),
  purchaserEmail: z.string().email().max(255),
  recipientName: z.string().max(200).optional().nullable(),
  recipientEmail: z.string().email().max(255).optional().nullable().or(z.literal("")),
  personalMessage: z.string().max(1000).optional().nullable(),
  deliveryMode: z.enum(["email", "print"]).default("email"),
});

export type Result =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string };

export async function createGiftCheckoutSession(formData: FormData): Promise<Result> {
  const raw = {
    valueEuros: formData.get("valueEuros"),
    purchaserName: (formData.get("purchaserName") || "").toString().trim(),
    purchaserEmail: (formData.get("purchaserEmail") || "").toString().trim().toLowerCase(),
    recipientName: (formData.get("recipientName") || "").toString().trim() || null,
    recipientEmail:
      (formData.get("recipientEmail") || "").toString().trim().toLowerCase() || null,
    personalMessage: (formData.get("personalMessage") || "").toString().trim() || null,
    deliveryMode: formData.get("deliveryMode") || "email",
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  const d = parsed.data;
  const valueCents = Math.round(d.valueEuros * 100);
  if (valueCents < VOUCHER_MIN_CENTS || valueCents > VOUCHER_MAX_CENTS) {
    return { ok: false, error: "Betrag zwischen 25 € und 1.000 €." };
  }

  // Voucher anlegen (vor Payment, mit Code, paidAt=null)
  const code = generateVoucherCode();
  const inserted = await db
    .insert(vouchers)
    .values({
      code,
      valueCents,
      purchaserName: d.purchaserName,
      purchaserEmail: d.purchaserEmail,
      recipientName: d.recipientName,
      recipientEmail: d.recipientEmail || null,
      personalMessage: d.personalMessage,
      deliveryMode: d.deliveryMode,
      expiresAt: voucherExpiryDate(),
    })
    .returning({ id: vouchers.id, code: vouchers.code });

  const voucherId = inserted[0].id;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: valueCents,
            product_data: {
              name: `Wiesenhütte-Gutschein über ${(valueCents / 100).toFixed(2)} €`,
              description: d.recipientName
                ? `Geschenk-Gutschein für ${d.recipientName}`
                : "Geschenk-Gutschein",
            },
          },
          quantity: 1,
        },
      ],
      customer_email: d.purchaserEmail,
      client_reference_id: voucherId,
      metadata: {
        kind: "gift-voucher",
        voucherId,
        voucherCode: code,
      },
      success_url: `${baseUrl}/geschenk/erfolg?code=${code}`,
      cancel_url: `${baseUrl}/geschenk?abort=1`,
    });

    // Stripe-Session-ID am Voucher speichern
    await db
      .update(vouchers)
      .set({ stripeSessionId: session.id })
      .where(eq(vouchers.id, voucherId));

    await db.insert(activityLog).values({
      who: d.purchaserEmail,
      what: `Geschenk-Gutschein gestartet: ${code} über ${(valueCents / 100).toFixed(2)} € — wartet auf Zahlung`,
    });

    return { ok: true, checkoutUrl: session.url ?? "" };
  } catch (err) {
    // Voucher wieder löschen (Pre-Payment-Cleanup)
    await db.delete(vouchers).where(eq(vouchers.id, voucherId));
    const msg = err instanceof Error ? err.message : "Stripe-Fehler";
    await db.insert(activityLog).values({
      who: d.purchaserEmail,
      what: `Geschenk-Gutschein-Checkout fehlgeschlagen: ${msg}`,
    });
    return { ok: false, error: `Zahlung konnte nicht initialisiert werden: ${msg}` };
  }
}
