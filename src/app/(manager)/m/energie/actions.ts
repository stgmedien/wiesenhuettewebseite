"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { meterReadings, activityLog } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { parseMeterInput } from "@/lib/energy";

type Result = { ok: true; warning?: string } | { ok: false; error: string };

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
  return session!;
}

const schema = z.object({
  readOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  electricity: z.string().max(20).optional(),
  gas: z.string().max(20).optional(),
  bookingId: z.string().uuid().optional(),
  note: z.string().trim().max(500).optional(),
});

export async function addMeterReading(formData: FormData): Promise<Result> {
  let session: Awaited<ReturnType<typeof requireManager>>;
  try {
    session = await requireManager();
  } catch {
    return { ok: false, error: "Nicht autorisiert" };
  }
  const parsed = schema.safeParse({
    readOn: formData.get("readOn"),
    electricity: formData.get("electricity") || undefined,
    gas: formData.get("gas") || undefined,
    bookingId: formData.get("bookingId") || undefined,
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "Bitte Datum und Werte prüfen." };
  const d = parsed.data;

  const el = d.electricity ? parseMeterInput(d.electricity) : null;
  const gas = d.gas ? parseMeterInput(d.gas) : null;
  if (el === null && gas === null) return { ok: false, error: "Bitte mindestens einen Zählerstand eintragen." };
  if (el !== null && Number.isNaN(el)) return { ok: false, error: "Stromzählerstand nicht lesbar, z. B. 24169,1." };
  if (gas !== null && Number.isNaN(gas)) return { ok: false, error: "Gaszählerstand nicht lesbar, z. B. 88907,69." };
  if (d.readOn > new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" })) {
    return { ok: false, error: "Das Datum liegt in der Zukunft." };
  }

  const electricityKwhX10 = el === null ? null : Math.round(el * 10);
  const gasM3X100 = gas === null ? null : Math.round(gas * 100);

  // Plausibilität gegen die letzte Ablesung davor — speichert trotzdem,
  // meldet aber, damit ein Zahlendreher sofort auffällt.
  const before = await db.select().from(meterReadings).orderBy(desc(meterReadings.readOn)).limit(50);
  const prior = before.filter((r) => r.readOn <= d.readOn);
  const lastEl = prior.find((r) => r.electricityKwhX10 !== null)?.electricityKwhX10 ?? null;
  const lastGas = prior.find((r) => r.gasM3X100 !== null)?.gasM3X100 ?? null;
  const warnings: string[] = [];
  if (electricityKwhX10 !== null && lastEl !== null && electricityKwhX10 < lastEl) {
    warnings.push("Strom ist niedriger als bei der Ablesung davor");
  }
  if (gasM3X100 !== null && lastGas !== null && gasM3X100 < lastGas) {
    warnings.push("Gas ist niedriger als bei der Ablesung davor");
  }

  const who = session.user?.name ?? session.user?.email ?? "Manager";
  await db.insert(meterReadings).values({
    readOn: d.readOn,
    electricityKwhX10,
    gasM3X100,
    bookingId: d.bookingId ?? null,
    note: d.note || null,
    createdBy: who,
  });
  await db.insert(activityLog).values({
    who,
    what: `Zählerstand erfasst (${d.readOn}): ${el !== null ? `Strom ${el} kWh` : ""}${el !== null && gas !== null ? ", " : ""}${gas !== null ? `Gas ${gas} m³` : ""}`,
    bookingId: d.bookingId ?? null,
  });

  revalidatePath("/m/energie");
  return warnings.length > 0
    ? { ok: true, warning: `Gespeichert — aber: ${warnings.join(" und ")}. Tippfehler? Sonst bitte Eintrag löschen und neu erfassen.` }
    : { ok: true };
}

export async function deleteMeterReading(id: string): Promise<Result> {
  let session: Awaited<ReturnType<typeof requireManager>>;
  try {
    session = await requireManager();
  } catch {
    return { ok: false, error: "Nicht autorisiert" };
  }
  const deleted = await db.delete(meterReadings).where(eq(meterReadings.id, id)).returning();
  if (deleted.length === 0) return { ok: false, error: "Ablesung nicht gefunden." };
  const r = deleted[0];
  await db.insert(activityLog).values({
    who: session.user?.name ?? session.user?.email ?? "Manager",
    what: `Zählerstand gelöscht (${r.readOn}): Strom ${r.electricityKwhX10 === null ? "—" : r.electricityKwhX10 / 10} kWh, Gas ${r.gasM3X100 === null ? "—" : r.gasM3X100 / 100} m³`,
  });
  revalidatePath("/m/energie");
  return { ok: true };
}
