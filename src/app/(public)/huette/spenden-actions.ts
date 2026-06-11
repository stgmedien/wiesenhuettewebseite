"use server";

import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.de";

// Leitplanken gegen Tippfehler/Missbrauch: 2 € bis 5.000 €.
const MIN_CENTS = 200;
const MAX_CENTS = 500_000;

/**
 * Spenden-Checkout für das Zeltpodest.
 * Eine simple Stripe-Checkout-Session (mode=payment, submit_type=donate) —
 * der Webhook ignoriert kind="donation" bewusst, Stripe selbst ist die
 * Buchhaltung der Spenden.
 */
export async function createDonationCheckout(formData: FormData) {
  const raw = String(formData.get("amount") ?? "").trim().replace(",", ".");
  const eur = Number.parseFloat(raw);
  const cents = Math.round(eur * 100);

  if (!Number.isFinite(eur) || cents < MIN_CENTS || cents > MAX_CENTS) {
    redirect("/huette?spende=fehler#spenden");
  }

  let checkoutUrl: string | null = null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: "donate",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: cents,
            product_data: {
              name: "Spende: Zeltpodest an der Wiesenhütte",
              description: "Skifreunde Gütersloh e.V. · Langewiese",
            },
          },
        },
      ],
      metadata: { kind: "donation", purpose: "zeltpodest" },
      success_url: `${BASE_URL}/huette?spende=danke#spenden`,
      cancel_url: `${BASE_URL}/huette#spenden`,
    });
    checkoutUrl = session.url;
  } catch (e) {
    console.error("[spenden] stripe checkout failed", e);
  }

  // redirect() bewusst außerhalb des try/catch — sonst würde das von
  // Next.js intern geworfene NEXT_REDIRECT vom catch verschluckt.
  if (!checkoutUrl) {
    redirect("/huette?spende=fehler#spenden");
  }
  redirect(checkoutUrl);
}
