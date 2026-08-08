// =============================================================
// Gruppen-Planungs-Hub — Server-Helfer.
// Der Buchende erzeugt aus seiner Buchung einen teilbaren Link
// (/gruppe/[token]); Mitreisende planen darüber ohne Login gemeinsam
// Packliste, Essensplan, Zimmeraufteilung und Mitfahrten.
// =============================================================

import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookingHubs, hubEntries, type BookingHub } from "@/lib/db/schema";

// Standard-Packliste beim Anlegen des Hubs — orientiert an den Gruppen-Items
// des Packlisten-Generators (/packliste bzw. src/lib/packliste-rules.ts):
// Dinge, die die GRUPPE untereinander aufteilen sollte, nicht das persönliche
// Gepäck. Die Gruppe hakt ab und trägt bei „Wer bringt's mit?" Namen ein.
const DEFAULT_PACKLIST: { title: string; details?: string }[] = [
  {
    title: "Bettdecke + Bezug oder Schlafsack (jede:r selbst)",
    details:
      "Vor Ort gibt es NUR Kopfkissen ohne Bezug — Spannbettlaken und Kopfkissenbezug nicht vergessen.",
  },
  { title: "Hausschuhe / dicke Socken für drinnen (jede:r selbst)" },
  { title: "Handtücher (jede:r selbst)" },
  { title: "Spülmittel + Spültücher" },
  { title: "Müllbeutel" },
  {
    title: "Erste-Hilfe-Set",
    details: "Pflaster, Verbandmaterial, Schere, Pinzette.",
  },
  { title: "Spiele (Karten, Brettspiele, Wikingerschach)" },
  {
    title: "Taschenlampe / Stirnlampe",
    details: "In Langewiese wird's nachts richtig dunkel.",
  },
  {
    title: "Gewürze + Olivenöl",
    details: "Vorratsraum und Kühlschränke sind da, aber keine Gewürze.",
  },
  { title: "Kaffee, Filter + Tee-Auswahl" },
];

/**
 * Liefert den bestehenden Hub einer Buchung oder legt ihn an (inkl.
 * Standard-Packliste). Race-sicher über den Unique-Constraint auf booking_id:
 * bei parallelem Anlegen gewinnt genau ein Insert, alle anderen lesen nach.
 */
export async function getOrCreateHubForBooking(bookingId: string): Promise<BookingHub> {
  const existing = await db
    .select()
    .from(bookingHubs)
    .where(eq(bookingHubs.bookingId, bookingId))
    .limit(1);
  if (existing[0]) return existing[0];

  const token = crypto.randomBytes(24).toString("hex");
  const inserted = await db
    .insert(bookingHubs)
    .values({ bookingId, token })
    .onConflictDoNothing({ target: bookingHubs.bookingId })
    .returning();

  const hub =
    inserted[0] ??
    (
      await db
        .select()
        .from(bookingHubs)
        .where(eq(bookingHubs.bookingId, bookingId))
        .limit(1)
    )[0];
  if (!hub) throw new Error("Gruppen-Hub konnte nicht angelegt werden");

  // Packliste nur vorbefüllen, wenn WIR den Hub gerade angelegt haben —
  // sonst würden parallele Aufrufe die Standard-Einträge doppeln.
  if (inserted[0]) {
    await db.insert(hubEntries).values(
      DEFAULT_PACKLIST.map((item) => ({
        hubId: hub.id,
        kind: "packliste",
        title: item.title,
        details: item.details ?? null,
        authorName: null,
      }))
    );
  }

  return hub;
}

/** Absolute Hub-URL zum Teilen im Gruppen-Chat. */
export function hubUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.wiesenhuette.de";
  return `${base.replace(/\/$/, "")}/gruppe/${token}`;
}
