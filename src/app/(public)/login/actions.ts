"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { users, customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { createMagicLinkToken } from "@/lib/magic-link";
import { sendMail } from "@/lib/mail/send";
import MagicLinkEmail from "@/lib/mail/templates/magic-link";

const emailSchema = z.string().email().max(255);

const baseUrl = () =>
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.wiesenhuette.de";

// =============================================================
// MAGIC LINK
// =============================================================

export type MagicResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Anti-Enumeration: Wir verraten NICHT, ob die E-Mail existiert.
 * Wir antworten immer mit "ok: true", senden aber nur, wenn ein User-/Customer-
 * Datensatz vorliegt. Sonst wird die Mail verworfen — bekämpft Account-Discovery.
 */
export async function requestMagicLinkAction(formData: FormData): Promise<MagicResult> {
  const raw = formData.get("email");
  const parsed = emailSchema.safeParse(typeof raw === "string" ? raw.trim() : raw);
  if (!parsed.success) {
    return { ok: false, error: "Bitte eine gültige E-Mail-Adresse eingeben." };
  }
  const email = parsed.data.toLowerCase();

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;

  const tokenRes = await createMagicLinkToken(email, ip);

  if ("rateLimited" in tokenRes) {
    return {
      ok: false,
      error: "Zu viele Login-Anfragen für diese E-Mail. Bitte in einer Stunde erneut versuchen.",
    };
  }

  // Check if a user OR a customer with this email exists
  const userRow = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const customerRow = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
  const exists = !!userRow[0] || !!customerRow[0];

  if (exists) {
    const url = `${baseUrl()}/auth/magic?token=${encodeURIComponent(tokenRes.token)}`;
    try {
      await sendMail({
        to: email,
        subject: "Dein Login-Link für die Wiesenhütte",
        template: "magic_link",
        react: MagicLinkEmail({ url, expiresMinutes: 15 }),
      });
    } catch (err) {
      console.error("[magic-link] mail failed:", err);
      return { ok: false, error: "Mail-Versand fehlgeschlagen. Bitte später erneut versuchen." };
    }
  } else {
    // Bekannte Anti-Enumeration-Verzögerung, damit "existiert" und "existiert nicht"
    // nicht über Reaktionszeit unterscheidbar sind.
    await new Promise((r) => setTimeout(r, 600));
  }

  return { ok: true };
}

// =============================================================
// PASSWORD LOGIN — Customer
// =============================================================

const passwordSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export async function passwordLoginAction(formData: FormData): Promise<{ ok: false; error: string } | void> {
  const parsed = passwordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe." };

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirect: false,
    });
  } catch {
    return { ok: false, error: "E-Mail oder Passwort falsch." };
  }
  redirect("/konto");
}
