import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * Verbindungs-Warmup für Cron-Jobs.
 *
 * Die Neon-DB skaliert auf 0 — der erste Query eines kalten Cron-Laufs
 * scheitert dann gelegentlich mit CONNECT_TIMEOUT (in Produktion beobachtet
 * bei release-deposits und daily-mail-jobs), und der ganze Lauf fällt stumm
 * aus. Deshalb VOR der eigentlichen Arbeit die Verbindung mit Retries
 * aufbauen: ein simples SELECT 1, bis zu `attempts`-mal mit wachsender
 * Wartezeit. Steht die Verbindung einmal, laufen die Folge-Queries des
 * Handlers über denselben Pool.
 *
 * Bewusst NUR der Warmup wird wiederholt — nicht der Handler selbst, damit
 * bereits verschickte Mails/Refunds bei einem Retry nicht doppelt rausgehen.
 */
export async function warmUpDb(attempts = 3): Promise<void> {
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      await db.execute(sql`select 1`);
      return;
    } catch (err) {
      lastErr = err;
      console.warn(`[db-warmup] Versuch ${i}/${attempts} fehlgeschlagen:`, err);
      if (i < attempts) {
        await new Promise((r) => setTimeout(r, i * 3000)); // 3 s, 6 s
      }
    }
  }
  throw lastErr;
}
