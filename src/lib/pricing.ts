// =============================================================
// Wiesenhütte Pricing Engine
// Stand: 01.07.2024 (gültig ab 01.01.2025)
// Alle Preise in Cents (Integer) für GoBD/Buchhaltung.
//
// Hinweis: Kurtaxe wird seit Mai 2026 NICHT mehr über die Wiesenhütte
// abgerechnet. Der Bucher erhält nach Buchung eine separate E-Mail mit
// einem Link zum offiziellen Kurtaxen-Portal Hochsauerland.
// Endreinigung ist Pflicht.
// =============================================================

import type { Locale } from "@/lib/i18n-shared";

// Lokalisierte Bezeichnungen fuer Buchungs-Positions-Labels und Validierungs-Fehler.
const PRICING_LABELS: Record<Locale, {
  adultsNonMember: string;
  members: string;
  children: string;
  pupils: string;
  energyFlat: string;
  cleaning: string;
  soloSurcharge: string;
  minOccupancySurcharge: string;
  minOccupancyDetail: (missing: number, nights: number) => string;
  nights: string;
  detailNXN: (q: number, n: number) => string;
  detailNightsAt: (n: number, perNight: string) => string;
  validMinNights: (n: number) => string;
  validMinPersons: (n: number) => string;
  validMaxPersons: (n: number) => string;
  validDepartureAfter: string;
  validArrivalNotPast: string;
}> = {
  de: {
    adultsNonMember: "Erwachsene",
    members: "Erwachsene · Mitglied (−50 %)",
    children: "Kinder/Schüler bis 16 Jahre",
    pupils: "Kinder/Schüler bis 16 · Mitglied (−50 %)",
    energyFlat: "Energiepauschale",
    cleaning: "Endreinigung (Pflicht)",
    soloSurcharge: "Aufschlag Allein-/Exklusivnutzung",
    minOccupancySurcharge: "Aufschlag Mindestbelegung (15)",
    minOccupancyDetail: (missing, nights) =>
      `${missing} fehlende Personen × ${nights} Nächte (Durchschnittstarif)`,
    nights: "Nächte",
    detailNXN: (q, n) => `${q} × ${n} Nächte`,
    detailNightsAt: (n, perNight) => `${n} Nächte × ${perNight}`,
    validMinNights: (n) => `Mindestaufenthalt ${n} Nächte.`,
    validMinPersons: (n) => `Mindestens ${n} Person.`,
    validMaxPersons: (n) => `Maximalbelegung ${n} Personen.`,
    validDepartureAfter: "Abreise muss nach Anreise liegen.",
    validArrivalNotPast: "Anreise darf nicht in der Vergangenheit liegen.",
  },
  en: {
    adultsNonMember: "Adults",
    members: "Adults · member (−50%)",
    children: "Children/pupils up to 16",
    pupils: "Children/pupils up to 16 · member (−50%)",
    energyFlat: "Energy flat-rate",
    cleaning: "Final cleaning (mandatory)",
    soloSurcharge: "Exclusive-use surcharge",
    minOccupancySurcharge: "Minimum-occupancy surcharge (15)",
    minOccupancyDetail: (missing, nights) =>
      `${missing} missing guests × ${nights} nights (average rate)`,
    nights: "nights",
    detailNXN: (q, n) => `${q} × ${n} nights`,
    detailNightsAt: (n, perNight) => `${n} nights × ${perNight}`,
    validMinNights: (n) => `Minimum stay ${n} nights.`,
    validMinPersons: (n) => `Minimum ${n} guest.`,
    validMaxPersons: (n) => `Maximum ${n} guests.`,
    validDepartureAfter: "Departure must be after arrival.",
    validArrivalNotPast: "Arrival cannot be in the past.",
  },
  nl: {
    adultsNonMember: "Volwassenen",
    members: "Volwassenen · lid (−50%)",
    children: "Kinderen/leerlingen tot 16",
    pupils: "Kinderen/leerlingen tot 16 · lid (−50%)",
    energyFlat: "Energiepakket",
    cleaning: "Eindschoonmaak (verplicht)",
    soloSurcharge: "Toeslag exclusief gebruik",
    minOccupancySurcharge: "Toeslag minimale bezetting (15)",
    minOccupancyDetail: (missing, nights) =>
      `${missing} ontbrekende personen × ${nights} nachten (gemiddeld tarief)`,
    nights: "nachten",
    detailNXN: (q, n) => `${q} × ${n} nachten`,
    detailNightsAt: (n, perNight) => `${n} nachten × ${perNight}`,
    validMinNights: (n) => `Minimaal ${n} nachten.`,
    validMinPersons: (n) => `Minimaal ${n} persoon.`,
    validMaxPersons: (n) => `Maximaal ${n} personen.`,
    validDepartureAfter: "Vertrek moet na aankomst liggen.",
    validArrivalNotPast: "Aankomst mag niet in het verleden liggen.",
  },
};

