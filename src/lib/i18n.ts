/**
 * SERVER-ONLY i18n-Helpers. Importiert next/headers — kann NICHT in Client-
 * Components verwendet werden.
 *
 * Für Client-Components → @/lib/i18n-shared importieren (t, translations, Locale, etc.)
 */

import { cookies } from "next/headers";
import type { Locale } from "./i18n-shared";

export type { Locale } from "./i18n-shared";
export {
  LOCALES,
  LOCALE_LABELS,
  translations,
  t,
  makeT,
} from "./i18n-shared";

const COOKIE_NAME = "wh_lang";
const COOKIE_MAX_AGE_DAYS = 365;

export const COOKIE_OPTIONS = {
  name: COOKIE_NAME,
  maxAge: COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
} as const;

/**
 * Server-side: locale aus Cookie lesen. Default "de".
 */
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (raw === "en" || raw === "nl") return raw;
  return "de";
}
