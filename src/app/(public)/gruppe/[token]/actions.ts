"use server";

// =============================================================
// Server-Actions des Gruppen-Planungs-Hubs (/gruppe/[token]).
// Kein Login — der Token IST die Berechtigung. Deshalb bei JEDER Mutation:
//   1. Hub über den Token laden (unbekannter Token → Fehler),
//   2. bei Entry-Mutationen zusätzlich prüfen, dass der Entry zu GENAU
//      diesem Hub gehört (hub_id im WHERE — nie nur die Entry-ID),
//   3. nur Plain-Text mit harten Längenlimits speichern.
// =============================================================

import { z } from "zod";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { bookingHubs, bookings, hubEntries } from "@/lib/db/schema";
import { HUB_LIMITS, HUB_ROOMS } from "@/lib/hub-shared";

export type HubActionResult = { ok: true } | { ok: false; error: string };

// Grobe Abuse-Schranke: mehr braucht keine 33-Personen-Gruppe.
const MAX_ENTRIES_PER_HUB = 500;

// Token = 24 Random-Bytes als Hex (48 Zeichen), siehe src/lib/hub.ts.
const tokenSchema = z
  .string()
  .regex(/^[a-f0-9]{40,64}$/, "Ungültiger Link.");

// Steuerzeichen raus, Whitespace normalisieren — reiner Plain-Text.
const clean = (s: string) =>
  s
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const titleSchema = z.string().transform(clean).pipe(z.string().min(1, "Bitte einen Text eingeben.").max(HUB_LIMITS.title));
const nameSchema = z.string().transform(clean).pipe(z.string().max(HUB_LIMITS.authorName)).optional();
const detailsSchema = z.string().transform(clean).pipe(z.string().max(HUB_LIMITS.details)).optional();

async function loadHubByToken(token: string) {
  const rows = await db
    .select({ id: bookingHubs.id, bookingId: bookingHubs.bookingId })
    .from(bookingHubs)
    .where(eq(bookingHubs.token, token))
    .limit(1);
  return rows[0] ?? null;
}

async function hubIsFull(hubId: string): Promise<boolean> {
  const rows = await db
    .select({ n: count() })
    .from(hubEntries)
    .where(eq(hubEntries.hubId, hubId));
  return (rows[0]?.n ?? 0) >= MAX_ENTRIES_PER_HUB;
}

function fail(error: string): HubActionResult {
  return { ok: false, error };
}

const UNKNOWN_LINK = "Dieser Hub-Link ist unbekannt — bitte fragt die Person, die gebucht hat, nach dem aktuellen Link.";
const HUB_FULL = "Der Hub ist voll — bitte löscht erst ein paar alte Einträge.";

// -------------------------------------------------------------
// PACKLISTE
// -------------------------------------------------------------

const addPacklistSchema = z.object({
  token: tokenSchema,
  title: titleSchema,
  authorName: nameSchema,
});

export async function addPacklistItem(
  raw: z.input<typeof addPacklistSchema>
): Promise<HubActionResult> {
  const parsed = addPacklistSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ungültige Eingabe.");
  const hub = await loadHubByToken(parsed.data.token);
  if (!hub) return fail(UNKNOWN_LINK);
  if (await hubIsFull(hub.id)) return fail(HUB_FULL);

  await db.insert(hubEntries).values({
    hubId: hub.id,
    kind: "packliste",
    title: parsed.data.title,
    authorName: parsed.data.authorName || null,
  });

  revalidatePath(`/gruppe/${parsed.data.token}`);
  return { ok: true };
}

const toggleSchema = z.object({
  token: tokenSchema,
  entryId: z.string().uuid(),
  done: z.boolean(),
});

export async function togglePacklistItem(
  raw: z.input<typeof toggleSchema>
): Promise<HubActionResult> {
  const parsed = toggleSchema.safeParse(raw);
  if (!parsed.success) return fail("Ungültige Eingabe.");
  const hub = await loadHubByToken(parsed.data.token);
  if (!hub) return fail(UNKNOWN_LINK);

  // hub_id im WHERE: ein Entry aus einem fremden Hub ist damit unerreichbar.
  await db
    .update(hubEntries)
    .set({ done: parsed.data.done, updatedAt: new Date() })
    .where(and(eq(hubEntries.id, parsed.data.entryId), eq(hubEntries.hubId, hub.id)));

  revalidatePath(`/gruppe/${parsed.data.token}`);
  return { ok: true };
}

// -------------------------------------------------------------
// EINTRAG LÖSCHEN (alle Sektionen)
// -------------------------------------------------------------

const deleteSchema = z.object({
  token: tokenSchema,
  entryId: z.string().uuid(),
});

