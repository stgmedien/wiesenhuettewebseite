/**
 * Tarif-Lookup gegen die DB. Loest fuer ein gegebenes Datum (Anreise) und
 * eine Personenkategorie den passenden Preis pro Nacht auf.
 *
 *  1. Saison-Auflösung: aktive Saisons werden mit MM-DD-Range gegen die
 *     Anreise gematched; bei Ueberschneidung gewinnt die mit der hoechsten
 *     priority. Wenn keine Saison passt, gilt season=null (Basistarif).
 *  2. Tarif-Auflösung: aktive Tarife fuer die Kategorie + matchende Saison.
 *     Wenn kein Tarif fuer die Saison existiert, faellt es auf einen
 *     Tarif mit seasonId=null zurueck. Wenn auch keiner: hardcoded PRICES.
 *  3. validFrom/validUntil-Range wird respektiert (gegen das Datum geprueft).
 */

import { db } from "@/lib/db";
import { tariffs, seasons } from "@/lib/db/schema";
import { eq, and, lte, gte, or, isNull, desc } from "drizzle-orm";
import { PRICES } from "@/lib/pricing";

export type TariffCategory = "mitglied" | "nichtmitglied" | "kind" | "schueler" | "lehrer";

export type ResolvedTariffs = {
  mitglied: number;
  nichtmitglied: number;
  kind: number;
  schueler: number;
  lehrer: number;
  seasonName: string | null;
};

const FALLBACK: ResolvedTariffs = {
  mitglied: PRICES.adultMemberCents,
  nichtmitglied: PRICES.adultNonMemberCents,
  kind: PRICES.childCents,
  schueler: PRICES.pupilCents,
  lehrer: PRICES.adultNonMemberCents, // Lehrkräfte zahlen wie Nichtmitglieder
  seasonName: null,
};

const dateToMonthDay = (iso: string): string => {
  // "2026-12-15" -> "12-15"
  return iso.slice(5);
};

const monthDayInRange = (
  md: string,
  start: string,
  end: string
): boolean => {
  // Saison kann ueber Jahreswechsel laufen (z.B. "12-15" -> "03-15").
  // In dem Fall: in Range, wenn md >= start ODER md <= end.
  if (start <= end) {
    return md >= start && md <= end;
  }
  return md >= start || md <= end;
};

export const resolveActiveSeason = async (
  arrivalIso: string
): Promise<{ id: string; name: string; priority: number } | null> => {
  const all = await db
    .select({
      id: seasons.id,
      name: seasons.name,
      priority: seasons.priority,
      startMonthDay: seasons.startMonthDay,
      endMonthDay: seasons.endMonthDay,
    })
    .from(seasons)
    .where(eq(seasons.active, true))
    .orderBy(desc(seasons.priority));

  const md = dateToMonthDay(arrivalIso);
  for (const s of all) {
    if (monthDayInRange(md, s.startMonthDay, s.endMonthDay)) {
      return { id: s.id, name: s.name, priority: s.priority };
    }
  }
  return null;
};

export const resolveTariffs = async (
  arrivalIso: string
): Promise<ResolvedTariffs> => {
  const season = await resolveActiveSeason(arrivalIso);
  const today = arrivalIso;

  // Alle aktiven Tarife (mit oder ohne Saison-Bindung)
  const rows = await db
    .select()
    .from(tariffs)
    .where(
      and(
        eq(tariffs.active, true),
        or(isNull(tariffs.validFrom), lte(tariffs.validFrom, today)),
        or(isNull(tariffs.validUntil), gte(tariffs.validUntil, today))
      )
    );

  // Pro Kategorie: zuerst saisonspezifischer Tarif, dann saisonloser, dann Fallback.
  const result: ResolvedTariffs = { ...FALLBACK };
  if (season) result.seasonName = season.name;

  const categories: TariffCategory[] = [
    "mitglied",
    "nichtmitglied",
    "kind",
    "schueler",
    "lehrer",
  ];

  for (const cat of categories) {
    const matching = rows.filter((r) => r.category === cat);
    if (matching.length === 0) continue;

    // Saison-spezifisch
    let chosen = season
      ? matching.find((r) => r.seasonId === season.id)
      : undefined;
    // Fallback auf saisonlos
    if (!chosen) chosen = matching.find((r) => r.seasonId === null);
    // Letzte Reserve: erster aktiver Tarif
    if (!chosen) chosen = matching[0];

    if (chosen) {
      result[cat] = chosen.priceCentsPerNight;
    }
  }

  return result;
};

type LegacyPricedBooking = {
  arrival: string;
  legacyNichtmitgliedCents: number | null;
  legacyMitgliedCents: number | null;
  legacyKindCents: number | null;
  legacySchuelerCents: number | null;
};

/**
 * Wie resolveTariffs(), aber respektiert einen Alt-Vertrag (fest vereinbarte
 * Preise, siehe Spalten-Kommentar in schema.ts): Ist auch nur einer der vier
 * legacy*Cents-Werte gesetzt, gelten diese fest — resolveTariffs() (aktuelle
 * Saison/Tarife) wird dann NICHT aufgerufen, auch nicht bei spaeteren
 * Personenkorrekturen. So bleibt der urspruenglich vereinbarte Preis
 * garantiert, unabhaengig von spaeteren Preiserhoehungen.
 */
export const resolveBookingTariffs = async (
  booking: LegacyPricedBooking
): Promise<ResolvedTariffs> => {
  const isLegacy =
    booking.legacyNichtmitgliedCents !== null ||
    booking.legacyMitgliedCents !== null ||
    booking.legacyKindCents !== null ||
    booking.legacySchuelerCents !== null;

  if (!isLegacy) {
    return resolveTariffs(booking.arrival);
  }

  const nichtmitglied = booking.legacyNichtmitgliedCents ?? PRICES.adultNonMemberCents;
  return {
    nichtmitglied,
    mitglied: booking.legacyMitgliedCents ?? PRICES.adultMemberCents,
    kind: booking.legacyKindCents ?? PRICES.childCents,
    schueler: booking.legacySchuelerCents ?? PRICES.pupilCents,
    lehrer: nichtmitglied, // Lehrkraefte zahlen wie Nichtmitglieder
    seasonName: null,
  };
};
