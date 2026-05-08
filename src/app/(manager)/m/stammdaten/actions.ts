"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { tariffs, extras, seasons, activityLog, membershipTiers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
  return session!.user!.email!;
}

// ---------- Tariffs ----------
const tariffUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  priceEuros: z.coerce.number().min(0).max(10000),
  minNights: z.coerce.number().int().min(1).max(30),
  active: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
});

export async function updateTariff(formData: FormData) {
  const me = await requireManager();
  const parsed = tariffUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    priceEuros: formData.get("priceEuros"),
    minNights: formData.get("minNights"),
    active: formData.get("active"),
  });
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe." };
  const cents = Math.round(parsed.data.priceEuros * 100);
  await db
    .update(tariffs)
    .set({
      name: parsed.data.name,
      priceCentsPerNight: cents,
      minNights: parsed.data.minNights,
      active: parsed.data.active,
      updatedAt: new Date(),
    })
    .where(eq(tariffs.id, parsed.data.id));
  await db.insert(activityLog).values({
    who: me,
    what: `Tarif geändert: ${parsed.data.name} → ${parsed.data.priceEuros.toFixed(2)} €/Nacht`,
  });
  revalidatePath("/m/stammdaten");
  return { ok: true as const };
}

// ---------- Extras ----------
const extraUpdateSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  unitEuros: z.coerce.number().min(0).max(10000),
  unitLabel: z.string().max(60).optional().nullable(),
  perPerson: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
  perNight: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
  active: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
});

export async function updateExtra(formData: FormData) {
  const me = await requireManager();
  const parsed = extraUpdateSchema.safeParse({
    id: formData.get("id"),
    label: formData.get("label"),
    description: formData.get("description") || null,
    unitEuros: formData.get("unitEuros"),
    unitLabel: formData.get("unitLabel") || null,
    perPerson: formData.get("perPerson"),
    perNight: formData.get("perNight"),
    active: formData.get("active"),
  });
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe." };
  const cents = Math.round(parsed.data.unitEuros * 100);
  await db
    .update(extras)
    .set({
      label: parsed.data.label,
      description: parsed.data.description,
      unitCents: cents,
      unitLabel: parsed.data.unitLabel,
      perPerson: parsed.data.perPerson,
      perNight: parsed.data.perNight,
      active: parsed.data.active,
      updatedAt: new Date(),
    })
    .where(eq(extras.id, parsed.data.id));
  await db.insert(activityLog).values({
    who: me,
    what: `Extra geändert: ${parsed.data.label} → ${parsed.data.unitEuros.toFixed(2)} €`,
  });
  revalidatePath("/m/stammdaten");
  return { ok: true as const };
}

const extraCreateSchema = z.object({
  code: z.string().min(2).max(60).regex(/^[a-z0-9_-]+$/i),
  label: z.string().min(1).max(200),
  unitEuros: z.coerce.number().min(0).max(10000),
});

// ---------- Seasons ----------
const monthDayPattern = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

const seasonUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  startMonthDay: z.string().regex(monthDayPattern, "Format MM-DD"),
  endMonthDay: z.string().regex(monthDayPattern, "Format MM-DD"),
  priority: z.coerce.number().int().min(0).max(100),
  active: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
});

export async function updateSeason(formData: FormData) {
  const me = await requireManager();
  const parsed = seasonUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    startMonthDay: formData.get("startMonthDay"),
    endMonthDay: formData.get("endMonthDay"),
    priority: formData.get("priority"),
    active: formData.get("active"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  await db
    .update(seasons)
    .set({
      name: parsed.data.name,
      startMonthDay: parsed.data.startMonthDay,
      endMonthDay: parsed.data.endMonthDay,
      priority: parsed.data.priority,
      active: parsed.data.active,
      updatedAt: new Date(),
    })
    .where(eq(seasons.id, parsed.data.id));
  await db.insert(activityLog).values({
    who: me,
    what: `Saison geändert: ${parsed.data.name} (${parsed.data.startMonthDay} → ${parsed.data.endMonthDay}, prio ${parsed.data.priority})`,
  });
  revalidatePath("/m/stammdaten");
  return { ok: true as const };
}

const seasonCreateSchema = z.object({
  name: z.string().min(2).max(120),
  code: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[a-z0-9_-]+$/i, "Nur a-z, 0-9, _, -"),
  startMonthDay: z.string().regex(monthDayPattern, "Format MM-DD"),
  endMonthDay: z.string().regex(monthDayPattern, "Format MM-DD"),
});

export async function createSeason(formData: FormData) {
  const me = await requireManager();
  const parsed = seasonCreateSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    startMonthDay: formData.get("startMonthDay"),
    endMonthDay: formData.get("endMonthDay"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  await db.insert(seasons).values({
    name: parsed.data.name,
    code: parsed.data.code.toLowerCase(),
    startMonthDay: parsed.data.startMonthDay,
    endMonthDay: parsed.data.endMonthDay,
    active: false,
  });
  await db.insert(activityLog).values({
    who: me,
    what: `Saison angelegt: ${parsed.data.name} (${parsed.data.code})`,
  });
  revalidatePath("/m/stammdaten");
  return { ok: true as const };
}

export async function deleteSeason(formData: FormData) {
  const me = await requireManager();
  const id = z.string().uuid().parse(formData.get("id"));
  await db.delete(seasons).where(eq(seasons.id, id));
  await db.insert(activityLog).values({
    who: me,
    what: `Saison gelöscht (${id})`,
  });
  revalidatePath("/m/stammdaten");
  return { ok: true as const };
}

// ---------- Extras ----------
export async function createExtra(formData: FormData) {
  const me = await requireManager();
  const parsed = extraCreateSchema.safeParse({
    code: formData.get("code"),
    label: formData.get("label"),
    unitEuros: formData.get("unitEuros"),
  });
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe (Code: a-z, 0-9, _-)." };
  await db.insert(extras).values({
    code: parsed.data.code.toLowerCase(),
    label: parsed.data.label,
    unitCents: Math.round(parsed.data.unitEuros * 100),
    active: false,
  });
  await db.insert(activityLog).values({
    who: me,
    what: `Extra angelegt: ${parsed.data.label} (${parsed.data.code})`,
  });
  revalidatePath("/m/stammdaten");
  return { ok: true as const };
}


// ---------- Membership Tiers ----------

const tierUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  annualFeeEuros: z.coerce.number().nonnegative(),
  stripePriceId: z.string().max(120).optional().nullable(),
  active: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
});

export async function updateMembershipTier(formData: FormData) {
  const me = await requireManager();
  const parsed = tierUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    annualFeeEuros: formData.get("annualFeeEuros"),
    stripePriceId: (formData.get("stripePriceId") || "").toString().trim() || null,
    active: formData.get("active"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  await db
    .update(membershipTiers)
    .set({
      name: parsed.data.name,
      annualFeeCents: Math.round(parsed.data.annualFeeEuros * 100),
      stripePriceId: parsed.data.stripePriceId,
      active: parsed.data.active,
      updatedAt: new Date(),
    })
    .where(eq(membershipTiers.id, parsed.data.id));
  await db.insert(activityLog).values({
    who: me,
    what: `Mitgliedsbeitrag-Tier geändert: ${parsed.data.name} (${parsed.data.annualFeeEuros.toFixed(2)} €${parsed.data.stripePriceId ? `, Stripe-Price: ${parsed.data.stripePriceId}` : ""})`,
  });
  revalidatePath("/m/stammdaten");
  return { ok: true as const };
}
