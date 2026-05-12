import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, activityLog, loginAttempts } from "@/lib/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { verifyTotp, consumeBackupCode } from "@/lib/totp";
import { consumeMagicLinkToken } from "@/lib/magic-link";

/**
 * Login-Throttle: blockt Authorize, wenn > 10 fehlgeschlagene Login-Versuche
 * für (email, kind) in den letzten 15 min vorliegen. IP wird zusätzlich
 * geloggt, aber als Trigger-Kriterium reicht Email (verhindert auch
 * verteilte Brute-Force über Bot-Netze gegen einen einzelnen Account).
 */
const LOGIN_WINDOW_MS = 15 * 60_000;
const LOGIN_MAX_FAILS = 10;

async function isLoginRateLimited(email: string, kind: string): Promise<boolean> {
  const since = new Date(Date.now() - LOGIN_WINDOW_MS);
  const fails = await db
    .select({ id: loginAttempts.id })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.email, email),
        eq(loginAttempts.kind, kind),
        eq(loginAttempts.success, false),
        gt(loginAttempts.at, since)
      )
    )
    .limit(LOGIN_MAX_FAILS + 1);
  return fails.length >= LOGIN_MAX_FAILS;
}

async function logLoginAttempt(
  email: string,
  kind: string,
  success: boolean
): Promise<void> {
  try {
    await db.insert(loginAttempts).values({ email, kind, success });
  } catch (err) {
    console.error("[login-throttle] log failed:", err);
  }
}

class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totp: z.string().optional(),
});

