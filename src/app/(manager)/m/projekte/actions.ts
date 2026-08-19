"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projekte, activityLog } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
  return session!.user!.email!;
}

const STATUS = ["frei", "teils", "vergeben"] as const;

const baseSchema = z.object({
  key: z.string().min(2).max(60),
  nr: z.string().min(2).max(10),
  titel: z.string().min(2).max(300),
  untertitel: z.string().min(2).max(300),
  darumGehts: z.string().min(2),
  brauchenWir: z.string(), // newline-separated, wird beim Speichern in ein Array zerlegt
  zeitrahmen: z.string().max(200),
  aufwand: z.string().max(200),
  kosten: z.string(),
  anpacken: z.string(),
  beitrag: z.string(),
  danke: z.string(),
  kontakt: z.string(),
  bild: z.string().min(2).max(300),
  status: z.enum(STATUS),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
});

function pickFormFields(formData: FormData) {
  return {
    key: formData.get("key"),
    nr: formData.get("nr"),
    titel: formData.get("titel"),
    untertitel: formData.get("untertitel"),
    darumGehts: formData.get("darumGehts"),
    brauchenWir: formData.get("brauchenWir"),
    zeitrahmen: formData.get("zeitrahmen"),
    aufwand: formData.get("aufwand"),
    kosten: formData.get("kosten"),
    anpacken: formData.get("anpacken"),
    beitrag: formData.get("beitrag"),
    danke: formData.get("danke"),
    kontakt: formData.get("kontakt"),
    bild: formData.get("bild"),
    status: formData.get("status"),
    sortOrder: formData.get("sortOrder") || 0,
  };
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export async function createProjekt(formData: FormData) {
  const me = await requireManager();
  const parsed = baseSchema.safeParse(pickFormFields(formData));
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  const d = parsed.data;
  await db.insert(projekte).values({
    key: d.key,
    nr: d.nr,
    titel: d.titel,
    untertitel: d.untertitel,
    darumGehts: d.darumGehts,
    brauchenWir: splitLines(d.brauchenWir),
    zeitrahmen: d.zeitrahmen,
    aufwand: d.aufwand,
    kosten: d.kosten,
    anpacken: d.anpacken,
    beitrag: d.beitrag,
    danke: d.danke,
    kontakt: d.kontakt,
    bild: d.bild,
    status: d.status,
    sortOrder: d.sortOrder,
  });
  await db.insert(activityLog).values({ who: me, what: `Projekt angelegt: ${d.titel} (${d.nr})` });
  revalidatePath("/m/projekte");
  revalidatePath("/projekte");
  return { ok: true as const };
}

const updateSchema = baseSchema.extend({ id: z.string().uuid() });

export async function updateProjekt(formData: FormData) {
  const me = await requireManager();
  const parsed = updateSchema.safeParse({ ...pickFormFields(formData), id: formData.get("id") });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  const d = parsed.data;
  await db
    .update(projekte)
    .set({
      key: d.key,
      nr: d.nr,
      titel: d.titel,
      untertitel: d.untertitel,
      darumGehts: d.darumGehts,
      brauchenWir: splitLines(d.brauchenWir),
      zeitrahmen: d.zeitrahmen,
      aufwand: d.aufwand,
      kosten: d.kosten,
      anpacken: d.anpacken,
      beitrag: d.beitrag,
      danke: d.danke,
      kontakt: d.kontakt,
      bild: d.bild,
      status: d.status,
      sortOrder: d.sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(projekte.id, d.id));
  await db.insert(activityLog).values({ who: me, what: `Projekt bearbeitet: ${d.titel} (${d.nr})` });
  revalidatePath("/m/projekte");
  revalidatePath("/projekte");
  return { ok: true as const };
}

export async function deleteProjekt(formData: FormData) {
  const me = await requireManager();
  const id = z.string().uuid().parse(formData.get("id"));
  const rows = await db.select().from(projekte).where(eq(projekte.id, id)).limit(1);
  if (!rows[0]) return { ok: false as const };
  await db.delete(projekte).where(eq(projekte.id, id));
  await db.insert(activityLog).values({ who: me, what: `Projekt gelöscht: ${rows[0].titel} (${rows[0].nr})` });
  revalidatePath("/m/projekte");
  revalidatePath("/projekte");
  return { ok: true as const };
}