export const PRICES = {
  // pro Person & Nacht — Preisliste Stand 2026 (Mitglieder −50 %).
  adultNonMemberCents: 2200,   // 22,00 € — Erwachsene (ab 16 J., inkl. Lehrkräfte)
  adultMemberCents: 1100,      // 11,00 € — Erwachsene · Vereinsmitglied (−50 %)
  childCents: 1200,            // 12,00 € — Kinder/Schüler bis 16 J.
  pupilCents: 600,             // 6,00 € — Kinder/Schüler bis 16 J. · Vereinsmitglied (−50 %)

  // Pauschalen
  energyFlatPerNightCents: 2200,      // 22,00 € pro Nacht (gesamt)
  cleaningCents: 19000,               // 190,00 € einmalig (PFLICHT)
  soloSurchargeCents: 5000,           // 50,00 € Aufschlag bei Allein-/Exklusivnutzung
  depositCents: 30000,                // 300,00 € Kaution (Erstattung in 14 Tagen)
} as const;

export const RULES = {
  minNights: 2,
  // Absolute Untergrenze für Personenzahl (mindestens 1 Gast). Echte
  // Mindestabrechnungs-Grenze ist `minOccupancyFloor` — bei Unterschreitung
  // fällt ein Aufschlag an, die Buchung ist aber NICHT blockiert.
  minPersons: 1,
  // Mindestbelegung für die Preisberechnung. Buchungen mit weniger Personen
  // werden so abgerechnet, als wären `minOccupancyFloor` Gäste gebucht
  // (Pro-rata-Aufschlag aus dem tatsächlichen Personen-Mix).
  minOccupancyFloor: 15,
  maxPersons: 33,
  prepaymentPercent: 50,        // Anzahlung-Anteil bei Buchung in %
  // Hinweis: cleaningDaysAfterDeparture ist jetzt eine Manager-Einstellung
  // (site_settings-Tabelle, abrufbar über getSiteSettings()). Default = 1.
} as const;

// Storno-Staffel (Vorstandsbeschluss 04.07.2026) — gerechnet auf den REINEN
// ÜBERNACHTUNGSPREIS (accommodationCents). Endreinigung und Kaution werden
// im Stornofall gar nicht erst fällig.
// > 30 Tage 0 %, 30–14 Tage 50 %, < 14 Tage 100 %
export const CANCELLATION_TIERS = [
  { minDaysBefore: 30, percent: 0 },
  { minDaysBefore: 14, percent: 50 },
  { minDaysBefore: 0, percent: 100 },
] as const;

// Alt-Staffel für Buchungen VOR dem Stichtag (haben die alten AGB
// akzeptiert): gerechnet auf die Zwischensumme inkl. Endreinigung.
export const CANCELLATION_TIERS_LEGACY = [
  { minDaysBefore: 30, percent: 0 },
  { minDaysBefore: 14, percent: 30 },
  { minDaysBefore: 7, percent: 60 },
  { minDaysBefore: 0, percent: 90 },
] as const;

