/**
 * One-off Cleanup: alle Buchungen und Rechnungen löschen.
 *
 * Scope (gemäß User-Freigabe):
 *   - bookings (mit FK-CASCADE auf payments, email_log, booking_extras,
 *     handovers, damage_reports)
 *   - invoices (explizit, weil sonst nur entkoppelt)
 *
 * Bleibt erhalten:
 *   - customers (Profil + Mitgliedschaftsstatus)
 *   - activity_log (Audit-Trail — Einträge verlieren nur ihren booking_id)
 *   - vouchers (FK auf bookings wird auf NULL gesetzt)
 *   - invoice_number-Sequenz (zählt weiter — kein GoBD-Risiko durch Reuse)
 *
 * Lauf:   npx tsx scripts/wipe-bookings.ts --yes
 * Default ist Dry-Run (zeigt nur Counts, ohne zu löschen).
 */

import { config as loadEnv } from "dotenv";
import path from "path";

// .env.local hat Vorrang (Next.js-Konvention), Fallback auf .env
loadEnv({ path: path.join(process.cwd(), ".env.local") });
loadEnv({ path: path.join(process.cwd(), ".env") });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

async function main() {
  const yes = process.argv.includes("--yes");
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL nicht gesetzt — wahrscheinlich .env.local nicht geladen.");
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  // -----------------------------------------------------------------
  // 1. Pre-State zeigen
  // -----------------------------------------------------------------
  console.log("\n=== VOR LÖSCHUNG ===");
  const tables = [
    "bookings",
    "payments",
    "email_log",
    "booking_extras",
    "handovers",
    "damage_reports",
    "invoices",
    "customers",
    "activity_log",
  ];
  for (const t of tables) {
    // Skip tables that don't exist (z.B. vouchers — im Schema definiert,
    // aber noch nicht migriert)
    const exists: Array<{ exists: boolean }> = await client.unsafe(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema='public' AND table_name=$1
       ) AS exists`,
      [t]
    );
    if (!exists[0]?.exists) {
      console.log(`  ${t.padEnd(20)}      — (Tabelle existiert nicht)`);
      continue;
    }
    const rows: Array<{ c: string }> = await client.unsafe(
      `SELECT COUNT(*)::text AS c FROM ${t}`
    );
    console.log(`  ${t.padEnd(20)} ${rows[0].c.padStart(6)}`);
  }

  if (!yes) {
    console.log("\n(Dry-Run — füge --yes hinzu, um wirklich zu löschen)");
    await client.end();
    process.exit(0);
  }

  console.log("\n=== LÖSCHE ... ===");

  // -----------------------------------------------------------------
  // 2. In Transaction löschen
  // -----------------------------------------------------------------
  await db.transaction(async (tx) => {
    // Reihenfolge: Erst invoices (FK SET NULL würde sie nur entkoppeln),
    // dann bookings (cascadet payments, email_log, booking_extras,
    // handovers, damage_reports automatisch).
    const invRes = await tx.execute(sql`DELETE FROM invoices RETURNING id`);
    console.log(`  invoices            ${String(invRes.length).padStart(6)} gelöscht`);

    const bookRes = await tx.execute(sql`DELETE FROM bookings RETURNING id`);
    console.log(`  bookings (+CASCADE) ${String(bookRes.length).padStart(6)} gelöscht`);

    await tx.execute(sql`
      INSERT INTO activity_log (who, what, at)
      VALUES (
        'System (Wipe-Script)',
        ${"Alle Buchungen + Rechnungen gelöscht (Re-Onboarding mit historischen Buchungen)"},
        NOW()
      )
    `);
  });

  // -----------------------------------------------------------------
  // 3. Post-State zeigen
  // -----------------------------------------------------------------
  console.log("\n=== NACH LÖSCHUNG ===");
  for (const t of tables) {
    const exists: Array<{ exists: boolean }> = await client.unsafe(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema='public' AND table_name=$1
       ) AS exists`,
      [t]
    );
    if (!exists[0]?.exists) continue;
    const rows: Array<{ c: string }> = await client.unsafe(
      `SELECT COUNT(*)::text AS c FROM ${t}`
    );
    console.log(`  ${t.padEnd(20)} ${rows[0].c.padStart(6)}`);
  }

  // -----------------------------------------------------------------
  // 4. Invoice-Sequence: aktuellen Wert anzeigen (nicht zurücksetzen)
  // -----------------------------------------------------------------
  try {
    const seqRes: Array<{ last_value: string }> = await client.unsafe(
      `SELECT last_value::text FROM invoice_number_seq`
    );
    console.log(
      `\n  invoice_number_seq: last_value=${seqRes[0].last_value} (bleibt unverändert — nächste Rechnung erhält die nächste freie Nummer)`
    );
  } catch {
    console.log(`\n  (invoice_number_seq nicht vorhanden — wird beim ersten Booking erzeugt)`);
  }

  await client.end();
  console.log("\n✓ Fertig.\n");
}

main().catch((err) => {
  console.error("❌ Wipe fehlgeschlagen:", err);
  process.exit(1);
});
