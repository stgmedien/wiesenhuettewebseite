/**
 * Storno-Regelwerk für die UI-Anzeige (Buchungsflow). Muss inhaltlich zur
 * verbindlichen Staffel in pricing.ts (CANCELLATION_TIERS) und den AGB § 5
 * passen — Vorstandsbeschluss 04.07.2026.
 *
 * Logik (von Anreise rückwärts gerechnet, Basis: reiner Übernachtungspreis;
 * Endreinigung und Kaution werden im Stornofall nicht fällig):
 *  - > 30 Tage vorher: 100 % Rückerstattung (kostenlos)
 *  - 30 - 14 Tage:      50 % Rückerstattung
 *  -  < 14 Tage:         0 % (Übernachtungspreis verfällt)
 */

import type { Locale } from "@/lib/i18n-shared";

export type CancellationTier = {
  daysBeforeArrival: number;
  refundPercent: number;
  label: string;
};

const TIER_LABELS: Record<Locale, [string, string, string]> = {
  de: [
    "Mehr als 30 Tage vorher",
    "30 bis 14 Tage vorher",
    "Weniger als 14 Tage vorher",
  ],
  en: [
    "More than 30 days in advance",
    "30 to 14 days in advance",
    "Less than 14 days in advance",
  ],
  nl: [
    "Meer dan 30 dagen vooraf",
    "30 tot 14 dagen vooraf",
    "Minder dan 14 dagen vooraf",
  ],
};

const buildTiers = (locale: Locale): CancellationTier[] => [
  { daysBeforeArrival: 30, refundPercent: 100, label: TIER_LABELS[locale][0] },
  { daysBeforeArrival: 14, refundPercent: 50, label: TIER_LABELS[locale][1] },
  { daysBeforeArrival: 0, refundPercent: 0, label: TIER_LABELS[locale][2] },
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
