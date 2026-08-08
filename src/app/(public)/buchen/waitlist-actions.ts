"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { waitlistEntries, activityLog } from "@/lib/db/schema";
import { and, eq, gte, isNull } from "drizzle-orm";
import { isRangeAvailable } from "@/lib/availability";
import { toLocalIso } from "@/lib/utils";

// =============================================================
// Verfügbarkeits-Alarm: Self-Service-Eintrag auf der /buchen-Seite.
// Gast trägt sich für einen belegten Zeitraum ein und wird automatisch
// benachrichtigt, sobald eine Stornierung ihn wirklich freigibt
// (siehe src/lib/waitlist.ts).
// =============================================================

/** Max. gleichzeitig aktive (unbenachrichtigte) Einträge pro E-Mail-Adresse. */
const MAX_ACTIVE_PER_EMAIL = 5;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum.");

const joinSchema = z
  .object({
    email: z.string().trim().email("Bitte eine gültige E-Mail-Adresse angeben.").max(255),
    firstName: z.string().trim().max(120).optional(),
    arrival: isoDate,
    departure: isoDate,
    persons: z.coerce.number().int().min(1).max(33).optional(),
    // Honeypot gegen Spam-Bots — Menschen lassen das Feld leer.
    company: z.string().max(200).optional(),
  })
  .refine((d) => d.arrival < d.departure, {
    message: "Die Abreise muss nach der Anreise liegen.",
    path: ["departure"],
  });

export type JoinWaitlistInput = z.input<typeof joinSchema>;

export type JoinWaitlistResult =
  | { ok: true; already?: boolean }
  | { ok: false; error: string };

export async function joinWaitlist(raw: JoinWaitlistInput): Promise<JoinWaitlistResult> {
  const parsed = joinSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  const data = parsed.data;

  // Honeypot ausgefüllt → Bot. Still "erfolgreich" antworten, nichts speichern.
  if (data.company && data.company.trim() !== "") {
    return { ok: true };
  }

  // Beide Daten müssen in der Zukunft (bzw. heute) liegen.
  const todayIso = toLocalIso(new Date());
  if (data.arrival < todayIso || data.departure < todayIso) {
    return { ok: false, error: "Der Zeitraum muss in der Zukunft liegen." };
  }

  const email = data.email.toLowerCase();

  // Dedupe: gleiche E-Mail + gleicher Zeitraum, noch nicht benachrichtigt →
  // freundlich melden statt Doppel-Eintrag anlegen.
  const existing = await db
    .select({ id: waitlistEntries.id })
    .from(waitlistEntries)
    .where(
      and(
        eq(waitlistEntries.email, email),
        eq(waitlistEntries.arrival, data.arrival),
        eq(waitlistEntries.departure, data.departure),
        isNull(waitlistEntries.notifiedAt)
      )
    )
    .limit(1);
  if (existing.length > 0) {
    return { ok: true, already: true };
  }

  // Missbrauchs-Schranke: max. 5 aktive Einträge pro E-Mail-Adresse.
  const active = await db
    .select({ id: waitlistEntries.id })
    .from(waitlistEntries)
    .where(
      and(
        eq(waitlistEntries.email, email),
        isNull(waitlistEntries.notifiedAt),
        gte(waitlistEntries.departure, todayIso)
      )
    );
  if (active.length >= MAX_ACTIVE_PER_EMAIL) {
    return {
      ok: false,
      error: `Für diese E-Mail-Adresse sind bereits ${MAX_ACTIVE_PER_EMAIL} Verfügbarkeits-Alarme aktiv. Bitte warte, bis einer davon frei wird oder abläuft.`,
    };
  }

  // Service-Check (best-effort): Ist der Zeitraum ohnehin schon frei, direkt
  // zum Buchen schicken statt auf einen Storno warten zu lassen.
  try {
    const free = await isRangeAvailable({ arrival: data.arrival, departure: data.departure });
    if (free) {
      return {
        ok: false,
        error:
          "Gute Nachricht: Dieser Zeitraum ist aktuell frei — Du kannst ihn oben direkt buchen, ein Alarm ist nicht nötig.",
      };
    }
  } catch (err) {
    // Check fehlgeschlagen → Eintrag trotzdem zulassen (kein Blocker).
    console.error("[waitlist] Verfügbarkeits-Vorabcheck fehlgeschlagen:", err);
  }

  await db.insert(waitlistEntries).values({
    email,
    firstName: data.firstName || null,
    arrival: data.arrival,
    departure: data.departure,
    persons: data.persons ?? null,
  });

  await db.insert(activityLog).values({
    who: email,
    what: `Verfügbarkeits-Alarm eingetragen: ${data.arrival} – ${data.departure}${data.persons ? ` (${data.persons} Pers.)` : ""}`,
  });

  return { ok: true };
}