/** Custom error codes the login form interprets to show extra fields. */
class TotpRequiredError extends CredentialsSignin {
  code = "totp_required";
}
class TotpInvalidError extends CredentialsSignin {
  code = "totp_invalid";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/m/login",
  },
  providers: [
    // ---------------------------------------------------------------
    // CUSTOMER MAGIC LINK — passwordless Login per Email
    // ---------------------------------------------------------------
    Credentials({
      id: "magic",
      name: "Magic Link",
      credentials: { token: { label: "Token", type: "text" } },
      authorize: async (raw) => {
        const token = (raw?.token ?? "").toString().trim();
        if (!token) return null;
        const result = await consumeMagicLinkToken(token);
        if (!result.ok) return null;

        const userRow = await db
          .select()
          .from(users)
          .where(eq(users.id, result.userId))
          .limit(1);
        const u = userRow[0];
        if (!u) return null;
        if (u.deletedAt) {
          // Soft-deleted User: kein Login (auch nicht via Magic-Link).
          await logLoginAttempt(u.email, "magic", false);
          return null;
        }

        await db
          .update(users)
          .set({ lastLoginAt: new Date(), updatedAt: new Date() })
          .where(eq(users.id, u.id));

        await db.insert(activityLog).values({
          who: u.email,
          what: result.isNewUser
            ? "Kunden-Konto via Magic Link angelegt"
            : "Login via Magic Link",
        });

        return {
          id: u.id,
          email: u.email,
          name: u.name ?? u.email,
          role: u.role,
          mustChangePassword: false,
          twoFactorEnabled: false,
        };
      },
    }),

    // ---------------------------------------------------------------
    // PASSWORD LOGIN — Manager/Admin (mit optionalem TOTP)
    // ---------------------------------------------------------------
    Credentials({
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
        totp: { label: "2FA-Code", type: "text" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password, totp } = parsed.data;
        const lowerEmail = email.toLowerCase();

        // Rate-Limit gegen Brute-Force: > 10 fails in 15 min für (email, password) blockt.
        if (await isLoginRateLimited(lowerEmail, "password")) {
          throw new RateLimitedError();
        }

        const found = await db
          .select()
          .from(users)
          .where(eq(users.email, lowerEmail))
          .limit(1);

        const user = found[0];
        if (!user || !user.passwordHash) {
          await logLoginAttempt(lowerEmail, "password", false);
          return null;
        }
        if (user.deletedAt) {
          // Soft-deleted: kein Login möglich.
          await logLoginAttempt(lowerEmail, "password", false);
          return null;
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          await logLoginAttempt(lowerEmail, "password", false);
          return null;
        }

        // 2FA gate (nur Manager/Admin können 2FA aktiviert haben)
        if (user.twoFactorEnabled) {
          if (!totp || totp.trim().length === 0) {
            // Passwort war korrekt — keinen Fail loggen (sonst Brute-Force-Detektion auf legitimes 2FA-Prompting)
            throw new TotpRequiredError();
          }

          // Eigene Rate-Limit auf TOTP-Versuche
          if (await isLoginRateLimited(lowerEmail, "totp")) {
            throw new RateLimitedError();
          }

          const cleaned = totp.trim();
          let totpOk = false;

          if (user.twoFactorSecret) {
            totpOk = verifyTotp(cleaned, user.twoFactorSecret);
          }

          // Fallback: try as backup code
          if (!totpOk && user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
            const remaining = await consumeBackupCode(cleaned, user.twoFactorBackupCodes);
            if (remaining !== null) {
              await db
                .update(users)
                .set({ twoFactorBackupCodes: remaining, updatedAt: new Date() })
                .where(eq(users.id, user.id));
              await db.insert(activityLog).values({
                who: user.email,
                what: `Login mit 2FA-Backup-Code (${remaining.length} Codes verbleiben)`,
              });
              totpOk = true;
            }
          }

          if (!totpOk) {
            await logLoginAttempt(lowerEmail, "totp", false);
            throw new TotpInvalidError();
          }
          await logLoginAttempt(lowerEmail, "totp", true);
        }

        // Login erfolgreich — Audit
        await logLoginAttempt(lowerEmail, "password", true);
        await db
          .update(users)
          .set({ lastLoginAt: new Date(), updatedAt: new Date() })
          .where(eq(users.id, user.id));

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          twoFactorEnabled: user.twoFactorEnabled,
          mustEnable2FA: user.mustEnable2FA,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        const u = user as {
          id?: string;
          role?: string;
          mustChangePassword?: boolean;
          twoFactorEnabled?: boolean;
          mustEnable2FA?: boolean;
        };
        token.id = u.id;
        token.role = u.role;
        token.mustChangePassword = u.mustChangePassword ?? false;
        token.twoFactorEnabled = u.twoFactorEnabled ?? false;
        token.mustEnable2FA = u.mustEnable2FA ?? false;
      }

      // When a session is updated (e.g. after Passwort-Wechsel), rerefresh from DB
      if (trigger === "update" && token.id) {
        const fresh = await db
          .select({
            mustChangePassword: users.mustChangePassword,
            twoFactorEnabled: users.twoFactorEnabled,
            mustEnable2FA: users.mustEnable2FA,
            role: users.role,
            email: users.email,
            name: users.name,
          })
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);
        if (fresh[0]) {
          token.mustChangePassword = fresh[0].mustChangePassword;
          token.twoFactorEnabled = fresh[0].twoFactorEnabled;
          token.mustEnable2FA = fresh[0].mustEnable2FA;
          token.role = fresh[0].role;
          token.email = fresh[0].email;
          token.name = fresh[0].name ?? undefined;
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        const u = session.user as {
          id?: string;
          role?: string;
          mustChangePassword?: boolean;
          twoFactorEnabled?: boolean;
          mustEnable2FA?: boolean;
        };
        u.id = token.id as string | undefined;
        u.role = token.role as string | undefined;
        u.mustChangePassword = (token.mustChangePassword as boolean | undefined) ?? false;
        u.twoFactorEnabled = (token.twoFactorEnabled as boolean | undefined) ?? false;
        u.mustEnable2FA = (token.mustEnable2FA as boolean | undefined) ?? false;
      }
      return session;
    },
    authorized: ({ auth, request: { nextUrl } }) => {
      const isManagerArea = nextUrl.pathname.startsWith("/m");
      const isLogin = nextUrl.pathname === "/m/login";
      if (isManagerArea && !isLogin) {
        return !!auth;
      }
      return true;
    },
    /**
     * Open-Redirect-Schutz: NextAuth's default akzeptiert Same-Origin-URLs,
     * aber wir erzwingen es explizit. Relative Pfade (/foo) → prefixed mit baseUrl.
     * Absolute URLs werden nur akzeptiert wenn Origin matches.
     * Protocol-relative (//evil.com) und externe URLs → fallback auf baseUrl.
     */
    redirect: async ({ url, baseUrl }) => {
      if (url.startsWith("/") && !url.startsWith("//")) return `${baseUrl}${url}`;
      try {
        const parsed = new URL(url);
        if (parsed.origin === baseUrl) return url;
      } catch {
        // ungültige URL → fallback
      }
      return baseUrl;
    },
  },
});
