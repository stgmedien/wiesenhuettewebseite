import { db } from "@/lib/db";
import { magicLinkTokens, users } from "@/lib/db/schema";
import { eq, and, gt, lt } from "drizzle-orm";
import crypto from "crypto";

const TOKEN_BYTES = 32;
const TOKEN_TTL_MINUTES = 15;
const REQUESTS_PER_HOUR = 5;          // Rate-Limit pro E-Mail
const ONE_HOUR_MS = 60 * 60 * 1000;

export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export const generateToken = (): string =>
  crypto.randomBytes(TOKEN_BYTES).toString("base64url");

/**
 * Erzeugt einen neuen Magic-Link-Token, speichert den Hash in der DB und
 * gibt das Klartext-Token zurück. Ruft NICHT die Mail-Versand-Funktion auf —
 * das macht der Caller, weil er die URL/Subject/Locale steuert.
 *
 * Rate-Limit: max. 5 Anfragen pro E-Mail pro Stunde.
 */
export const createMagicLinkToken = async (
  email: string,
  requestIp?: string
): Promise<{ token: string; expiresAt: Date } | { rateLimited: true }> => {
  const lower = email.toLowerCase().trim();
  const since = new Date(Date.now() - ONE_HOUR_MS);

  // Rate-Limit-Check
  const recent = await db
    .select({ id: magicLinkTokens.id })
    .from(magicLinkTokens)
    .where(and(eq(magicLinkTokens.email, lower), gt(magicLinkTokens.createdAt, since)));

  if (recent.length >= REQUESTS_PER_HOUR) {
    return { rateLimited: true };
  }

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await db.insert(magicLinkTokens).values({
    email: lower,
    tokenHash,
    expiresAt,
    requestIp,
  });

  return { token, expiresAt };
};

export type MagicLinkConsumeResult =
  | { ok: true; userId: string; email: string; isNewUser: boolean }
  | { ok: false; reason: "invalid" | "expired" | "consumed" };

/**
 * Verbraucht einen Magic-Link-Token: validiert, markiert als consumed,
 * legt User bei Bedarf an (Customer-Default-Rolle) und gibt User-Info zurück.
 */
export const consumeMagicLinkToken = async (
  token: string
): Promise<MagicLinkConsumeResult> => {
  if (!token || typeof token !== "string") return { ok: false, reason: "invalid" };
  const tokenHash = hashToken(token);

  const found = await db
    .select()
    .from(magicLinkTokens)
    .where(eq(magicLinkTokens.tokenHash, tokenHash))
    .limit(1);

  const tk = found[0];
  if (!tk) return { ok: false, reason: "invalid" };
  if (tk.consumedAt) return { ok: false, reason: "consumed" };
  if (tk.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };

  // Mark consumed
  await db
    .update(magicLinkTokens)
    .set({ consumedAt: new Date() })
    .where(eq(magicLinkTokens.id, tk.id));

  // Find or auto-create user (Customer-Rolle)
  const userRow = await db.select().from(users).where(eq(users.email, tk.email)).limit(1);
  let user = userRow[0];
  let isNewUser = false;
  if (!user) {
    const ins = await db
      .insert(users)
      .values({
        email: tk.email,
        role: "customer",
        emailVerified: new Date(),
      })
      .returning();
    user = ins[0];
    isNewUser = true;
  } else if (!user.emailVerified) {
    await db
      .update(users)
      .set({ emailVerified: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));
  }

  return { ok: true, userId: user.id, email: user.email, isNewUser };
};

/**
 * Aufräumarbeit (kann von einem Cron getriggert werden) — entfernt
 * abgelaufene Tokens älter als 24h.
 */
export const cleanupExpiredMagicLinkTokens = async (): Promise<void> => {
  const cutoff = new Date(Date.now() - 24 * ONE_HOUR_MS);
  await db.delete(magicLinkTokens).where(lt(magicLinkTokens.expiresAt, cutoff));
};
