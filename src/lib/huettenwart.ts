/**
 * Hüttenwart (Toni Klauke) — zentrale Konstante statt Hardcoding an mehreren
 * Stellen (Issue #68). Per Env-Variable übersteuerbar, falls sich die Adresse
 * oder die Zuständigkeit ändert.
 *
 * Bekommt Mails bei: Anzahlungseingang (Webhook), Stornierung (Manager +
 * Gast-Selbststorno) und T-7 vor Anreise (Cron, Übergabe/Abnahme).
 *
 * HUETTENWART_CC: optionale kommagetrennte Liste weiterer Empfänger (z.B.
 * Reinigungsteam Brandenburg), die bei Anzahlungseingang + Stornierung
 * als BCC mitbenachrichtigt werden.
 */
export const HUETTENWART_EMAIL = process.env.HUETTENWART_EMAIL ?? "allegro.m@gmx.de";
export const HUETTENWART_CC = process.env.HUETTENWART_CC ?? undefined;
