import { db } from "./db";
import { siteSettings } from "./db/schema";
import { eq } from "drizzle-orm";

export type SiteSettings = {
  cleaningDaysAfterDeparture: number;
  updatedAt: Date | null;
  updatedBy: string | null;
};

const DEFAULTS: SiteSettings = {
  cleaningDaysAfterDeparture: 1,
  updatedAt: null,
  updatedBy: null,
};

/**
 * Singleton-Row aus site_settings. Falls noch keine existiert (frischer DB),
 * geben wir die Defaults zurück. Kein Caching — Tabelle hat 1 Zeile, Query ist
 * trivial; bei Bedarf später `unstable_cache` davorlegen.
 */
export const getSiteSettings = async (): Promise<SiteSettings> => {
  try {
    const rows = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, 1))
      .limit(1);
    if (!rows[0]) return DEFAULTS;
    return {
      cleaningDaysAfterDeparture: rows[0].cleaningDaysAfterDeparture,
      updatedAt: rows[0].updatedAt,
      updatedBy: rows[0].updatedBy,
    };
  } catch (err) {
    console.error("[settings] read failed, using defaults:", err);
    return DEFAULTS;
  }
};

export const updateSiteSettings = async (
  patch: { cleaningDaysAfterDeparture: number },
  updatedBy: string
): Promise<void> => {
  await db
    .insert(siteSettings)
    .values({
      id: 1,
      cleaningDaysAfterDeparture: patch.cleaningDaysAfterDeparture,
      updatedBy,
    })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: {
        cleaningDaysAfterDeparture: patch.cleaningDaysAfterDeparture,
        updatedAt: new Date(),
        updatedBy,
      },
    });
};
