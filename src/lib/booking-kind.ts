// =============================================================
// Zwei Buchungspfade (Vorstand 11/2026):
//
//  - "privat"        → private Gruppen (Freunde, Familie, private
//                       Gruppenfahrt). Nur Stripe, 50 % Anzahlung sofort,
//                       Rest (+ Kaution + Kurtaxe) 14 Tage vor Anreise.
//  - "organisation"  → Schulen, Vereine, Kirchen/Gemeinden, Städte/
//                       Jugendpflege, Bildungsträger. Stripe ODER klassische
//                       Überweisung, 10 % Anzahlung sofort, Rest (+ Kaution +
//                       Kurtaxe) 30 Tage vor Anreise. Storno: bis 60 Tage vor
//                       Anreise kostenlos, danach wird nur die 10-%-Anzahlung
//                       einbehalten, nie mehr (AGB § 5).
//
// Kein eigenes DB-Feld: Eine Organisations-Buchung erkennt man an
// source "Portal" + gesetzter Institution + prepayPercent 10, angelegt ab
// ORG_FLOW_FROM. Ältere Buchungen (auch Schulbuchungen mit 10 %, deren
// prepayPercent null ist) laufen unverändert nach den alten Regeln.
// =============================================================

export type BookerKind = "privat" | "organisation";

/** Anlässe je Pfad (Keys = purposeCategory). Firmen werden nicht angeboten. */
export const PRIVATE_PURPOSE_KEYS = ["familie", "sonstiges"] as const;
export const ORG_PURPOSE_KEYS = ["klasse", "schul", "verein", "kirche", "kommune", "bildung"] as const;
export const ORG_PURPOSES = new Set<string>(ORG_PURPOSE_KEYS);

export const isOrgPurpose = (purposeCategory?: string | null): boolean =>
  !!purposeCategory && ORG_PURPOSES.has(purposeCategory);

/** Anzahlung in % bei Buchung. */
export const PRIVATE_PREPAY_PERCENT = 50;
export const ORG_PREPAY_PERCENT = 10;

/** Restzahlung (+ Kaution + Kurtaxe) wird so viele Tage vor Anreise fällig. */
export const PRIVATE_REST_LEAD_DAYS = 14;
export const ORG_REST_LEAD_DAYS = 30;

/** Klassische Überweisung erst ab so vielen Tagen Vorlauf (Rest-Frist + 1 Woche). */
export const MANUAL_TRANSFER_MIN_LEAD_DAYS = ORG_REST_LEAD_DAYS + 7;

/** Ab hier gelten die neuen Organisations-Regeln (Deploy des Features). */
export const ORG_FLOW_FROM = new Date("2026-11-23T00:00:00+01:00");

type BookingLike = {
  source?: string | null;
  institution?: string | null;
  prepayPercent?: number | null;
  createdAt?: Date | null;
};

/** Online gebuchte Organisations-Buchung nach den neuen Regeln? */
export const isOrgBooking = (b: BookingLike): boolean =>
  b.source === "Portal" &&
  !!b.institution?.trim() &&
  b.prepayPercent === ORG_PREPAY_PERCENT &&
  !!b.createdAt &&
  b.createdAt >= ORG_FLOW_FROM;

/** Tage vor Anreise, an denen die Restzahlung fällig wird. */
export const restLeadDaysFor = (b: BookingLike): number =>
  isOrgBooking(b) ? ORG_REST_LEAD_DAYS : PRIVATE_REST_LEAD_DAYS;

/** Bei Stornierung ab 60 Tagen vor Anreise einbehaltener Anteil (Obergrenze, nur Organisationen). */
export const ORG_RETAINED_PERCENT = ORG_PREPAY_PERCENT;
