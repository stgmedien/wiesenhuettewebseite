"use server";

import { headers } from "next/headers";
import { subscribeNewsletterDoi } from "@/lib/brevo";
import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.de";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type NewsletterState = { status: "idle" | "ok" | "error" | "invalid"; message?: string };

// Sehr einfacher In-Memory-Rate-Limit pro Instanz (Best effort gegen
// Mehrfach-Spam). Brevo selbst dedupliziert ohnehin auf Kontaktebene.
const recent = new Map<string, number>();
const WINDOW_MS = 60_000;

/**
 * Newsletter-Anmeldung: stößt das Brevo-Double-Opt-in an. Brevo verschickt
 * die Bestätigungsmail; der Kontakt landet erst nach dem Klick in der Liste.
 */
export async function subscribeNewsletter(
  _prev: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  // Honeypot — Bots füllen unsichtbare Felder aus. Still „ok" zurückgeben.
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { status: "ok" };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const firstName = String(formData.get("firstName") ?? "").trim().slice(0, 80) || null;
  const consent = formData.get("consent") === "on";

  if (!EMAIL_RE.test(email) || email.length > 255 || !consent) {
    return { status: "invalid" };
  }

  // Rate-Limit pro IP+Mail.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `${ip}:${email}`;
  const now = Date.now();
  for (const [k, ts] of recent) if (now - ts > WINDOW_MS) recent.delete(k);
  if (recent.has(key)) {
    // Innerhalb des Fensters: still als Erfolg quittieren (keine Auskunft).
    return { status: "ok" };
  }
  recent.set(key, now);

  const result = await subscribeNewsletterDoi(email, {
    firstName,
    redirectionUrl: `${BASE_URL}/newsletter/bestaetigt`,
  });

  if (!result.ok) {
    return {
      status: "error",
      message:
        result.reason === "not_configured"
          ? "Der Newsletter ist gerade nicht verfügbar. Bitte versuch es später noch einmal."
          : "Da ist etwas schiefgelaufen. Bitte versuch es in einem Moment noch einmal.",
    };
  }

  try {
    await db.insert(activityLog).values({
      who: "Newsletter",
      what: `Newsletter-Anmeldung (Double-Opt-in angestoßen) für ${email}`,
    });
  } catch {
    /* Log ist best effort */
  }

  return { status: "ok" };
}
