import { db } from "./db";
import { blockedDates } from "./db/schema";
import { and, eq, gte, isNull, lte, ne, or } from "drizzle-orm";
import { revalidateTag } from "next/cache";

// =============================================================
// Freigegebene Reinigungstage
//
// Reinigungs-/Wechseltage werden NICHT gespeichert, sondern live aus jeder
// Buchung berechnet (departure + cleaningDaysAfterDeparture, siehe
// availability.ts). Manchmal ist die Reinigung schneller fertig — dann soll
// der Wart der Hütte diesen Tag „freigeben", damit er wieder buchbar ist und
// ggf. neu vermietet werden kann.
//
// Persistenz OHNE Schema-Änderung: Wir nutzen die ansonsten ungenutzte Tabelle
// `blocked_dates` als Ablage. Eine Zeile mit kind="reinigung" bedeutet hier:
// „der automatische Reinigungstag an diesem Datum ist FREIGEGEBEN (wieder
// buchbar)". fromDate === toDate (ein einzelner Tag). Die Verfügbarkeits-Logik
// zieht diese Tage aus dem berechneten Reinigungs-Block ab.
// =============================================================

const RELEASE_KIND = "reinigung" as const;
const RELEASE_REASON = "Reinigungstag freigegeben (wieder buchbar)";
// Abreisetag als Wechseltag: Die alte Gruppe reist morgens ab, die neue kommt
// am selben Tag an (z. B. Wochenendgast Fr–So direkt nach einer Woche, die
// Freitag endet). Gleiche Tabelle, gleiche kind, nur am reason unterscheidbar
// — so bleibt es ohne Enum-Migration.
const CHANGEOVER_REASON = "Abreisetag als Wechseltag freigegeben";

const isCleaningRelease = or(isNull(blockedDates.reason), ne(blockedDates.reason, CHANGEOVER_REASON));
const isChangeoverRelease = eq(blockedDates.reason, CHANGEOVER_REASON);

/** Freigegebene Reinigungstage innerhalb [fromIso, toIso] (inkl.). */
export async function getReleasedCleaningDates(
  fromIso: string,
  toIso: string
): Promise<Set<string>> {
  try {
    const rows = await db
      .select({ d: blockedDates.fromDate })
      .from(blockedDates)
      .where(
        and(
          eq(blockedDates.kind, RELEASE_KIND),
          isCleaningRelease,
          gte(blockedDates.fromDate, fromIso),
          lte(blockedDates.fromDate, toIso)
        )
      );
    return new Set(rows.map((r) => r.d));
  } catch (err) {
    console.error("[cleaning-overrides] read failed:", err);
    return new Set();
  }
}

/** Als Wechseltag freigegebene Abreisetage innerhalb [fromIso, toIso] (inkl.). */
export async function getReleasedChangeoverDates(
  fromIso: string,
  toIso: string
): Promise<Set<string>> {
  try {
    const rows = await db
      .select({ d: blockedDates.fromDate })
      .from(blockedDates)
      .where(
        and(
          eq(blockedDates.kind, RELEASE_KIND),
          isChangeoverRelease,
          gte(blockedDates.fromDate, fromIso),
          lte(blockedDates.fromDate, toIso)
        )
      );
    return new Set(rows.map((r) => r.d));
  } catch (err) {
    console.error("[cleaning-overrides] changeover read failed:", err);
    return new Set();
  }
}

export async function isChangeoverReleased(dateIso: string): Promise<boolean> {
  const rows = await db
    .select({ id: blockedDates.id })
    .from(blockedDates)
    .where(and(eq(blockedDates.kind, RELEASE_KIND), isChangeoverRelease, eq(blockedDates.fromDate, dateIso)))
    .limit(1);
  return rows.length > 0;
}

/**
 * Abreisetag als Wechseltag freigeben (idempotent) — erst nachdem das
 * Putzteam zugesagt hat. Online dann halb frei („Anreise erst ab 17 Uhr“).
 * Den Putztag danach gibt der Vorstand getrennt frei (Dana 11/2026); erst
 * wenn beide frei sind, ist eine Anreise am Wechseltag tatsächlich buchbar.
 */
export async function releaseChangeoverDay(dateIso: string, by: string): Promise<void> {
  if (!(await isChangeoverReleased(dateIso))) {
    await db.insert(blockedDates).values({
      fromDate: dateIso,
      toDate: dateIso,
      kind: RELEASE_KIND,
      reason: CHANGEOVER_REASON,
      createdBy: by,
    });
  }
  revalidateTag("booking-blocks", "max");
}

/** Wechseltag-Freigabe zurücknehmen (Putztag-Freigaben bleiben bestehen). */
export async function unreleaseChangeoverDay(dateIso: string): Promise<void> {
  await db
    .delete(blockedDates)
    .where(and(eq(blockedDates.kind, RELEASE_KIND), isChangeoverRelease, eq(blockedDates.fromDate, dateIso)));
  revalidateTag("booking-blocks", "max");
}

/** Ist der Reinigungstag an diesem Datum freigegeben? */
export async function isCleaningDayReleased(dateIso: string): Promise<boolean> {
  const rows = await db
    .select({ id: blockedDates.id })
    .from(blockedDates)
    .where(and(eq(blockedDates.kind, RELEASE_KIND), isCleaningRelease, eq(blockedDates.fromDate, dateIso)))
    .limit(1);
  return rows.length > 0;
}

/** Reinigungstag freigeben (idempotent). */
export async function releaseCleaningDay(dateIso: string, by: string): Promise<void> {
  const exists = await isCleaningDayReleased(dateIso);
  if (!exists) {
    await db.insert(blockedDates).values({
      fromDate: dateIso,
      toDate: dateIso,
      kind: RELEASE_KIND,
      reason: RELEASE_REASON,
      createdBy: by,
    });
  }
  // Öffentlichen Buchungskalender / Verfügbarkeit neu berechnen lassen.
  revalidateTag("booking-blocks", "max");
}

/** Freigabe zurücknehmen — Tag wird wieder als Reinigungstag gesperrt. */
export async function unreleaseCleaningDay(dateIso: string): Promise<void> {
  await db
    .delete(blockedDates)
    .where(and(eq(blockedDates.kind, RELEASE_KIND), isCleaningRelease, eq(blockedDates.fromDate, dateIso)));
  revalidateTag("booking-blocks", "max");
}
