"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq, and, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, activityLog, emailChangeRequests } from "@/lib/db/schema";
import { auth, signOut } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendMail } from "@/lib/mail/send";
import EmailVerificationEmail from "@/lib/mail/templates/email-verification";
import TwoFactorEnabledEmail from "@/lib/mail/templates/two-factor-enabled";
import { generateEmailChangeToken, hashToken } from "@/lib/email-change";
import {
  buildOtpAuthUri,
  generateBackupCodes,
  generateTotpSecret,
  verifyTotp,
} from "@/lib/totp";

type SessionLike = { user?: { id?: string; email?: string | null; name?: string | null; role?: string } | null } | null;

const requireSelf = async (): Promise<{ id: string; email: string; name: string; role: string }> => {
  const session = (await auth()) as SessionLike;
  const id = session?.user?.id;
  if (!id) throw new Error("Unauthorized");
  const found = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!found[0]) throw new Error("User not found");
  return {
    id: found[0].id,
    email: found[0].email,
    name: found[0].name ?? found[0].email,
    role: found[0].role,
  };
};

// =============================================================
// Update name
// =============================================================

export async function updateMyName(name: string): Promise<{ ok: boolean; error?: string }> {
  const me = await requireSelf();
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 255)
    return { ok: false, error: "Name muss 1–255 Zeichen haben." };

  await db.update(users).set({ name: trimmed, updatedAt: new Date() }).where(eq(users.id, me.id));
  await db.insert(activityLog).values({ who: me.email, what: `Name geändert: ${me.name} → ${trimmed}` });

  revalidatePath("/m/profil");
  return { ok: true };
}

// =============================================================
// Change password (mit altem Passwort als Bestätigung)
// =============================================================

const pwSchema = z.object({
  current: z.string().min(1),
  next: z
    .string()
    .min(10, "Mindestens 10 Zeichen.")
    .max(128)
    .regex(/[A-Za-z]/, "Mindestens ein Buchstabe.")
    .regex(/[0-9]/, "Mindestens eine Ziffer."),
});

export async function changeMyPassword(
  raw: z.infer<typeof pwSchema>
): Promise<{ ok: boolean; error?: string }> {
  const me = await requireSelf();
  const parsed = pwSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Neues Passwort: mind. 8 Zeichen." };

  const found = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  if (!found[0]?.passwordHash) return { ok: false, error: "Account hat keinen Passwort-Hash." };
  const ok = await bcrypt.compare(parsed.data.current, found[0].passwordHash);
  if (!ok) return { ok: false, error: "Aktuelles Passwort stimmt nicht." };

  const newHash = await bcrypt.hash(parsed.data.next, 12);
  await db
    .update(users)
    .set({ passwordHash: newHash, mustChangePassword: false, updatedAt: new Date() })
    .where(eq(users.id, me.id));

  await db.insert(activityLog).values({ who: me.email, what: `Eigenes Passwort geändert` });
  revalidatePath("/m/profil");
  return { ok: true };
}

// =============================================================
// Request email change → schickt Verifizierungs-Mail an neue Adresse
// =============================================================

const emailChangeSchema = z.object({
  newEmail: z.string().email(),
  password: z.string().min(1),
});

export async function requestEmailChange(
  raw: z.infer<typeof emailChangeSchema>
): Promise<{ ok: boolean; error?: string }> {
  const me = await requireSelf();
  const parsed = emailChangeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Ungültige E-Mail oder Passwort fehlt." };

  const newEmail = parsed.data.newEmail.toLowerCase().trim();
  if (newEmail === me.email.toLowerCase())
    return { ok: false, error: "Neue Adresse ist identisch mit der bisherigen." };

  // Re-auth via password
  const found = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  if (!found[0]?.passwordHash) return { ok: false, error: "Account-Fehler." };
  const ok = await bcrypt.compare(parsed.data.password, found[0].passwordHash);
  if (!ok) return { ok: false, error: "Aktuelles Passwort stimmt nicht." };

  // Doppelung verhindern: ist die neue Mail schon vergeben?
  const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, newEmail)).limit(1);
  if (existingUser[0]) return { ok: false, error: "Diese E-Mail ist bereits einem Account zugeordnet." };

  // Frühere offene Anfragen invalidieren
  await db
    .update(emailChangeRequests)
    .set({ consumedAt: new Date() })
    .where(and(eq(emailChangeRequests.userId, me.id), isNull(emailChangeRequests.consumedAt)));

  const token = generateEmailChangeToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const inserted = await db
    .insert(emailChangeRequests)
    .values({ userId: me.id, newEmail, tokenHash, expiresAt })
    .returning({ id: emailChangeRequests.id });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.vercel.app";
  const verifyUrl = `${baseUrl}/m/profil/verify-email?id=${inserted[0].id}&token=${token}`;

  try {
    await sendMail({
      to: newEmail,
      subject: "Bitte E-Mail-Wechsel bestätigen",
      template: "email-verification",
      react: EmailVerificationEmail({
        name: me.name,
        oldEmail: me.email,
        newEmail,
        verifyUrl,
        expiresInHours: 24,
      }),
    });
  } catch (err) {
    console.error("[profil/email-change] mail failed", err);
    return { ok: false, error: "Verifizierungs-Mail konnte nicht versendet werden." };
  }

  await db.insert(activityLog).values({
    who: me.email,
    what: `E-Mail-Wechsel angefordert: ${me.email} → ${newEmail} (Verifizierung ausstehend)`,
  });
  revalidatePath("/m/profil");
  return { ok: true };
}

