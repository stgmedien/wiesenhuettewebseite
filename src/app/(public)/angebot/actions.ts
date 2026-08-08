"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { offers } from "@/lib/db/schema";
import {
  calculatePrice,
  validateBookingInput,
  type Persons,
} from "@/lib/pricing";
import { resolveTariffs } from "@/lib/pricing-tariffs";
import { toLocalIso } from "@/lib/utils";

// Gültigkeitsfenster des Angebots: 14 Tage ab Erstellung (eingefrorene Preise).
const OFFER_VALID_DAYS = 14;

const schema = z.object({
  arrival: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte ein Anreisedatum wählen."),
  departure: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte ein Abreisedatum wählen."),
  adults: z.coerce.number().int().min(0).max(33, "Maximal 33 Personen."),
  children: z.coerce.number().int().min(0).max(33, "Maximal 33 Personen."),
  pupils: z.coerce.number().int().min(0).max(33, "Maximal 33 Personen."),
  teachers: z.coerce.number().int().min(0).max(33, "Maximal 33 Personen."),
  purpose: z.string().max(200).optional().nullable(),
  institution: z.string().max(200).optional().nullable(),
  contactName: z.string().max(200).optional().nullable(),
});

export type CreateOfferResult =
  | { ok: true; token: string; validUntil: string }
  | { ok: false; error: string };

/**
 * Erzeugt ein teilbares, 14 Tage gültiges Angebot mit eingefrorener
 * Preis-Kalkulation. Rechnet mit den aktuell aufgelösten Tarifen
 * (resolveTariffs) durch die echte Pricing-Engine (calculatePrice) und
 * speichert die Positionen als Snapshot — spätere Preisänderungen
 * verändern das Angebot nicht mehr.
 */
export async function createOffer(formData: FormData): Promise<CreateOfferResult> {
  const raw = {
    arrival: (formData.get("arrival") || "").toString(),
    departure: (formData.get("departure") || "").toString(),
    adults: formData.get("adults") || "0",
    children: formData.get("children") || "0",
    pupils: formData.get("pupils") || "0",
    teachers: formData.get("teachers") || "0",
    purpose: (formData.get("purpose") || "").toString().trim() || null,
    institution: (formData.get("institution") || "").toString().trim() || null,
    contactName: (formData.get("contactName") || "").toString().trim() || null,
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  const d = parsed.data;

  // Mitglieder-Rabatt wird im Angebot bewusst NICHT berücksichtigt (members: 0)
  // — konservative Kalkulation; Mitglieder gebt ihr beim verbindlichen Buchen an.
  const persons: Persons = {
    adults: d.adults,
    members: 0,
    children: d.children,
    pupils: d.pupils,
    teachers: d.teachers,
  };

  const input = {
    persons,
    arrival: d.arrival,
    departure: d.departure,
    soloUse: false,
    locale: "de" as const,
  };

  const issues = validateBookingInput(input);
  if (issues.length > 0) {
    return { ok: false, error: issues[0].message };
  }

  // Aktuelle Tarife (Saison/DB) auflösen und durch die Engine rechnen
  const tariffs = await resolveTariffs(d.arrival);
  const breakdown = calculatePrice({ ...input, tariffs });

  // Positions-Snapshot aus der Engine-Rückgabe: Übernachtungs-Posten,
  // Endreinigung und ggf. Mindestbelegungs-Aufschlag. Das Detail
  // (z. B. "20 × 2 Nächte") wandert mit ins Label, damit die eingefrorene
  // Kalkulation auch ohne Engine nachvollziehbar bleibt.
  const lineItems = breakdown.lines.map((l) => ({
    label: l.detail ? `${l.label} — ${l.detail}` : l.label,
    totalCents: l.totalCents,
  }));

  // Token ist das Secret des Links (48 Hex-Zeichen)
  const token = randomBytes(24).toString("hex");

  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + OFFER_VALID_DAYS);
  const validUntil = toLocalIso(validUntilDate);

  await db.insert(offers).values({
    token,
    arrival: d.arrival,
    departure: d.departure,
    adults: d.adults,
    children: d.children,
    pupils: d.pupils,
    teachers: d.teachers,
    purpose: d.purpose,
    institution: d.institution,
    contactName: d.contactName,
    lineItems,
    subtotalCents: breakdown.subtotalCents,
    depositCents: breakdown.depositCents,
    kurtaxeCents: breakdown.kurtaxeCents,
    validUntil,
  });

  return { ok: true, token, validUntil };
}
