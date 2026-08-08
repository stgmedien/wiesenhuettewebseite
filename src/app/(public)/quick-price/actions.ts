"use server";

// =============================================================
// Preis-Schnellcheck (Hero-Widget der Startseite)
// Leichtgewichtige Server-Action: berechnet fuer einen Zeitraum +
// Personenmix (Erwachsene / Kinder) den Gesamtpreis und prueft die
// Verfuegbarkeit — mit EXAKT derselben Logik wie der Buchungsflow
// (/buchen): resolveTariffs (DB-Saisontarife) + calculatePrice und
// isRangeAvailable (inkl. Reinigungstage-Puffer). So kann der Preis
// im Hero nie vom spaeteren Buchungspreis abweichen.
// =============================================================

import { z } from "zod";
import { resolveTariffs } from "@/lib/pricing-tariffs";
import {
  calculatePrice,
  validateBookingInput,
  RULES,
  type Persons,
} from "@/lib/pricing";
import { isRangeAvailable } from "@/lib/availability";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Datum im Format YYYY-MM-DD erwartet.");

const quickPriceSchema = z.object({
  arrival: isoDate,
  departure: isoDate,
  adults: z.number().int().min(0).max(RULES.maxPersons),
  children: z.number().int().min(0).max(RULES.maxPersons),
  // Optional, damit das Widget Server-Fehlermeldungen lokalisiert bekommt —
  // das Widget prevalidiert clientseitig, der Server bleibt die Wahrheit.
  locale: z.enum(["de", "en", "nl"]).optional(),
});

export type QuickPriceInput = z.infer<typeof quickPriceSchema>;

export type QuickPriceResult =
  | {
      available: boolean;
      subtotalCents: number; // Zwischensumme (Uebernachtung + Endreinigung + ggf. Mindestbelegungs-Aufschlag)
      depositCents: number; // Kaution — separat ausgewiesen
      kurtaxeCents: number; // Kurtaxe — separat ausgewiesen
      nights: number;
    }
  | { error: string };

const GENERIC_ERROR: Record<"de" | "en" | "nl", string> = {
  de: "Der Preis konnte gerade nicht berechnet werden — bitte versucht es gleich noch einmal.",
  en: "We could not calculate the price right now — please try again in a moment.",
  nl: "De prijs kon nu niet worden berekend — probeer het zo nog eens.",
};

export async function quickPrice(input: QuickPriceInput): Promise<QuickPriceResult> {
  const parsed = quickPriceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: GENERIC_ERROR[input?.locale ?? "de"] };
  }
  const { arrival, departure, adults, children, locale = "de" } = parsed.data;

  // Personenmix des Schnellchecks: nur Erwachsene (Nichtmitglieder) + Kinder.
  // Mitglieds-/Schul-Tarife brauchen Login bzw. Anlass — das klaert /buchen.
  const persons: Persons = {
    adults,
    members: 0,
    children,
    pupils: 0,
    teachers: 0,
  };

  // Gleiche Regeln wie der Buchungsflow (Mindestnaechte, Personen-Grenzen,
  // Anreise nicht in der Vergangenheit) — Meldungen kommen lokalisiert.
  const issues = validateBookingInput({
    arrival,
    departure,
    persons,
    soloUse: false,
    locale,
  });
  if (issues.length > 0) {
    return { error: issues.map((i) => i.message).join(" ") };
  }

  try {
    // Unabhaengig voneinander → parallel: DB-Tarife + Verfuegbarkeit.
    const [tariffs, available] = await Promise.all([
      resolveTariffs(arrival),
      isRangeAvailable({ arrival, departure }),
    ]);

    const breakdown = calculatePrice({
      arrival,
      departure,
      persons,
      soloUse: false,
      tariffs,
      locale,
    });

    return {
      available,
      subtotalCents: breakdown.subtotalCents,
      depositCents: breakdown.depositCents,
      kurtaxeCents: breakdown.kurtaxeCents,
      nights: breakdown.nights,
    };
  } catch (err) {
    // DB nicht erreichbar o. Ä. — Widget zeigt einen weichen Fehler, die
    // Buchung selbst bleibt davon unberuehrt.
    console.error("[quick-price] Berechnung fehlgeschlagen:", err);
    return { error: GENERIC_ERROR[locale] };
  }
}