// =============================================================
// 2FA — Setup-Flow: Schritt 1 Geheimnis erzeugen, Schritt 2 verifizieren
// =============================================================

export type TwoFactorSetupResult = {
  ok: boolean;
  secret?: string;
  otpAuthUri?: string;
  error?: string;
};

export async function startTwoFactorSetup(): Promise<TwoFactorSetupResult> {
  const me = await requireSelf();
  // Frischer Secret bei jedem Setup-Versuch
  const secret = generateTotpSecret();
  const otpAuthUri = buildOtpAuthUri(secret, me.email);
  // Vorläufig speichern, aber NICHT enabled — erst nach Bestätigung
  await db
    .update(users)
    .set({ twoFactorSecret: secret, twoFactorEnabled: false, updatedAt: new Date() })
    .where(eq(users.id, me.id));
  return { ok: true, secret, otpAuthUri };
}

const confirmSchema = z.object({ code: z.string().min(6).max(8) });

export async function confirmTwoFactorSetup(
  raw: z.infer<typeof confirmSchema>
): Promise<{ ok: boolean; backupCodes?: string[]; error?: string }> {
  const me = await requireSelf();
  const parsed = confirmSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Code ungültig." };

  const found = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  if (!found[0]?.twoFactorSecret) return { ok: false, error: "Kein 2FA-Setup-Versuch gestartet." };
  if (!verifyTotp(parsed.data.code, found[0].twoFactorSecret))
    return { ok: false, error: "Code falsch oder abgelaufen — bitte den aktuellen Code erneut eingeben." };

  const { plain, hashed } = await generateBackupCodes(10);
  await db
    .update(users)
    .set({
      twoFactorEnabled: true,
      twoFactorBackupCodes: hashed,
      mustEnable2FA: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, me.id));

  await db.insert(activityLog).values({ who: me.email, what: `2FA aktiviert` });

  try {
    await sendMail({
      to: me.email,
      subject: "Zwei-Faktor-Authentifizierung aktiviert",
      template: "2fa-enabled",
      react: TwoFactorEnabledEmail({ name: me.name, email: me.email }),
    });
  } catch (err) {
    console.error("[profil/2fa] confirmation mail failed", err);
  }

  revalidatePath("/m/profil");
  return { ok: true, backupCodes: plain };
}

const disableSchema = z.object({ password: z.string().min(1), code: z.string().min(6).max(8) });

export async function disableTwoFactor(
  raw: z.infer<typeof disableSchema>
): Promise<{ ok: boolean; error?: string }> {
  const me = await requireSelf();
  const parsed = disableSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe." };

  const found = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  if (!found[0]?.passwordHash || !found[0]?.twoFactorSecret)
    return { ok: false, error: "Account-Fehler." };

  const pwOk = await bcrypt.compare(parsed.data.password, found[0].passwordHash);
  if (!pwOk) return { ok: false, error: "Passwort falsch." };
  if (!verifyTotp(parsed.data.code, found[0].twoFactorSecret))
    return { ok: false, error: "2FA-Code falsch." };

  await db
    .update(users)
    .set({
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, me.id));

  await db.insert(activityLog).values({ who: me.email, what: `2FA deaktiviert` });
  revalidatePath("/m/profil");
  return { ok: true };
}

// =============================================================
// Email-Verifizierung beim Klick auf Link
// =============================================================

export async function verifyEmailChange(
  id: string,
  token: string
): Promise<{ ok: boolean; newEmail?: string; error?: string }> {
  if (!id || !token) return { ok: false, error: "Token fehlt." };

  const rows = await db
    .select()
    .from(emailChangeRequests)
    .where(and(eq(emailChangeRequests.id, id), gt(emailChangeRequests.expiresAt, new Date()), isNull(emailChangeRequests.consumedAt)))
    .limit(1);
  const req = rows[0];
  if (!req) return { ok: false, error: "Token ungültig oder abgelaufen. Bitte E-Mail-Wechsel erneut anfordern." };

  const ok = await (await import("bcryptjs")).default.compare(token, req.tokenHash);
  if (!ok) return { ok: false, error: "Token-Hash stimmt nicht — ungültiger Link." };

  // Race-condition: prüfen ob neue Mail nicht zwischenzeitlich von jemand anderem belegt wurde
  const conflict = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, req.newEmail))
    .limit(1);
  if (conflict[0]) return { ok: false, error: "Diese E-Mail wurde inzwischen vergeben." };

  // Apply
  const userRow = await db.select().from(users).where(eq(users.id, req.userId)).limit(1);
  const oldEmail = userRow[0]?.email ?? "?";

  await db
    .update(users)
    .set({ email: req.newEmail, emailVerified: new Date(), updatedAt: new Date() })
    .where(eq(users.id, req.userId));

  await db
    .update(emailChangeRequests)
    .set({ consumedAt: new Date() })
    .where(eq(emailChangeRequests.id, req.id));

  await db.insert(activityLog).values({
    who: req.newEmail,
    what: `E-Mail-Wechsel bestätigt: ${oldEmail} → ${req.newEmail}`,
  });

  return { ok: true, newEmail: req.newEmail };
}

export async function logoutAndForceRelogin(): Promise<void> {
  await signOut({ redirectTo: "/m/login" });
}
