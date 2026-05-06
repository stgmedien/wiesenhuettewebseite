"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { users, customers, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { sendMail } from "@/lib/mail/send";
import WelcomeEmail from "@/lib/mail/templates/welcome";

const baseUrl = () =>
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.xn--wiesenhtte-geb.com";

const signupSchema = z
  .object({
    firstName: z.string().min(1).max(120),
    lastName: z.string().min(1).max(120),
    email: z.string().email().max(255),
    password: z.string().min(8).max(200),
    passwordConfirm: z.string(),
    phone: z.string().max(60).optional().nullable(),
    isMember: z.literal("on").optional(),
    memberId: z.string().max(60).optional().nullable(),
    acceptTerms: z.literal("on"),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Passwörter stimmen nicht überein.",
    path: ["passwordConfirm"],
  });

export type SignupResult =
  | { ok: true }
  | { ok: false; error: string; field?: string };

export async function signupAction(formData: FormData): Promise<SignupResult | void> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      error: first?.message ?? "Bitte alle Felder korrekt ausfüllen.",
      field: typeof first?.path?.[0] === "string" ? first.path[0] : undefined,
    };
  }

  const data = parsed.data;
  const email = data.email.toLowerCase().trim();

  // Account-Konflikt prüfen
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) {
    return {
      ok: false,
      error:
        "Mit dieser E-Mail existiert bereits ein Konto. Bitte log Dich ein oder fordere einen Magic-Link an.",
      field: "email",
    };
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const inserted = await db
    .insert(users)
    .values({
      email,
      name: `${data.firstName} ${data.lastName}`.trim(),
      passwordHash,
      role: "customer",
      // emailVerified bewusst NICHT gesetzt — Verifizierung beim ersten Login per
      // Magic-Link oder via separatem Verify-Flow möglich.
    })
    .returning({ id: users.id });

  const userId = inserted[0].id;

  // Linked Customer-Datensatz anlegen
  const isClaimingMembership = data.isMember === "on";
  await db.insert(customers).values({
    userId,
    type: isClaimingMembership ? "mitglied" : "privat",
    firstName: data.firstName,
    lastName: data.lastName,
    email,
    phone: data.phone || null,
    memberId: isClaimingMembership ? data.memberId || null : null,
    membershipStatus: isClaimingMembership ? "pending" : "none",
  });

  await db.insert(activityLog).values({
    who: email,
    what: isClaimingMembership
      ? "Kunden-Konto registriert (Mitgliedschaft beantragt — Verifizierung steht aus)"
      : "Kunden-Konto registriert",
  });

  // Welcome-Mail (best-effort, blockt nicht den Sign-up bei Mail-Fehler)
  try {
    await sendMail({
      to: email,
      subject: "Willkommen bei der Wiesenhütte",
      template: "welcome",
      react: WelcomeEmail({
        firstName: data.firstName,
        email,
        membershipPending: isClaimingMembership,
        loginUrl: `${baseUrl()}/konto`,
      }),
    });
  } catch (err) {
    console.error("[welcome-mail] failed (non-blocking):", err);
  }

  // Auto-Login per Credentials-Provider
  try {
    await signIn("credentials", {
      email,
      password: data.password,
      redirect: false,
    });
  } catch {
    // Login-Fehler sollten hier nicht auftreten — User wurde gerade angelegt.
  }
  redirect("/konto?welcome=1");
}