// Stichtag: Buchungen ab diesem Zeitpunkt fallen unter die neue Staffel.
export const CANCELLATION_POLICY_CUTOFF = new Date("2026-07-05T00:00:00+02:00");

export type Persons = {
  adults: number;       // Erwachsene Nichtmitglieder ab 16
  members: number;      // Erwachsene Vereinsmitglieder ab 16
  children: number;     // Kinder 4–15
  pupils: number;       // Schüler in Schulgruppen
  teachers: number;     // Lehrkräfte (zählen wie Erwachsene Nichtmitglieder)
};

export type ExtraLine = {
  id: string;
  label: string;
  qty: number;
  unitCents: number;
  totalCents: number;
};

export type PriceBreakdown = {
  nights: number;
  totalPersons: number;
  accommodationCents: number;
  energyFlatCents: number;
  cleaningCents: number;
  soloSurchargeCents: number;
  /** Aufschlag bei Unterschreitung der Mindestbelegung (15 Personen). */
  minOccupancySurchargeCents: number;
  extrasCents: number;
  subtotalCents: number;       // ohne Kaution
  depositCents: number;        // Kaution (separat)
  prepaymentCents: number;     // 50 % Anzahlung — heute zu zahlen
  remainderCents: number;      // 50 % Restzahlung — 14 Tage vor Anreise (Auto-Einzug per Cron)
  totalDueCents: number;       // Anzahlung + (vorautorisierte) Kaution = heute fällig
  lines: PriceLine[];
};

export type PriceLine = {
  label: string;
  detail?: string;
  qty: number;
  unitCents: number;
  totalCents: number;
};

export type PriceInput = {
  persons: Persons;
  arrival: Date | string;
  departure: Date | string;
  soloUse: boolean;
  extras?: ExtraLine[];
  /**
   * Optional: aufgeloeste Tarife (z.B. aus DB via resolveTariffs()).
   * Wenn nicht gesetzt, wird die hardcoded PRICES-Konstante verwendet.
   */
  tariffs?: {
    mitglied: number;
    nichtmitglied: number;
    kind: number;
    schueler: number;
    lehrer: number;
    seasonName?: string | null;
  };
  /**
   * Locale fuer Bezeichnungen in `lines[]` und Validierungs-Fehlern.
   * Default: "de" (Backwards-compat).
   */
  locale?: Locale;
};

const toDate = (d: Date | string) => (typeof d === "string" ? new Date(d) : d);

export const nightsBetween = (arrival: Date | string, departure: Date | string): number => {
  const a = toDate(arrival);
  const b = toDate(departure);
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

export const sumPersons = (p: Persons): number =>
  p.adults + p.members + p.children + p.pupils + p.teachers;

export type ValidationIssue = { field: string; message: string };

export const validateBookingInput = (input: PriceInput): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const nights = nightsBetween(input.arrival, input.departure);
  const persons = sumPersons(input.persons);
  const L = PRICING_LABELS[input.locale ?? "de"];

  if (nights < RULES.minNights) {
    issues.push({ field: "dates", message: L.validMinNights(RULES.minNights) });
  }
  if (persons < RULES.minPersons) {
    issues.push({ field: "persons", message: L.validMinPersons(RULES.minPersons) });
  }
  if (persons > RULES.maxPersons) {
    issues.push({ field: "persons", message: L.validMaxPersons(RULES.maxPersons) });
  }
  if (toDate(input.arrival) >= toDate(input.departure)) {
    issues.push({ field: "dates", message: L.validDepartureAfter });
  }
  if (toDate(input.arrival) < new Date(new Date().toDateString())) {
    issues.push({ field: "dates", message: L.validArrivalNotPast });
  }

  return issues;
};

