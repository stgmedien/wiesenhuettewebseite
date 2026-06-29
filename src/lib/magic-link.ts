import { db } from "@/lib/db";
import { customers, magicLinkTokens, users } from "@/lib/db/schema";
import { eq, and, gt, lt, isNull } from "drizzle-orm";
import { promoteToMemberRole } from "@/lib/membership-role";

// Web-Crypto-API statt Node-`crypto` — funktioniert in Edge-Runtime UND
// Node.js. Magic-Link wird ueber auth.ts vom middleware.ts (Edge) gepulled,
// daher darf hier kein Node-only-Modul vorkommen.

const TOKEN_BYTES = 32;
const TOKEN_TTL_MINUTES = 15;
const REQUESTS_PER_HOUR = 5;          // Rate-Limit pro E-Mail
const ONE_HOUR_MS = 60 * 60 * 1000;

const textEncoder = new TextEncoder();

const bufferToHex = (buf: ArrayBuffer): string =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const bytesToBase64Url = (bytes: Uint8Array): string => {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  // btoa ist in beiden Runtimes verfuegbar
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const hashToken = async (token: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(token));
  return bufferToHex(digest);
};

export const generateToken = (): string => {
  const bytes = new Uint8Array(TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
};

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
  const tokenHash = await hashToken(token);
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
  const tokenHash = await hashToken(token);

  // Atomares Conditional Update: nur erfolgreich wenn Token existiert,
  // noch nicht consumed UND noch nicht expired. Verhindert die Race-Condition
  // zwischen Check und Update bei parallelen Requests.
  const updated = await db
    .update(magicLinkTokens)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(magicLinkTokens.tokenHash, tokenHash),
        isNull(magicLinkTokens.consumedAt),
        gt(magicLinkTokens.expiresAt, new Date())
      )
    )
    .returning();

  if (updated.length === 0) {
    // Disambiguation NUR für UX, race-frei: Consumption ist schon passiert (oder nicht).
    const probe = await db
      .select()
      .from(magicLinkTokens)
      .where(eq(magicLinkTokens.tokenHash, tokenHash))
      .limit(1);
    const tk = probe[0];
    if (!tk) return { ok: false, reason: "invalid" };
    if (tk.consumedAt) return { ok: false, reason: "consumed" };
    return { ok: false, reason: "expired" };
  }
  const tk = updated[0];

  // Find or auto-create user (Customer-Rolle)
  const userRow = await db.select().from(users).where(eq(users.email, tk.email)).limit(1);
  let user = userRow[0];
  let isNewUser = false;
  if (user?.deletedAt) {
    // Soft-deleted User darf sich nicht einloggen — Token als "invalid" zurückweisen.
    return { ok: false, reason: "invalid" };
  }
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

  // Unverknüpfte Customer-Datensätze derselben Adresse an den User hängen.
  // Wichtig u. a. für Online-Beitritte und Gast-Buchungen ohne Konto:
  // getBookingPrefill() löst Mitgliederpreise NUR über customers.userId auf —
  // der Magic-Link-Klick ist der Besitz-Beweis für die Adresse.
  await db
    .update(customers)
    .set({ userId: user.id })
    .where(and(eq(customers.email, tk.email), isNull(customers.userId)));

  // Verifizierte Mitglieder bekommen die Rolle "member" (Anzeige "Mitglied").
  // No-op für Nicht-Mitglieder und für Manager/Admin.
  await promoteToMemberRole(tk.email);

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
