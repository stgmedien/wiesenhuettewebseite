"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { customers, activityLog } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { createMagicLinkToken } from "@/lib/magic-link";
import { sendMail } from "@/lib/mail/send";
import MagicLinkEmail from "@/lib/mail/templates/magic-link";
import { brevoConfigured, isEmailInMembersList } from "@/lib/brevo";

const emailSchema = z.string().email().max(255);

const baseUrl = () =>
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.xn--wiesenhtte-geb.com";

export type ClaimResult =
  | { ok: true; status: "link_sent" } // in Brevo-Mitgliederliste → Login-Link gesendet
  | { ok: true; status: "not_member" } // nicht in der Mitgliederliste gefunden
  | { ok: false; error: string };

/**
 * „Mitglieds-Konto freischalten": Bestehende Vereinsmitglieder sind bereits in
 * der Brevo-Mitgliederliste hinterlegt. Statt eines kostenpflichtigen Beitritts
 * oder einer manuellen Vorstands-Freigabe gleichen wir die E-Mail mit Brevo ab
 * und legen — wenn Treffer — automatisch ein verifiziertes Mitglieds-Konto an.
 *
 * Sicherheit: Die Freischaltung wird per **Magic-Link an genau diese Adresse**
 * abgeschlossen (Klick = E-Mail-Besitz bewiesen, Auto-Login). So kann sich
 * niemand mit einer fremden Mitglieds-E-Mail den Halbpreis erschleichen.
 */
export async function claimMembershipAction(formData: FormData): Promise<ClaimResult> {
  const raw = formData.get("email");
  const parsed = emailSchema.safeParse(typeof raw === "string" ? raw.trim() : raw);
  if (!parsed.success) {
    return { ok: false, error: "Bitte eine gültige E-Mail-Adresse eingeben." };
  }
  const email = parsed.data.toLowerCase();

  // 0) EIGENE DB ZUERST: Wer bei uns bereits als verifiziertes Mitglied steht
  //    (Import, Vorstands-Verifizierung, Online-Beitritt), bekommt den
  //    Login-Link direkt — ganz ohne Brevo. Deckt Mitglieder ab, die (noch)
  //    nicht in der Brevo-Liste stehen, und macht die Freischaltung
  //    unabhängig von Brevo-Ausfällen.
  const dbVerified = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        eq(customers.email, email),
        eq(customers.membershipStatus, "verified"),
        eq(customers.type, "mitglied"),
      ),
    )
    .limit(1);

  if (!dbVerified[0]) {
    if (!brevoConfigured()) {
      return {
        ok: false,
        error:
          "Die automatische Prüfung ist gerade nicht möglich. Bitte versuch es später erneut oder schreib uns.",
      };
    }

    // 1) Fallback: steht die E-Mail in der Brevo-Mitgliederliste?
    const lookup = await isEmailInMembersList(email);
    if (!lookup.ok) {
      return {
        ok: false,
        error:
          "Die automatische Prüfung ist gerade nicht möglich. Bitte versuch es später erneut oder schreib uns.",
      };
    }
    if (!lookup.isMember) {
      return { ok: true, status: "not_member" };
    }

    // 2) Verifiziertes customers-Profil sicherstellen (anlegen oder hochstufen).
    //    Bereits verifizierte Zeilen bleiben unangetastet (Verifizierer-Info bleibt).
    const now = new Date();
    const verifiedBy = "Brevo-Abgleich (Konto-Freischaltung)";
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.email, email));

    if (existing.length > 0) {
      await db
        .update(customers)
        .set({
          type: "mitglied",
          membershipStatus: "verified",
          membershipVerifiedAt: now,
          membershipVerifiedBy: verifiedBy,
        })
        .where(and(eq(customers.email, email), ne(customers.membershipStatus, "verified")));
    } else {
      await db.insert(customers).values({
        type: "mitglied",
        firstName: lookup.firstName ?? "",
        lastName: lookup.lastName ?? "",
        email,
        membershipStatus: "verified",
        membershipVerifiedAt: now,
        membershipVerifiedBy: verifiedBy,
      });
    }
  }

  // 3) Magic-Link an die Mitglieds-Adresse — schließt die Freischaltung sicher ab.
  //    Beim Klick legt consumeMagicLinkToken den users-Eintrag an und verknüpft
  //    die (jetzt verifizierte) customers-Zeile → Halbpreis sofort buchbar.
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;
  const tokenRes = await createMagicLinkToken(email, ip);
  if ("rateLimited" in tokenRes) {
    return {
      ok: false,
      error: "Zu viele Anfragen für diese E-Mail. Bitte in einer Stunde erneut versuchen.",
    };
  }

  const url = `${baseUrl()}/auth/magic?token=${encodeURIComponent(tokenRes.token)}`;
  try {
    await sendMail({
      to: email,
      subject: "Dein Mitglieds-Konto bei der Wiesenhütte ist bereit",
      template: "magic_link",
      react: MagicLinkEmail({ url, expiresMinutes: 15 }),
    });
  } catch (err) {
    console.error("[mitglied-konto] mail failed:", err);
    return { ok: false, error: "Mail-Versand fehlgeschlagen. Bitte später erneut versuchen." };
  }

  await db.insert(activityLog).values({
    who: email,
    what: dbVerified[0]
      ? "Mitglieds-Konto freigeschaltet (bereits verifiziertes Mitglied in der DB) — Login-Link gesendet"
      : "Mitglieds-Konto per Brevo-Abgleich freigeschaltet — Login-Link gesendet",
  });

  return { ok: true, status: "link_sent" };
}
