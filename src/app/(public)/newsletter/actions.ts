"use server";

import { headers } from "next/headers";
import { subscribeNewsletterDoi, subscribeMemberNewsletterDoi } from "@/lib/brevo";
import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.de";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type NewsletterState = { status: "idle" | "ok" | "error" | "invalid"; message?: string };

// Sehr einfacher In-Memory-Rate-Limit pro Instanz (Best effort gegen
// Mehrfach-Spam). Brevo selbst dedupliziert ohnehin auf Kontaktebene.
const recent = new Map<string, number>();
const WINDOW_MS = 60_000;

type NewsletterKind = "public" | "member";

/**
 * Gemeinsame Newsletter-Anmelde-Logik (Honeypot, Validierung, Rate-Limit,
 * Brevo-Double-Opt-in). `kind` wählt die Ziel-Liste:
 *   - "public" → öffentlicher Newsletter (Liste 7)
 *   - "member" → versteckter Mitglieder-Newsletter (Liste 12)
 * Brevo verschickt die Bestätigungsmail; der Kontakt landet erst nach dem Klick.
 */
async function handleSubscribe(
  kind: NewsletterKind,
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
  const key = `${kind}:${ip}:${email}`;
  const now = Date.now();
  for (const [k, ts] of recent) if (now - ts > WINDOW_MS) recent.delete(k);
  if (recent.has(key)) {
    // Innerhalb des Fensters: still als Erfolg quittieren (keine Auskunft).
    return { status: "ok" };
  }
  recent.set(key, now);

  const redirectionUrl = `${BASE_URL}/newsletter/bestaetigt`;
  const result =
    kind === "member"
      ? await subscribeMemberNewsletterDoi(email, { firstName, redirectionUrl })
      : await subscribeNewsletterDoi(email, { firstName, redirectionUrl });

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
      what: `${kind === "member" ? "Mitglieder-" : ""}Newsletter-Anmeldung (Double-Opt-in angestoßen) für ${email}`,
    });
  } catch {
    /* Log ist best effort */
  }

  return { status: "ok" };
}

/** Öffentliche Newsletter-Anmeldung (Liste 7). */
export async function subscribeNewsletter(
  _prev: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  return handleSubscribe("public", formData);
}

/** Versteckter Mitglieder-Newsletter (Liste 12) — nur über Direktlink erreichbar. */
export async function subscribeMemberNewsletter(
  _prev: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  return handleSubscribe("member", formData);
}
