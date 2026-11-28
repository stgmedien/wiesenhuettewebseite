import { del, list } from "@vercel/blob";

/**
 * Fotos unterschriebener Meldescheine ausländischer Gäste (§ 29 BMG).
 * Aufbewahrung 1 Jahr ab Abreise, danach löschen (§ 30 Abs. 4 BMG: binnen
 * drei Monaten). Das Löschdatum steckt im Blob-Pfad, damit kein DB-Feld
 * nötig ist; der tägliche Cron löscht alles, was fällig ist.
 *
 * Pfad: meldeschein-signiert/<bookingId>/loeschen-ab-<YYYY-MM-DD>/<datei>
 */
export const SIGNED_MELDESCHEIN_ROOT = "meldeschein-signiert/";

export const signedMeldescheinPrefix = (bookingId: string) => `${SIGNED_MELDESCHEIN_ROOT}${bookingId}/`;

/** Abreise + 1 Jahr + 1 Tag (YYYY-MM-DD). */
export function signedMeldescheinDeleteAfter(departureIso: string): string {
  const d = new Date(`${departureIso}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const deleteAfterFromPath = (pathname: string): string | null =>
  pathname.match(/\/loeschen-ab-(\d{4}-\d{2}-\d{2})\//)?.[1] ?? null;

export type SignedMeldeschein = { url: string; name: string; uploadedAt: string; deleteAfter: string | null };

export async function listSignedMeldescheine(bookingId: string): Promise<SignedMeldeschein[]> {
  try {
    const { blobs } = await list({ prefix: signedMeldescheinPrefix(bookingId) });
    return blobs.map((b) => ({
      url: b.url,
      name: b.pathname.split("/").pop() ?? b.pathname,
      uploadedAt: new Date(b.uploadedAt).toISOString(),
      deleteAfter: deleteAfterFromPath(b.pathname),
    }));
  } catch (err) {
    console.error("[meldeschein-signiert] Auflisten fehlgeschlagen:", err);
    return [];
  }
}

/** Löscht alle Fotos, deren Löschdatum erreicht ist. Gibt die Anzahl zurück. */
export async function deleteExpiredSignedMeldescheine(todayIso: string): Promise<number> {
  let deleted = 0;
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: SIGNED_MELDESCHEIN_ROOT, cursor });
    const due = page.blobs.filter((b) => {
      const d = deleteAfterFromPath(b.pathname);
      return d !== null && d <= todayIso;
    });
    if (due.length > 0) {
      await del(due.map((b) => b.url));
      deleted += due.length;
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return deleted;
}
