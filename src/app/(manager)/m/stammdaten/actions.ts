"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { tariffs, extras, activityLog } from "@/lib/db/schema";
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
