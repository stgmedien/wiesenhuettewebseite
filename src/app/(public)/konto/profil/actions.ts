"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, customers, activityLog, emailChangeRequests } from "@/lib/db/schema";
import { auth, signOut } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendMail } from "@/lib/mail/send";
import EmailVerificationEmail from "@/lib/mail/templates/email-verification";
import { generateEmailChangeToken, hashToken } from "@/lib/email-change";

type SessionLike = {
  user?: { id?: string; email?: string | null; role?: string } | null;
} | null;

async function requireCustomer() {
  const session = (await auth()) as SessionLike;
  const id = session?.user?.id;
  if (!id) throw new Error("Nicht eingeloggt");

  const userRow = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!userRow[0]) throw new Error("User nicht gefunden");

  const customerRow = await db
    .select()
    .from(customers)
    .where(eq(customers.userId, id))
    .limit(1);
  return { user: userRow[0], customer: customerRow[0] ?? null };
}

const baseUrl = () =>
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.xn--wiesenhtte-geb.com";

// =============================================================
// Profil: Adresse / Telefon / Name
// =============================================================

const profileSchema = z.object({
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  phone: z.string().max(60).optional().nullable(),
  street: z.string().max(255).optional().nullable(),
  zip: z.string().max(20).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  country: z.string().max(60).optional().nullable(),
});

export async function updateProfile(formData: FormData) {
  const { user, customer } = await requireCustomer();
  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") || null,
    street: formData.get("street") || null,
    zip: formData.get("zip") || null,
    city: formData.get("city") || null,
    country: formData.get("country") || null,
  });
  if (!parsed.success) return { ok: false, error: "Bitte alle Pflichtfelder ausfüllen." };
  const data = parsed.data;

  const fullName = `${data.firstName} ${data.lastName}`.trim();
  await db.update(users).set({ name: fullName, updatedAt: new Date() }).where(eq(users.id, user.id));

  if (customer) {
    await db
      .update(customers)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        street: data.street,
        zip: data.zip,
        city: data.city,
        country: data.country ?? "DE",
      })
      .where(eq(customers.id, customer.id));
  } else {
    await db.insert(customers).values({
      userId: user.id,
      type: "privat",
      firstName: data.firstName,
      lastName: data.lastName,
      email: user.email,
      phone: data.phone,
      street: data.street,
      zip: data.zip,
      city: data.city,
      country: data.country ?? "DE",
    });
  }

  await db.insert(activityLog).values({ who: user.email, what: "Profil aktualisiert" });
  revalidatePath("/konto/profil");
  return { ok: true as const };
}

// =============================================================
// Passwort aendern
// =============================================================

const pwSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(200),
    newPasswordConfirm: z.string(),
  })
  .refine((d) => d.newPassword === d.newPasswordConfirm, {
    message: "Passwörter stimmen nicht überein.",
    path: ["newPasswordConfirm"],
  });

