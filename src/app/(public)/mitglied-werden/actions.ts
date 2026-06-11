"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, membershipTiers, activityLog } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.de";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Nur interne Weiterleitungsziele zulassen (kein Open-Redirect). */
const safeNext = (raw: unknown): string | null => {
  const s = String(raw ?? "");
  return s.startsWith("/") && !s.startsWith("//") ? s.slice(0, 200) : null;
};

/**
 * Online-Beitritt: startet den Stripe-Checkout (Jahres-Abo) für die gewählte
 * Beitragskategorie. Die Mitgliedschaft wird erst im Webhook aktiviert,
 * wenn die Zahlung wirklich durch ist — hier wird nur der Kunde angelegt
 * bzw. wiederverwendet und zur Zahlung weitergeleitet.
 */
export async function startMembershipJoin(formData: FormData) {
  // Honeypot — Bots füllen unsichtbare Felder aus.
  if (String(formData.get("website") ?? "").trim() !== "") {
    redirect("/mitglied-werden?status=fehler");
  }

  const next = safeNext(formData.get("next"));
  const nextQs = next ? `&next=${encodeURIComponent(next)}` : "";

  const tierCode = String(formData.get("tierCode") ?? "").slice(0, 60);
  const firstName = String(formData.get("firstName") ?? "").trim().slice(0, 120);
  const lastName = String(formData.get("lastName") ?? "").trim().slice(0, 120);
  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 60) || null;
  const acceptTerms = formData.get("acceptTerms") === "on";

  if (
    !firstName ||
    !lastName ||
    !EMAIL_RE.test(emailRaw) ||
    emailRaw.length > 255 ||
    !acceptTerms
  ) {
    redirect(`/mitglied-werden?status=fehler${nextQs}`);
  }

  const tierRow = await db
    .select()
    .from(membershipTiers)
    .where(eq(membershipTiers.code, tierCode))
    .limit(1);
  const tier = tierRow[0];
  if (!tier || !tier.active || tier.annualFeeCents <= 0) {
    redirect(`/mitglied-werden?status=fehler${nextQs}`);
  }

  // Eingeloggte Nutzer beitreten mit ihrer Konto-Mail — verhindert, dass
  // die Mitgliedschaft an einer zweiten Adresse landet, die beim Buchen
  // dann nicht greift.
  const session = await auth();
  const email = session?.user?.email?.toLowerCase() ?? emailRaw;
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id ?? null;

  // Kunde wiederverwenden oder anlegen (Dedupe über E-Mail).
  const existing = await db
    .select()
    .from(customers)
    .where(eq(customers.email, email))
    .limit(1);
  let customer = existing[0];

  if (customer?.membershipStatus === "verified") {
    redirect(`/mitglied-werden?status=schon-mitglied${nextQs}`);
  }

  if (customer) {
    // Nur fehlende Daten ergänzen, nichts überschreiben. userId verknüpfen,
    // wenn eingeloggt: getBookingPrefill() löst Mitgliederpreise über
    // customers.userId auf — ohne Verknüpfung griffe die Mitgliedschaft
    // beim Buchen nicht.
    await db
      .update(customers)
      .set({
        ...(customer.phone ? {} : { phone }),
        ...(customer.userId || !sessionUserId ? {} : { userId: sessionUserId }),
      })
      .where(eq(customers.id, customer.id));
  } else {
    const inserted = await db
      .insert(customers)
      .values({
        type: "privat", // wird im Webhook nach Zahlung auf "mitglied" gehoben
        userId: sessionUserId,
        firstName,
        lastName,
        email,
        phone,
        membershipStatus: "none",
      })
      .returning();
    customer = inserted[0];
  }

  let checkoutUrl: string | null = null;
  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card", "sepa_debit"],
      line_items: [
        {
          quantity: 1,
          // Tiers haben (noch) keine Stripe-Price-IDs — Preis inline aus
          // membership_tiers.annualFeeCents, jährlich wiederkehrend.
          price_data: {
            currency: "eur",
            unit_amount: tier.annualFeeCents,
            recurring: { interval: "year" },
            product_data: {
              name: `Mitgliedschaft Skifreunde Gütersloh — ${tier.name}`,
              description: "Jahresbeitrag · jederzeit zum Jahresende kündbar",
            },
          },
        },
      ],
      customer: customer.stripeSubscriptionCustomerId ?? undefined,
      customer_email: customer.stripeSubscriptionCustomerId ? undefined : email,
      client_reference_id: customer.id,
      metadata: {
        kind: "membership-signup",
        customerId: customer.id,
        tierCode: tier.code,
      },
      subscription_data: {
        metadata: { customerId: customer.id, tierCode: tier.code },
      },
      success_url: `${BASE_URL}/mitglied-werden/danke?session_id={CHECKOUT_SESSION_ID}${nextQs}`,
      cancel_url: `${BASE_URL}/mitglied-werden?status=abgebrochen${nextQs}`,
    });
    checkoutUrl = checkout.url;

    await db.insert(activityLog).values({
      who: email,
      what: `Online-Beitritt gestartet (${tier.code} — ${(tier.annualFeeCents / 100).toFixed(2)} €/Jahr)`,
    });
  } catch (e) {
    console.error("[mitglied-werden] stripe checkout failed", e);
  }

  // redirect() bewusst außerhalb des try/catch (NEXT_REDIRECT).
  if (!checkoutUrl) {
    redirect(`/mitglied-werden?status=fehler${nextQs}`);
  }
  redirect(checkoutUrl);
}
