"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE_OPTIONS, LOCALES, type Locale } from "@/lib/i18n";

export async function setLocale(locale: Locale) {
  if (!LOCALES.includes(locale)) return;
  const c = await cookies();
  c.set(COOKIE_OPTIONS.name, locale, {
    maxAge: COOKIE_OPTIONS.maxAge,
    path: "/",
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
