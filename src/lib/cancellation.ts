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

export type CancellationTier = {
  daysBeforeArrival: number;
  refundPercent: number;
  label: string;
};

export const CANCELLATION_TIERS: CancellationTier[] = [
  { daysBeforeArrival: 60, refundPercent: 100, label: "60 Tage oder mehr vorher" },
  { daysBeforeArrival: 30, refundPercent: 50, label: "30 bis 59 Tage vorher" },
  { daysBeforeArrival: 14, refundPercent: 25, label: "14 bis 29 Tage vorher" },
  { daysBeforeArrival: 0, refundPercent: 0, label: "Weniger als 14 Tage vorher" },
];

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
