/**
 * Hüttenwart (Toni Klauke) — zentrale Konstante statt Hardcoding an mehreren
 * Stellen (Issue #68). Per Env-Variable übersteuerbar, falls sich die Adresse
 * oder die Zuständigkeit ändert.
 *
 * Bekommt Mails bei: Anzahlungseingang (Webhook), Stornierung (Manager +
 * Gast-Selbststorno) und T-7 vor Anreise (Cron, Übergabe/Abnahme).
 */
export const HUETTENWART_EMAIL = process.env.HUETTENWART_EMAIL ?? "allegro.m@gmx.de";
