"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { notes, customers, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { resendBookingConfirmationMails } from "@/lib/booking-payment-confirmation";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
  return session!.user!.email!;
}

const addSchema = z.object({
  scope: z.enum(["booking", "customer", "inquiry"]),
  refId: z.string().uuid(),
  body: z.string().min(1).max(4000),
  internal: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(true),
  pinned: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(false),
});

export async function addNote(formData: FormData) {
  const me = await requireManager();
  const parsed = addSchema.safeParse({
    scope: formData.get("scope"),
    refId: formData.get("refId"),
    body: formData.get("body"),
    internal: formData.get("internal"),
    pinned: formData.get("pinned"),
  });
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe." };

  await db.insert(notes).values({
    scope: parsed.data.scope,
    refId: parsed.data.refId,
    body: parsed.data.body,
    internal: parsed.data.internal,
    pinned: parsed.data.pinned,
    by: me,
  });

  await db.insert(activityLog).values({
    who: me,
    what: `Notiz angelegt (${parsed.data.scope}=${parsed.data.refId})`,
    bookingId: parsed.data.scope === "booking" ? parsed.data.refId : null,
  });

  revalidatePath(`/m/buchungen/${parsed.data.refId}`);
  return { ok: true as const };
}

export async function deleteNote(formData: FormData) {
  const me = await requireManager();
  const id = z.string().uuid().parse(formData.get("id"));
  const refId = z.string().uuid().parse(formData.get("refId"));
  await db.delete(notes).where(eq(notes.id, id));
  await db.insert(activityLog).values({
    who: me,
    what: `Notiz gelöscht (${id})`,
    bookingId: refId,
  });
  revalidatePath(`/m/buchungen/${refId}`);
  return { ok: true as const };
}

const tagsSchema = z.object({
  customerId: z.string().uuid(),
  tags: z.string().max(500), // comma-separated
});

export async function updateCustomerTags(formData: FormData) {
  const me = await requireManager();
  const parsed = tagsSchema.safeParse({
    customerId: formData.get("customerId"),
    tags: formData.get("tags"),
  });
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe." };
  const tagList = parsed.data.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
  await db
    .update(customers)
    .set({ tags: tagList })
    .where(eq(customers.id, parsed.data.customerId));
  await db.insert(activityLog).values({
    who: me,
    what: `Customer-Tags aktualisiert (${parsed.data.customerId}): [${tagList.join(", ")}]`,
  });
  revalidatePath(`/m/buchungen`);
  return { ok: true as const };
}

const contactSchema = z.object({
  customerId: z.string().uuid(),
  bookingId: z.string().uuid(),
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(60).optional(),
  street: z.string().trim().max(255).optional(),
  zip: z.string().trim().max(20).optional(),
  city: z.string().trim().max(120).optional(),
});

/**
 * Korrigiert die Kontaktdaten eines Kunden — z. B. einen Tippfehler in der
 * E-Mail-Adresse, der dazu fuehrt, dass Systemmails (Bestaetigung,
 * Mietvertrag, ...) unbemerkt bouncen. Bewusst kein Self-Service fuer
 * Gaeste — nur der Manager darf fremde Kundendaten aendern.
 */
export async function updateCustomerContact(
  raw: z.infer<typeof contactSchema>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const me = await requireManager();
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const d = parsed.data;

  const before = (
    await db.select().from(customers).where(eq(customers.id, d.customerId)).limit(1)
  )[0];
  if (!before) return { ok: false, error: "Kunde nicht gefunden." };

  await db
    .update(customers)
    .set({
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone || null,
      street: d.street || null,
      zip: d.zip || null,
      city: d.city || null,
    })
    .where(eq(customers.id, d.customerId));

  const changes: string[] = [];
  if (before.email !== d.email) changes.push(`E-Mail: ${before.email} → ${d.email}`);
  if (before.phone !== (d.phone || null)) changes.push(`Telefon geändert`);
  if (`${before.firstName} ${before.lastName}` !== `${d.firstName} ${d.lastName}`) {
    changes.push(`Name: ${before.firstName} ${before.lastName} → ${d.firstName} ${d.lastName}`);
  }

  await db.insert(activityLog).values({
    who: me,
    what: `Kontaktdaten korrigiert${changes.length ? " — " + changes.join(", ") : ""}`,
    bookingId: d.bookingId,
  });

  revalidatePath(`/m/buchungen/${d.bookingId}`);
  return { ok: true };
}

/**
 * Verschickt Buchungsbestaetigung + Mietvertrag erneut mit den aktuellen
 * Kunden-/Buchungsdaten — z. B. nachdem eine falsche E-Mail-Adresse korrigiert
 * wurde und die urspruenglichen Mails deshalb gebounced sind.
 */
export async function resendGuestMails(
  bookingId: string
): Promise<{ ok: true; sent: string[] } | { ok: false; error: string }> {
  const me = await requireManager();
  const parsedId = z.string().uuid().safeParse(bookingId);
  if (!parsedId.success) return { ok: false, error: "Ungültige Buchung." };

  const { sent, errors } = await resendBookingConfirmationMails(parsedId.data);

  await db.insert(activityLog).values({
    who: me,
    what: `Mails erneut gesendet: ${sent.length ? sent.join(", ") : "keine"}${
      errors.length ? " — Fehler: " + errors.join("; ") : ""
    }`,
    bookingId: parsedId.data,
  });

  revalidatePath(`/m/buchungen/${parsedId.data}`);

  if (sent.length === 0) {
    return { ok: false, error: errors.join("; ") || "Unbekannter Fehler." };
  }
  return { ok: true, sent };
}
