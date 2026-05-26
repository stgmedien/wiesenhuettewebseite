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
    adultsNonMember: "Erwachsene (Nichtmitglieder)",
    members: "Erwachsene Vereinsmitglieder",
    children: "Kinder (4–15 Jahre)",
    pupils: "Schüler (Schulgruppe)",
    energyFlat: "Energiepauschale",
    cleaning: "Endreinigung (Pflicht)",
    soloSurcharge: "Aufschlag Allein-/Exklusivnutzung",
    nights: "Nächte",
    detailNXN: (q, n) => `${q} × ${n} Nächte`,
    detailNightsAt: (n, perNight) => `${n} Nächte × ${perNight}`,
    validMinNights: (n) => `Mindestaufenthalt ${n} Nächte.`,
    validMinPersons: (n) => `Mindestbelegung ${n} Personen.`,
    validMaxPersons: (n) => `Maximalbelegung ${n} Personen.`,
    validDepartureAfter: "Abreise muss nach Anreise liegen.",
    validArrivalNotPast: "Anreise darf nicht in der Vergangenheit liegen.",
  },
  en: {
    adultsNonMember: "Adults (non-members)",
    members: "Adult club members",
    children: "Children (4–15 years)",
    pupils: "Pupils (school group)",
    energyFlat: "Energy flat-rate",
    cleaning: "Final cleaning (mandatory)",
    soloSurcharge: "Exclusive-use surcharge",
    nights: "nights",
    detailNXN: (q, n) => `${q} × ${n} nights`,
    detailNightsAt: (n, perNight) => `${n} nights × ${perNight}`,
    validMinNights: (n) => `Minimum stay ${n} nights.`,
    validMinPersons: (n) => `Minimum ${n} guests.`,
    validMaxPersons: (n) => `Maximum ${n} guests.`,
    validDepartureAfter: "Departure must be after arrival.",
    validArrivalNotPast: "Arrival cannot be in the past.",
  },
  nl: {
    adultsNonMember: "Volwassenen (geen lid)",
    members: "Volwassen verenigingsleden",
    children: "Kinderen (4–15 jaar)",
    pupils: "Leerlingen (schoolgroep)",
    energyFlat: "Energiepakket",
    cleaning: "Eindschoonmaak (verplicht)",
    soloSurcharge: "Toeslag exclusief gebruik",
    nights: "nachten",
    detailNXN: (q, n) => `${q} × ${n} nachten`,
    detailNightsAt: (n, perNight) => `${n} nachten × ${perNight}`,
    validMinNights: (n) => `Minimaal ${n} nachten.`,
    validMinPersons: (n) => `Minimaal ${n} personen.`,
    validMaxPersons: (n) => `Maximaal ${n} personen.`,
    validDepartureAfter: "Vertrek moet na aankomst liggen.",
    validArrivalNotPast: "Aankomst mag niet in het verleden liggen.",
  },
};

export const PRICES = {
  // pro Person & Nacht
  adultNonMemberCents: 1800,   // 18,00 € — Erwachsene Nichtmitglieder ab 16 (inkl. Lehrkräfte)
  adultMemberCents: 750,       // 7,50 € — Erwachsene Vereinsmitglieder
  childCents: 1000,            // 10,00 € — Kinder 4–15 J.
  pupilCents: 750,             // 7,50 € — Schüler bei Schulgruppen

  // Pauschalen
  energyFlatPerNightCents: 2200,      // 22,00 € pro Nacht (gesamt)
  cleaningCents: 19000,               // 190,00 € einmalig (PFLICHT)
  soloSurchargeCents: 5000,           // 50,00 € Aufschlag bei Allein-/Exklusivnutzung
  depositCents: 30000,                // 300,00 € Kaution (Erstattung in 14 Tagen)
} as const;

export const RULES = {
  minNights: 2,
  minPersons: 10,
  maxPersons: 33,
  prepaymentPercent: 50,        // Anzahlung-Anteil bei Buchung in %
  // Hinweis: cleaningDaysAfterDeparture ist jetzt eine Manager-Einstellung
  // (site_settings-Tabelle, abrufbar über getSiteSettings()). Default = 1.
} as const;

// Cancellation tiers (vom subtotal exkl. Kaution)
// > 30 Tage 0 %, 29–14 Tage 30 %, 13–7 Tage 60 %, < 7 Tage 90 %
export const CANCELLATION_TIERS = [
  { minDaysBefore: 30, percent: 0 },
  { minDaysBefore: 14, percent: 30 },
  { minDaysBefore: 7, percent: 60 },
  { minDaysBefore: 0, percent: 90 },
] as const;

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

  const energyFlatCents = PRICES.energyFlatPerNightCents * nights;
  const cleaningCents = PRICES.cleaningCents; // Pflicht
  const soloSurchargeCents = input.soloUse ? PRICES.soloSurchargeCents : 0;
  const extrasCents = (input.extras ?? []).reduce((acc, e) => acc + e.totalCents, 0);

  const subtotalCents =
    accommodationCents +
    energyFlatCents +
    cleaningCents +
    soloSurchargeCents +
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
    label: L.energyFlat,
    detail: L.detailNightsAt(nights, formatEuro(PRICES.energyFlatPerNightCents, input.locale)),
    qty: nights,
    unitCents: PRICES.energyFlatPerNightCents,
    totalCents: energyFlatCents,
  });
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

export const cancellationFee = (
  subtotalCents: number,
  arrival: Date | string
): { percent: number; feeCents: number } => {
  const days = Math.ceil(
    (toDate(arrival).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  for (const tier of CANCELLATION_TIERS) {
    if (days >= tier.minDaysBefore) {
      return { percent: tier.percent, feeCents: Math.round((subtotalCents * tier.percent) / 100) };
    }
  }
  return { percent: 90, feeCents: Math.round((subtotalCents * 90) / 100) };
};
