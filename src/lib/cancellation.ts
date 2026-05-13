/**
 * Storno-Regelwerk. Konfiguriert global, kann perspektivisch über site-settings
 * laufen — aktuell hartkodiert als sinnvolle Defaults.
 *
 * Logik (von Anreise rückwärts gerechnet):
 *  - ≥ 60 Tage vorher: 100% Rückerstattung
 *  - 30 - 59 Tage:     50% Rückerstattung
 *  - 14 - 29 Tage:     25% Rückerstattung
 *  -  <14 Tage:         0% (Buchung verfällt)
 *
 * Anwendung sowohl im /buchen-Flow (UI-Hinweis vor Checkout) als auch im
 * Kunden-Konto bei Buchungs-Detail (aktuelle Storno-Quote sichtbar) und
 * in der Buchungs-Confirmation-Mail.
 */

import type { Locale } from "@/lib/i18n-shared";

export type CancellationTier = {
  daysBeforeArrival: number;
  refundPercent: number;
  label: string;
};

const TIER_LABELS: Record<Locale, [string, string, string, string]> = {
  de: [
    "60 Tage oder mehr vorher",
    "30 bis 59 Tage vorher",
    "14 bis 29 Tage vorher",
    "Weniger als 14 Tage vorher",
  ],
  en: [
    "60 days or more in advance",
    "30 to 59 days in advance",
    "14 to 29 days in advance",
    "Less than 14 days in advance",
  ],
  nl: [
    "60 dagen of meer vooraf",
    "30 tot 59 dagen vooraf",
    "14 tot 29 dagen vooraf",
    "Minder dan 14 dagen vooraf",
  ],
};

const buildTiers = (locale: Locale): CancellationTier[] => [
  { daysBeforeArrival: 60, refundPercent: 100, label: TIER_LABELS[locale][0] },
  { daysBeforeArrival: 30, refundPercent: 50, label: TIER_LABELS[locale][1] },
  { daysBeforeArrival: 14, refundPercent: 25, label: TIER_LABELS[locale][2] },
  { daysBeforeArrival: 0, refundPercent: 0, label: TIER_LABELS[locale][3] },
];

/** Backwards-compatible Default-Export (DE). */
export const CANCELLATION_TIERS: CancellationTier[] = buildTiers("de");

/** Locale-aware Tier-Liste fuer UI-Anzeige. */
export const getCancellationTiers = (locale: Locale): CancellationTier[] => buildTiers(locale);

export function getCancellationRefundPercent(daysBeforeArrival: number): number {
  for (const tier of CANCELLATION_TIERS) {
    if (daysBeforeArrival >= tier.daysBeforeArrival) return tier.refundPercent;
  }
  return 0;
}

export function getCancellationTier(daysBeforeArrival: number): CancellationTier {
  for (const tier of CANCELLATION_TIERS) {
    if (daysBeforeArrival >= tier.daysBeforeArrival) return tier;
  }
  return CANCELLATION_TIERS[CANCELLATION_TIERS.length - 1];
}

export function daysUntil(date: Date | string): number {
  const target = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

export function calculateRefundCents(
  paidCents: number,
  daysBeforeArrival: number
): { refundCents: number; tier: CancellationTier; nonRefundableCents: number } {
  const tier = getCancellationTier(daysBeforeArrival);
  const refundCents = Math.round((paidCents * tier.refundPercent) / 100);
  return {
    refundCents,
    tier,
    nonRefundableCents: paidCents - refundCents,
  };
}