export const calculatePrice = (input: PriceInput): PriceBreakdown => {
  const L = PRICING_LABELS[input.locale ?? "de"];
  const nights = nightsBetween(input.arrival, input.departure);
  const p = input.persons;
  const adultsNonMember = p.adults + p.teachers; // Lehrkräfte zählen als Nichtmitglieder

  // Tarif-Resolution: pro Kategorie aktiver DB-Tarif oder Fallback
  const T = input.tariffs;
  const adultNonMemberCents = T?.nichtmitglied ?? PRICES.adultNonMemberCents;
  const adultMemberCents = T?.mitglied ?? PRICES.adultMemberCents;
  const childCents = T?.kind ?? PRICES.childCents;
  const pupilCents = T?.schueler ?? PRICES.pupilCents;
  const teacherCents = T?.lehrer ?? PRICES.adultNonMemberCents;

  const accommodationCents =
    p.adults * adultNonMemberCents * nights +
    p.teachers * teacherCents * nights +
    p.members * adultMemberCents * nights +
    p.children * childCents * nights +
    p.pupils * pupilCents * nights;

  // Energie ist seit 2026 in den Übernachtungspreisen enthalten — keine separate
  // Pauschale mehr. Feld bleibt (=0) für persistierte Bestandsbuchungen erhalten.
  const energyFlatCents = 0;
  const cleaningCents = PRICES.cleaningCents; // Pflicht
  const soloSurchargeCents = input.soloUse ? PRICES.soloSurchargeCents : 0;
  const extrasCents = (input.extras ?? []).reduce((acc, e) => acc + e.totalCents, 0);

  // Mindestbelegungs-Aufschlag (15-Personen-Floor).
  // Wenn die tatsächliche Personenzahl < minOccupancyFloor liegt, rechnen
  // wir die fehlenden Personen zum DURCHSCHNITTSTARIF des tatsächlichen
  // Mixes hinzu. So zahlt eine Gruppe mit 10 Vereinsmitgliedern weniger
  // Aufschlag als 10 Nichtmitglieder, aber jede Buchung erreicht
  // mindestens das 15-Personen-Preisniveau.
  const totalPersonsActual = sumPersons(p);
  let minOccupancySurchargeCents = 0;
  if (
    totalPersonsActual > 0 &&
    totalPersonsActual < RULES.minOccupancyFloor &&
    nights > 0
  ) {
    const missing = RULES.minOccupancyFloor - totalPersonsActual;
    // Durchschnittstarif je Person & Nacht (ganzzahlig in Cents).
    const avgPerPersonPerNight = Math.round(
      accommodationCents / (totalPersonsActual * nights)
    );
    minOccupancySurchargeCents = missing * avgPerPersonPerNight * nights;
  }

  const subtotalCents =
    accommodationCents +
    cleaningCents +
    soloSurchargeCents +
    minOccupancySurchargeCents +
    extrasCents;

  const depositCents = PRICES.depositCents;
  const prepaymentCents = Math.round((subtotalCents * RULES.prepaymentPercent) / 100);
  const remainderCents = subtotalCents - prepaymentCents;
  // "Heute fällig": Anzahlung + Kaution
  const totalDueCents = prepaymentCents + depositCents;

  const lines: PriceLine[] = [];
  if (adultsNonMember > 0) {
    const blendedUnit =
      p.adults > 0
        ? adultNonMemberCents
        : teacherCents; // wenn nur Lehrer, nutze Lehrer-Tarif
    const totalC =
      p.adults * adultNonMemberCents * nights + p.teachers * teacherCents * nights;
    lines.push({
      label: L.adultsNonMember,
      detail: L.detailNXN(adultsNonMember, nights),
      qty: adultsNonMember * nights,
      unitCents: blendedUnit,
      totalCents: totalC,
    });
  }
  if (p.members > 0) {
    lines.push({
      label: L.members,
      detail: L.detailNXN(p.members, nights),
      qty: p.members * nights,
      unitCents: adultMemberCents,
      totalCents: p.members * adultMemberCents * nights,
    });
  }
  if (p.children > 0) {
    lines.push({
      label: L.children,
      detail: L.detailNXN(p.children, nights),
      qty: p.children * nights,
      unitCents: childCents,
      totalCents: p.children * childCents * nights,
    });
  }
  if (p.pupils > 0) {
    lines.push({
      label: L.pupils,
      detail: L.detailNXN(p.pupils, nights),
      qty: p.pupils * nights,
      unitCents: pupilCents,
      totalCents: p.pupils * pupilCents * nights,
    });
  }
  lines.push({
    label: L.cleaning,
    qty: 1,
    unitCents: PRICES.cleaningCents,
    totalCents: cleaningCents,
  });
  if (soloSurchargeCents > 0) {
    lines.push({
      label: L.soloSurcharge,
      qty: 1,
      unitCents: PRICES.soloSurchargeCents,
      totalCents: soloSurchargeCents,
    });
  }
  if (minOccupancySurchargeCents > 0) {
    const missing = RULES.minOccupancyFloor - totalPersonsActual;
    lines.push({
      label: L.minOccupancySurcharge,
      detail: L.minOccupancyDetail(missing, nights),
      qty: 1,
      unitCents: minOccupancySurchargeCents,
      totalCents: minOccupancySurchargeCents,
    });
  }
  for (const e of input.extras ?? []) {
    lines.push({
      label: e.label,
      detail: `${e.qty} × ${formatEuro(e.unitCents, input.locale)}`,
      qty: e.qty,
      unitCents: e.unitCents,
      totalCents: e.totalCents,
    });
  }

  return {
    nights,
    totalPersons: sumPersons(p),
    accommodationCents,
    energyFlatCents,
    cleaningCents,
    soloSurchargeCents,
    minOccupancySurchargeCents,
    extrasCents,
    subtotalCents,
    depositCents,
    prepaymentCents,
    remainderCents,
    totalDueCents,
    lines,
  };
};

