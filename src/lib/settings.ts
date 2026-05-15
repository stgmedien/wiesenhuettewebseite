import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "./db";
import { siteSettings } from "./db/schema";
import { eq } from "drizzle-orm";

/** Cache-Tag — bei Settings-Mutation invalidiert; auch booking-blocks haengt
 *  davon ab (cleaningDaysAfterDeparture fliesst in getBookingBlocks ein). */
export const SITE_SETTINGS_TAG = "site-settings";

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
 * geben wir die Defaults zurück. Gecacht (Data Cache), Invalidierung via
 * revalidateTag("site-settings") in updateSiteSettings().
 */
const getSiteSettingsUncached = async (): Promise<SiteSettings> => {
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

export const getSiteSettings = unstable_cache(
  getSiteSettingsUncached,
  ["site-settings-v1"],
  { tags: [SITE_SETTINGS_TAG] }
);

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
  // Settings-Cache leeren — und booking-blocks, da cleaningDaysAfterDeparture
  // dort einfliesst. ("booking-blocks" als Literal, um Import-Zyklus mit
  // availability.ts zu vermeiden.)
  revalidateTag(SITE_SETTINGS_TAG, "max");
  revalidateTag("booking-blocks", "max");
};
