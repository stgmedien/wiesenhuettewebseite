"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { customers, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { sendMail } from "@/lib/mail/send";
import CancellationReceivedEmail from "@/lib/mail/templates/cancellation-received";

const schema = z.object({
  name: z.string().min(1, "Bitte Deinen Namen angeben.").max(160),
  email: z.string().email("Bitte eine gültige E-Mail-Adresse angeben.").max(255),
  art: z.enum(["ordentlich", "ausserordentlich"]).default("ordentlich"),
  reason: z.string().max(2000).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
  company: z.string().max(100).optional(), // Honeypot
});

export type CancelResult =
  | { ok: true; receivedAt: string; effectiveText: string }
  | { ok: false; error: string };

const fmtNow = (d: Date) =>
  d.toLocaleString("de-DE", { dateStyle: "long", timeStyle: "short" }) + " Uhr";

export async function submitCancellation(formData: FormData): Promise<CancelResult> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    art: formData.get("art") ?? "ordentlich",
    reason: formData.get("reason") || null,
    note: formData.get("note") || null,
    company: formData.get("company") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Bitte Eingaben prüfen." };
  }
  const d = parsed.data;

  const now = new Date();
  const receivedAt = fmtNow(now);

  // Honeypot: Bots füllen das versteckte Feld → vortäuschen, dass alles ok ist.
  if (d.company && d.company.trim().length > 0) {
    return { ok: true, receivedAt, effectiveText: "zum Ende des laufenden Beitragsjahres" };
  }

  const email = d.email.toLowerCase().trim();

  const c = (await db.select().from(customers).where(eq(customers.email, email)).limit(1))[0];

  let subscriptionCancelled = false;
  let effectiveText =
    d.art === "ausserordentlich" ? "sofort (außerordentliche Kündigung)" : "zum Ende des laufenden Beitragsjahres";

  if (c?.stripeSubscriptionId && c.subscriptionStatus !== "canceled") {
    try {
      if (d.art === "ausserordentlich") {
        await stripe.subscriptions.cancel(c.stripeSubscriptionId);
        effectiveText = "sofort (außerordentliche Kündigung)";
      } else {
        await stripe.subscriptions.update(c.stripeSubscriptionId, { cancel_at_period_end: true });
        effectiveText = c.subscriptionCurrentPeriodEnd
          ? `zum ${new Date(c.subscriptionCurrentPeriodEnd).toLocaleDateString("de-DE", {
              dateStyle: "long",
            })} (Ende des Beitragsjahres)`
          : "zum Ende des laufenden Beitragsjahres";
      }
      subscriptionCancelled = true;
    } catch (err) {
      // Eingang trotzdem bestaetigen + Vorstand benachrichtigen → manuelle Bearbeitung.
      console.error("[kuendigen] Stripe-Kündigung fehlgeschlagen:", err);
    }
  }

  await db.insert(activityLog).values({
    who: email,
    what: `§312k-Kündigung eingegangen (${d.art}${
      subscriptionCancelled ? ", Stripe-Abo gekündigt" : ", manuell zu bearbeiten"
    })${d.note ? ` — ${d.note}` : ""}`,
  });

  // §312k Abs. 3: sofortige elektronische Eingangsbestätigung an die kündigende Person.
  try {
    await sendMail({
      to: email,
      subject: "Eingangsbestätigung: Deine Kündigung der Mitgliedschaft",
      template: "cancellation-received",
      react: CancellationReceivedEmail({
        name: d.name,
        email,
        art: d.art,
        reason: d.reason ?? null,
        effectiveText,
        receivedAt,
        subscriptionCancelled,
      }),
    });
  } catch (err) {
    console.error("[kuendigen] Eingangsbestätigung-Mail fehlgeschlagen:", err);
  }

  // Vorstand informieren (vor allem bei Offline-Mitgliedschaften ohne Stripe-Abo).
  const internalTo = process.env.MAIL_INTERNAL_TO;
  if (internalTo) {
    try {
      await sendMail({
        to: internalTo,
        subject: `Kündigung eingegangen: ${d.name}`,
        template: "cancellation-received-internal",
        replyTo: email,
        react: CancellationReceivedEmail({
          name: d.name,
          email,
          art: d.art,
          reason: d.reason ?? d.note ?? null,
          effectiveText,
          receivedAt,
          subscriptionCancelled,
          forBoard: true,
        }),
      });
    } catch (err) {
      console.error("[kuendigen] interne Benachrichtigung fehlgeschlagen:", err);
    }
  }

  return { ok: true, receivedAt, effectiveText };
}
