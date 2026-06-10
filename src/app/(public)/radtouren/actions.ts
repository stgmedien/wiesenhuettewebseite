"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { and, eq, isNull, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { rideInterests } from "@/lib/db/schema-rad";
import { upcomingWeekends, formatSlotLabel } from "@/lib/rad";
import { sendMail } from "@/lib/mail/send";
import RadVerifyEmail from "@/lib/mail/templates/rad-verify";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.de";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate-Limit analog zu magic-link.ts / community: max. Einträge je E-Mail/Stunde.
const RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

/**
 * Interesse an gemeinsamen Rad-Wochenenden eintragen.
 * Double-Opt-in: Eintrag zählt erst nach Klick auf den Bestätigungslink.
 */
export async function submitRideInterest(formData: FormData) {
  // Honeypot: Bots füllen unsichtbare Felder aus. Stilles OK (kein Hinweis).
  if (String(formData.get("website") ?? "").trim() !== "") {
    redirect("/radtouren?status=mail#mitmachen");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim().slice(0, 120) || null;
  const lunch = formData.get("lunch") === "on";
  const consent = formData.get("consent") === "on";
  const rawSlots = formData.getAll("slots").map(String);

  const valid = new Set(upcomingWeekends().map((s) => s.id));
  const chosen = [...new Set(rawSlots)].filter((s) => valid.has(s));

  // varchar(255)-Spalte: überlange (aber formatgültige) Adressen abweisen,
  // bevor sie zu einem ungefangenen DB-Fehler führen.
  if (!EMAIL_RE.test(email) || email.length > 255 || chosen.length === 0 || !consent) {
    redirect("/radtouren?status=fehler#mitmachen");
  }

  // Rate-Limit (analog magic-link.ts / community-Form): max. 5 Einträge je
  // E-Mail/Stunde — verhindert Mail-Bombing über eine fremde Adresse.
  const windowStart = new Date(Date.now() - RATE_WINDOW_MS);
  const recent = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(rideInterests)
    .where(and(eq(rideInterests.email, email), gte(rideInterests.createdAt, windowStart)));
  if ((recent[0]?.n ?? 0) >= MAX_PER_WINDOW) {
    // Still als Erfolg quittieren — keine Auskunft, ob die Adresse existiert.
    redirect("/radtouren?status=mail#mitmachen");
  }

  // Unbestätigte Alt-Einträge derselben Adresse ersetzen (kein Token-Stapel).
  await db
    .delete(rideInterests)
    .where(and(eq(rideInterests.email, email), isNull(rideInterests.verifiedAt)));

  const token = randomBytes(24).toString("hex");
  await db.insert(rideInterests).values({
    email,
    name,
    slots: chosen,
    lunch,
    verifyToken: token,
  });

  const slotLabels = upcomingWeekends()
    .filter((s) => chosen.includes(s.id))
    .map((s) => formatSlotLabel(s, "de"));

  let mailOk = true;
  try {
    await sendMail({
      to: email,
      subject: "Bitte bestätigen: Dein Radtouren-Interesse an der Wiesenhütte",
      template: "rad-verify",
      react: RadVerifyEmail({
        name,
        slotLabels,
        verifyUrl: `${BASE_URL}/radtouren/bestaetigen?token=${token}`,
      }),
    });
  } catch (e) {
    console.error("[radtouren] verify mail failed", e);
    mailOk = false;
  }

  redirect(mailOk ? "/radtouren?status=mail#mitmachen" : "/radtouren?status=mailfehler#mitmachen");
}

/**
 * Double-Opt-in bestätigen — bewusst als POST (Button), nicht als
 * GET-Seiteneffekt: Mail-Scanner/Prefetcher folgen GET-Links automatisch und
 * würden sonst ohne menschliche Interaktion bestätigen.
 */
export async function confirmRideInterest(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (token.length >= 32 && token.length <= 64) {
    await db
      .update(rideInterests)
      .set({ verifiedAt: new Date() })
      .where(eq(rideInterests.verifyToken, token));
  }
  redirect(`/radtouren/bestaetigen?token=${encodeURIComponent(token)}&done=1`);
}