export async function deleteHubEntry(
  raw: z.input<typeof deleteSchema>
): Promise<HubActionResult> {
  const parsed = deleteSchema.safeParse(raw);
  if (!parsed.success) return fail("Ungültige Eingabe.");
  const hub = await loadHubByToken(parsed.data.token);
  if (!hub) return fail(UNKNOWN_LINK);

  await db
    .delete(hubEntries)
    .where(and(eq(hubEntries.id, parsed.data.entryId), eq(hubEntries.hubId, hub.id)));

  revalidatePath(`/gruppe/${parsed.data.token}`);
  return { ok: true };
}

// -------------------------------------------------------------
// ESSENSPLAN — ein Eintrag je Tag + Mahlzeit (mehrere Gerichte erlaubt)
// -------------------------------------------------------------

const mealSchema = z.object({
  token: tokenSchema,
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum."),
  meal: z.enum(["frueh", "mittag", "abend"]),
  title: titleSchema, // das Gericht
  authorName: nameSchema, // das Koch-Team
});

export async function addMealEntry(
  raw: z.input<typeof mealSchema>
): Promise<HubActionResult> {
  const parsed = mealSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ungültige Eingabe.");
  const hub = await loadHubByToken(parsed.data.token);
  if (!hub) return fail(UNKNOWN_LINK);
  if (await hubIsFull(hub.id)) return fail(HUB_FULL);

  // Der Tag muss im Aufenthalts-Zeitraum der Buchung liegen (ISO-Strings
  // vergleichen sich lexikographisch korrekt).
  const bookingRows = await db
    .select({ arrival: bookings.arrival, departure: bookings.departure })
    .from(bookings)
    .where(eq(bookings.id, hub.bookingId))
    .limit(1);
  const booking = bookingRows[0];
  if (!booking) return fail(UNKNOWN_LINK);
  if (parsed.data.day < booking.arrival || parsed.data.day > booking.departure) {
    return fail("Der Tag liegt außerhalb Eures Aufenthalts.");
  }

  await db.insert(hubEntries).values({
    hubId: hub.id,
    kind: "essen",
    title: parsed.data.title,
    authorName: parsed.data.authorName || null,
    meta: { day: parsed.data.day, meal: parsed.data.meal },
  });

  revalidatePath(`/gruppe/${parsed.data.token}`);
  return { ok: true };
}

// -------------------------------------------------------------
// ZIMMER — Name pro Zimmer eintragen
// -------------------------------------------------------------

const roomSchema = z.object({
  token: tokenSchema,
  room: z.string().refine((r) => HUB_ROOMS.some((hr) => hr.name === r), "Unbekanntes Zimmer."),
  name: titleSchema.pipe(z.string().max(HUB_LIMITS.authorName)), // title = Name der Person
});

export async function addRoomGuest(
  raw: z.input<typeof roomSchema>
): Promise<HubActionResult> {
  const parsed = roomSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ungültige Eingabe.");
  const hub = await loadHubByToken(parsed.data.token);
  if (!hub) return fail(UNKNOWN_LINK);
  if (await hubIsFull(hub.id)) return fail(HUB_FULL);

  await db.insert(hubEntries).values({
    hubId: hub.id,
    kind: "zimmer",
    title: parsed.data.name,
    meta: { room: parsed.data.room },
  });

  revalidatePath(`/gruppe/${parsed.data.token}`);
  return { ok: true };
}

// -------------------------------------------------------------
// MITFAHRBÖRSE — „Biete X Plätze ab ORT" / „Suche Mitfahrt ab ORT"
// Bewusst KEINE Kontaktdaten-Pflicht: Absprache läuft über das details-Feld
// bzw. den Gruppen-Chat, in dem der Link ohnehin geteilt wurde.
// -------------------------------------------------------------

const rideSchema = z.object({
  token: tokenSchema,
  type: z.enum(["biete", "suche"]),
  seats: z.coerce.number().int().min(1).max(HUB_LIMITS.maxSeats),
  ort: z.string().transform(clean).pipe(z.string().min(1, "Bitte einen Ort angeben.").max(HUB_LIMITS.ort)),
  title: z.string().transform(clean).pipe(z.string().max(HUB_LIMITS.title)).optional(),
  details: detailsSchema,
  authorName: nameSchema,
});

export async function addRideEntry(
  raw: z.input<typeof rideSchema>
): Promise<HubActionResult> {
  const parsed = rideSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ungültige Eingabe.");
  const hub = await loadHubByToken(parsed.data.token);
  if (!hub) return fail(UNKNOWN_LINK);
  if (await hubIsFull(hub.id)) return fail(HUB_FULL);

  const { type, seats, ort } = parsed.data;
  const fallbackTitle =
    type === "biete" ? `Biete ${seats} ${seats === 1 ? "Platz" : "Plätze"} ab ${ort}` : `Suche Mitfahrt ab ${ort}`;

  await db.insert(hubEntries).values({
    hubId: hub.id,
    kind: "mitfahrt",
    title: parsed.data.title || fallbackTitle,
    details: parsed.data.details || null,
    authorName: parsed.data.authorName || null,
    meta: { type, seats, ort },
  });

  revalidatePath(`/gruppe/${parsed.data.token}`);
  return { ok: true };
}
