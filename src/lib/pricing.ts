// =============================================================
// Wiesenhütte Pricing Engine
// Stand: 01.07.2024 (gültig ab 01.01.2025)
// Alle Preise in Cents (Integer) für GoBD/Buchhaltung.
// =============================================================

export const PRICES = {
  // pro Person & Nacht
  adultNonMemberCents: 1800,   // 18,00 € — Erwachsene Nichtmitglieder ab 16 (inkl. Lehrkräfte)
  adultMemberCents: 750,       // 7,50 € — Erwachsene Vereinsmitglieder
  childCents: 1000,            // 10,00 € — Kinder 4–15 J.
  pupilCents: 750,             // 7,50 € — Schüler bei Schulgruppen

  // Pauschalen
  kurtaxePerAdultPerNightCents: 220,  // 2,20 € pro Person ab 16 / Nacht
  energyFlatPerNightCents: 2200,      // 22,00 € pro Nacht (gesamt)
  cleaningCents: 19000,               // 190,00 € einmalig (optional)
  soloSurchargeCents: 5000,           // 50,00 € Aufschlag bei Allein-/Exklusivnutzung
  depositCents: 30000,                // 300,00 € Kaution (Erstattung in 14 Tagen)
} as const;

export const RULES = {
  minNights: 2,
  minPersons: 10,
  maxPersons: 33,
} as const;

// Cancellation tiers (vom subtotal exkl. Kaution)
// Vorschlag: > 30 Tage 0 %, 29–14 Tage 30 %, 13–7 Tage 60 %, < 7 Tage 90 %
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
  adultsForKurtaxe: number;
  accommodationCents: number;
  kurtaxeCents: number;
  energyFlatCents: number;
  cleaningCents: number;
  soloSurchargeCents: number;
  extrasCents: number;
  subtotalCents: number;       // ohne Kaution
  depositCents: number;        // Kaution (separat)
  totalDueCents: number;       // subtotal + Kaution
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
  cleaningOptedIn: boolean;
  soloUse: boolean;
  extras?: ExtraLine[];
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

  if (nights < RULES.minNights) {
    issues.push({ field: "dates", message: `Mindestaufenthalt ${RULES.minNights} Nächte.` });
  }
  if (persons < RULES.minPersons) {
    issues.push({
      field: "persons",
      message: `Mindestbelegung ${RULES.minPersons} Personen.`,
    });
  }
  if (persons > RULES.maxPersons) {
    issues.push({
      field: "persons",
      message: `Maximalbelegung ${RULES.maxPersons} Personen.`,
    });
  }
  if (toDate(input.arrival) >= toDate(input.departure)) {
    issues.push({ field: "dates", message: "Abreise muss nach Anreise liegen." });
  }
  if (toDate(input.arrival) < new Date(new Date().toDateString())) {
    issues.push({ field: "dates", message: "Anreise darf nicht in der Vergangenheit liegen." });
  }

  return issues;
};

export const calculatePrice = (input: PriceInput): PriceBreakdown => {
  const nights = nightsBetween(input.arrival, input.departure);
  const p = input.persons;
  const adultsNonMember = p.adults + p.teachers; // Lehrkräfte zählen als Nichtmitglieder
  const adultsForKurtaxe = adultsNonMember + p.members; // ab 16

  const accommodationCents =
    adultsNonMember * PRICES.adultNonMemberCents * nights +
    p.members * PRICES.adultMemberCents * nights +
    p.children * PRICES.childCents * nights +
    p.pupils * PRICES.pupilCents * nights;

  const kurtaxeCents = adultsForKurtaxe * PRICES.kurtaxePerAdultPerNightCents * nights;
  const energyFlatCents = PRICES.energyFlatPerNightCents * nights;
  const cleaningCents = input.cleaningOptedIn ? PRICES.cleaningCents : 0;
  const soloSurchargeCents = input.soloUse ? PRICES.soloSurchargeCents : 0;
  const extrasCents = (input.extras ?? []).reduce((acc, e) => acc + e.totalCents, 0);

  const subtotalCents =
    accommodationCents +
    kurtaxeCents +
    energyFlatCents +
    cleaningCents +
    soloSurchargeCents +
    extrasCents;

  const depositCents = PRICES.depositCents;
  const totalDueCents = subtotalCents + depositCents;

  const lines: PriceLine[] = [];
  if (adultsNonMember > 0) {
    lines.push({
      label: "Erwachsene (Nichtmitglieder)",
      detail: `${adultsNonMember} × ${nights} Nächte × 18,00 €`,
      qty: adultsNonMember * nights,
      unitCents: PRICES.adultNonMemberCents,
      totalCents: adultsNonMember * PRICES.adultNonMemberCents * nights,
    });
  }
  if (p.members > 0) {
    lines.push({
      label: "Erwachsene Vereinsmitglieder",
      detail: `${p.members} × ${nights} Nächte × 7,50 €`,
      qty: p.members * nights,
      unitCents: PRICES.adultMemberCents,
      totalCents: p.members * PRICES.adultMemberCents * nights,
    });
  }
  if (p.children > 0) {
    lines.push({
      label: "Kinder (4–15 Jahre)",
      detail: `${p.children} × ${nights} Nächte × 10,00 €`,
      qty: p.children * nights,
      unitCents: PRICES.childCents,
      totalCents: p.children * PRICES.childCents * nights,
    });
  }
  if (p.pupils > 0) {
    lines.push({
      label: "Schüler (Schulgruppe)",
      detail: `${p.pupils} × ${nights} Nächte × 7,50 €`,
      qty: p.pupils * nights,
      unitCents: PRICES.pupilCents,
      totalCents: p.pupils * PRICES.pupilCents * nights,
    });
  }
  if (kurtaxeCents > 0) {
    lines.push({
      label: "Kurtaxe (ab 16 J.)",
      detail: `${adultsForKurtaxe} × ${nights} Nächte × 2,20 €`,
      qty: adultsForKurtaxe * nights,
      unitCents: PRICES.kurtaxePerAdultPerNightCents,
      totalCents: kurtaxeCents,
    });
  }
  lines.push({
    label: "Energiepauschale",
    detail: `${nights} Nächte × 22,00 €`,
    qty: nights,
    unitCents: PRICES.energyFlatPerNightCents,
    totalCents: energyFlatCents,
  });
  if (cleaningCents > 0) {
    lines.push({
      label: "Endreinigung",
      qty: 1,
      unitCents: PRICES.cleaningCents,
      totalCents: cleaningCents,
    });
  }
  if (soloSurchargeCents > 0) {
    lines.push({
      label: "Aufschlag Allein-/Exklusivnutzung",
      qty: 1,
      unitCents: PRICES.soloSurchargeCents,
      totalCents: soloSurchargeCents,
    });
  }
  for (const e of input.extras ?? []) {
    lines.push({
      label: e.label,
      detail: `${e.qty} × ${formatEuro(e.unitCents)}`,
      qty: e.qty,
      unitCents: e.unitCents,
      totalCents: e.totalCents,
    });
  }

  return {
    nights,
    totalPersons: sumPersons(p),
    adultsForKurtaxe,
    accommodationCents,
    kurtaxeCents,
    energyFlatCents,
    cleaningCents,
    soloSurchargeCents,
    extrasCents,
    subtotalCents,
    depositCents,
    totalDueCents,
    lines,
  };
};

export const formatEuro = (cents: number): string => {
  const euros = cents / 100;
  return euros.toLocaleString("de-DE", {
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