export async function changePassword(formData: FormData) {
  const { user } = await requireCustomer();
  const parsed = pwSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    newPasswordConfirm: formData.get("newPasswordConfirm"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  if (!user.passwordHash) {
    return {
      ok: false,
      error: "Du hast noch kein Passwort. Setze eines via 'Passwort vergessen'-Link.",
    };
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return { ok: false, error: "Aktuelles Passwort stimmt nicht." };

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await db.insert(activityLog).values({ who: user.email, what: "Passwort geändert (Konto)" });
  return { ok: true as const };
}

// =============================================================
// E-Mail aendern (Token-basierte Verifizierung)
// =============================================================

const emailSchema = z.object({
  newEmail: z.string().email().max(255),
  password: z.string().min(1),
});

export async function requestEmailChange(formData: FormData) {
  const { user } = await requireCustomer();
  const parsed = emailSchema.safeParse({
    newEmail: formData.get("newEmail"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: "Ungültige Eingaben." };
  const newEmail = parsed.data.newEmail.toLowerCase();

  if (newEmail === user.email)
    return { ok: false, error: "Das ist Deine aktuelle E-Mail-Adresse." };

  if (!user.passwordHash)
    return { ok: false, error: "Setze zuerst ein Passwort, dann kannst Du die Mail ändern." };

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return { ok: false, error: "Passwort stimmt nicht." };

  const conflict = await db.select().from(users).where(eq(users.email, newEmail)).limit(1);
  if (conflict[0])
    return { ok: false, error: "Mit dieser E-Mail existiert bereits ein Konto." };

  const token = generateEmailChangeToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
  const inserted = await db
    .insert(emailChangeRequests)
    .values({
      userId: user.id,
      newEmail,
      tokenHash,
      expiresAt,
    })
    .returning({ id: emailChangeRequests.id });
  const requestId = inserted[0].id;

  await sendMail({
    to: newEmail,
    subject: "Bestätige Deine neue E-Mail-Adresse",
    template: "email_verification",
    react: EmailVerificationEmail({
      name: user.name ?? user.email,
      oldEmail: user.email,
      newEmail,
      verifyUrl: `${baseUrl()}/verify-email?id=${requestId}&token=${encodeURIComponent(token)}`,
      expiresInHours: 1,
    }),
  });

  await db.insert(activityLog).values({
    who: user.email,
    what: `E-Mail-Wechsel beantragt: ${user.email} → ${newEmail}`,
  });

  return { ok: true as const };
}

// =============================================================
// Mitgliedschaft beantragen / zurueckziehen
// =============================================================

const membershipSchema = z.object({
  memberId: z.string().max(60).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
});

export async function requestMembership(formData: FormData) {
  const { user, customer } = await requireCustomer();
  if (!customer) {
    return {
      ok: false,
      error: "Bitte fülle erst Dein Profil (Adresse & Kontakt) aus.",
    };
  }

  const parsed = membershipSchema.safeParse({
    memberId: (formData.get("memberId") || "").toString().trim() || null,
    note: (formData.get("note") || "").toString().trim() || null,
  });
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe." };

  if (customer.membershipStatus === "verified") {
    return { ok: false, error: "Deine Mitgliedschaft ist bereits bestätigt." };
  }
  if (customer.membershipStatus === "pending") {
    return { ok: false, error: "Dein Antrag liegt bereits zur Prüfung vor." };
  }

  const noteSuffix = parsed.data.note
    ? `\n\nAntrags-Notiz vom Kunden: ${parsed.data.note}`
    : "";

  await db
    .update(customers)
    .set({
      membershipStatus: "pending",
      type: "mitglied",
      memberId: parsed.data.memberId ?? customer.memberId,
      // Reject-Felder zuruecksetzen, falls Re-Apply nach Ablehnung
      membershipRejectedReason: null,
      membershipVerifiedAt: null,
      membershipVerifiedBy: null,
      // Notiz an existing notes anhaengen
      notes: customer.notes ? customer.notes + noteSuffix : noteSuffix.trim() || null,
    })
    .where(eq(customers.id, customer.id));

  await db.insert(activityLog).values({
    who: user.email,
    what: `Mitgliedschaft beantragt vom Kunden${
      parsed.data.memberId ? ` (Mitgliedsnr. ${parsed.data.memberId})` : ""
    }`,
  });

  revalidatePath("/konto");
  revalidatePath("/konto/profil");
  revalidatePath("/m/mitgliedschaften");

  return { ok: true as const };
}

export async function withdrawMembershipRequest() {
  const { user, customer } = await requireCustomer();
  if (!customer) return { ok: false, error: "Kein Customer-Record." };

  if (customer.membershipStatus !== "pending") {
    return { ok: false, error: "Nur offene Anträge können zurückgezogen werden." };
  }

  await db
    .update(customers)
    .set({
      membershipStatus: "none",
      type: "privat",
      memberId: null,
    })
    .where(eq(customers.id, customer.id));

  await db.insert(activityLog).values({
    who: user.email,
    what: "Mitgliedschafts-Antrag vom Kunden zurückgezogen",
  });

  revalidatePath("/konto");
  revalidatePath("/konto/profil");
  revalidatePath("/m/mitgliedschaften");

  return { ok: true as const };
}

// =============================================================
// Konto loeschen — DSGVO Soft-Delete (30 Tage Frist)
// =============================================================

export async function softDeleteAccount(formData: FormData) {
  const { user, customer } = await requireCustomer();
  const reason = (formData.get("reason") ?? "").toString().trim() || null;

  await db
    .update(users)
    .set({
      deletedAt: new Date(),
      // E-Mail vorlaeufig invalidiert, damit kein Re-Login waehrend Frist
      email: `deleted+${user.id}@wiesenhuette.invalid`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Customer wird hier NUR markiert, damit Buchungen lesbar bleiben.
  // Echte Anonymisierung erfolgt nach 30 Tagen via Cron.
  if (customer) {
    await db
      .update(customers)
      .set({
        userId: null, // Trennung: Customer-Record bleibt fuer Buchungen,
        // ist aber nicht mehr mit User-Account verknuepft
      })
      .where(eq(customers.id, customer.id));
  }

  await db.insert(activityLog).values({
    who: user.email,
    what: `Konto-Loeschung beantragt${reason ? ` (Grund: ${reason})` : ""} — Hard-Delete in 30 Tagen`,
  });

  await signOut({ redirect: false });
}
