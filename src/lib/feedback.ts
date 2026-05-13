/**
 * Helpers für das interne Feedback-System.
 *
 * Workflow:
 *  1. Cron (daily-mail-jobs) prüft Buchungen mit Abreise vor X Tagen, die noch
 *     keinen feedback_entries-Eintrag haben → erzeugt Token, sendet Mail.
 *  2. Gast öffnet /feedback/[token] → Token-Hash-Lookup → Form rendert.
 *  3. Submit füllt die Response-Felder + setzt respondedAt.
 *  4. Manager-Dashboard /m/feedback zeigt Analytics + Antworten.
 */

import crypto from "crypto";

const TOKEN_BYTES = 32;
export const FEEDBACK_TTL_DAYS = 90;
export const FEEDBACK_DELAY_DAYS_AFTER_DEPARTURE = 2;

export function generateFeedbackToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashFeedbackToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function feedbackUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, "")}/feedback/${token}`;
}

export function feedbackExpiry(): Date {
  return new Date(Date.now() + FEEDBACK_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Aggregations-Helper für Dashboard: durchschnittliches Rating einer Spalte
 * unter Berücksichtigung von null-Werten.
 */
export function averageRating(values: Array<number | null>): number | null {
  const filtered = values.filter((v): v is number => v !== null && v !== undefined);
  if (filtered.length === 0) return null;
  return filtered.reduce((a, b) => a + b, 0) / filtered.length;
}

/**
 * NPS-Score (Net Promoter Score): % Promotoren (5★) minus % Detraktoren (1-3★).
 * Klassisch ist NPS für 1-10 definiert, aber wir mappen 1-5:
 *   - 5 = Promotor
 *   - 4 = Passiv
 *   - 1-3 = Detraktor
 */
export function calculateNps(overallRatings: Array<number | null>): number | null {
  const valid = overallRatings.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  const promoters = valid.filter((v) => v >= 5).length;
  const detractors = valid.filter((v) => v <= 3).length;
  return Math.round(((promoters - detractors) / valid.length) * 100);
}