const FORMAT_LOCALES: Record<Locale, string> = {
  de: "de-DE",
  en: "en-IE", // Irish-EN: nutzt Euro mit Punkt-Dezimaltrennzeichen, native English wording
  nl: "nl-NL",
};

export const formatEuro = (cents: number, locale: Locale = "de"): string => {
  const euros = cents / 100;
  return euros.toLocaleString(FORMAT_LOCALES[locale], {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const feeFromTiers = (
  baseCents: number,
  arrival: Date | string,
  tiers: readonly { minDaysBefore: number; percent: number }[]
): { percent: number; feeCents: number } => {
  const days = Math.ceil(
    (toDate(arrival).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  for (const tier of tiers) {
    if (days >= tier.minDaysBefore) {
      return { percent: tier.percent, feeCents: Math.round((baseCents * tier.percent) / 100) };
    }
  }
  const last = tiers[tiers.length - 1];
  return { percent: last.percent, feeCents: Math.round((baseCents * last.percent) / 100) };
};

/** @deprecated Nur noch für Alt-Aufrufe — neue Callsites nutzen cancellationFeeForBooking. */
export const cancellationFee = (
  subtotalCents: number,
  arrival: Date | string
): { percent: number; feeCents: number } =>
  feeFromTiers(subtotalCents, arrival, CANCELLATION_TIERS_LEGACY);

/**
 * Storno-Gebühr für eine konkrete Buchung — wählt Staffel UND Basis nach
 * Buchungsdatum: Neubuchungen (ab Stichtag) zahlen die neue Staffel auf den
 * reinen Übernachtungspreis; Bestandsbuchungen die Alt-Staffel auf die
 * Zwischensumme (so wie in den damals akzeptierten AGB).
 */
export const cancellationFeeForBooking = (booking: {
  accommodationCents: number;
  subtotalCents: number;
  arrival: Date | string;
  createdAt: Date;
}): { percent: number; feeCents: number; baseCents: number; isLegacy: boolean } => {
  const isLegacy = booking.createdAt < CANCELLATION_POLICY_CUTOFF;
  const baseCents = isLegacy ? booking.subtotalCents : booking.accommodationCents;
  const tiers = isLegacy ? CANCELLATION_TIERS_LEGACY : CANCELLATION_TIERS;
  const { percent, feeCents } = feeFromTiers(baseCents, booking.arrival, tiers);
  return { percent, feeCents, baseCents, isLegacy };
};
