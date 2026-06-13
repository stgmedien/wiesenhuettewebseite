/**
 * Bulk-Import: Vereinsmitglieder → customers (membershipStatus="verified",
 * type="mitglied"). Damit können sie sofort zum Mitglieder-Tarif (halber Preis)
 * buchen — gleiche Semantik wie der Manager-Import unter /m/mitgliedschaften/import.
 *
 *   npx tsx scripts/import-members.ts <pfad-zur-csv>          → DRY-RUN (zeigt nur)
 *   npx tsx scripts/import-members.ts <pfad-zur-csv> --yes    → schreibt in die DB
 *
 * Erwarteter CSV-Header (UTF-8): email, firstName, lastName
 * Hinweis: Die Quelldatei mit personenbezogenen Daten liegt bewusst AUSSERHALB
 * des Repos (kein PII im Git). Dieses Skript enthält nur Logik.
 *
 * Idempotent + Dedupe per E-Mail:
 *   - E-Mail existiert bereits → Kunde wird auf verified/mitglied gesetzt
 *     (Name, Telefon, Mitgliedsnummer bleiben unangetastet).
 *   - sonst → neuer Kunde.
 * Ungültige/leere Zeilen und Dubletten innerhalb der CSV werden übersprungen.
 */
import { config as loadEnv } from "dotenv";
import path from "path";
import fs from "fs";

loadEnv({ path: path.join(process.cwd(), ".env.local") });
loadEnv({ path: path.join(process.cwd(), ".env") });

import { db } from "../src/lib/db";
import { customers, activityLog } from "../src/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { parseCsv } from "../src/lib/csv-parse";

const ACTOR = "xlsx-Import (stgmedien@gmail.com)";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Row = { email: string; firstName: string; lastName: string; line: number };

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--yes");
  const csvPath = args.find((a) => !a.startsWith("--")) ?? "/tmp/wh-members-import.csv";

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV nicht gefunden: ${csvPath}`);
    process.exit(1);
  }

  const { rows } = parseCsv(fs.readFileSync(csvPath, "utf-8"));

  const valid: Row[] = [];
  const invalid: { line: number; email: string; reason: string }[] = [];
  const seen = new Set<string>();

  rows.forEach((r, i) => {
    const line = i + 2; // Zeile 1 = Header
    const email = (r.email ?? r.Email ?? "").toLowerCase().trim();
    const firstName = (r.firstName ?? r.firstname ?? "").trim();
    const lastName = (r.lastName ?? r.lastname ?? "").trim();
    if (!email && !firstName && !lastName) return; // leere Zeile
    if (!EMAIL_RE.test(email)) return invalid.push({ line, email, reason: "ungültige E-Mail" });
    if (!firstName || !lastName) return invalid.push({ line, email, reason: "Vor-/Nachname fehlt" });
    if (firstName.length > 120 || lastName.length > 120)
      return invalid.push({ line, email, reason: "Name zu lang (max 120)" });
    if (seen.has(email)) return invalid.push({ line, email, reason: "Dublette in CSV" });
    seen.add(email);
    valid.push({ email, firstName, lastName, line });
  });

  const emails = valid.map((v) => v.email);
  const existing = emails.length
    ? await db
        .select({
          id: customers.id,
          email: customers.email,
          status: customers.membershipStatus,
        })
        .from(customers)
        .where(inArray(customers.email, emails))
    : [];
  const existingByEmail = new Map(existing.map((e) => [e.email.toLowerCase(), e]));

  const toCreate = valid.filter((v) => !existingByEmail.has(v.email));
  const toUpdate = valid.filter((v) => existingByEmail.has(v.email));

  console.log(`\nQuelle: ${csvPath}`);
  console.log(
    `Zeilen: ${rows.length} · gültig ${valid.length} · übersprungen ${invalid.length}`
  );
  console.log(`→ NEU anlegen (verified/mitglied): ${toCreate.length}`);
  console.log(`→ bereits vorhanden, wird verifiziert: ${toUpdate.length}`);
  if (toUpdate.length) {
    console.log("\nBereits vorhanden (Status bisher → verified):");
    toUpdate.forEach((v) =>
      console.log(`  ${v.email}  [${existingByEmail.get(v.email)!.status}]`)
    );
  }
  if (invalid.length) {
    console.log("\nÜbersprungen:");
    invalid.forEach((x) => console.log(`  Zeile ${x.line}: ${x.email || "(leer)"} — ${x.reason}`));
  }

  if (!apply) {
    console.log("\n*** DRY-RUN — nichts geschrieben. Mit --yes ausführen. ***");
    process.exit(0);
  }

  const now = new Date();
  let created = 0;
  let updated = 0;
  for (const v of toCreate) {
    await db.insert(customers).values({
      email: v.email,
      firstName: v.firstName,
      lastName: v.lastName,
      type: "mitglied",
      membershipStatus: "verified",
      membershipVerifiedAt: now,
      membershipVerifiedBy: ACTOR,
    });
    created++;
    await db.insert(activityLog).values({
      who: ACTOR,
      what: `Mitglied via xlsx-Import angelegt: ${v.firstName} ${v.lastName} (${v.email})`,
    });
  }
  for (const v of toUpdate) {
    await db
      .update(customers)
      .set({
        type: "mitglied",
        membershipStatus: "verified",
        membershipVerifiedAt: now,
        membershipVerifiedBy: ACTOR,
        membershipRejectedReason: null,
      })
      .where(eq(customers.id, existingByEmail.get(v.email)!.id));
    updated++;
    await db.insert(activityLog).values({
      who: ACTOR,
      what: `Mitglied via xlsx-Import verifiziert: ${v.email}`,
    });
  }

  console.log(
    `\n✓ Fertig: ${created} neu angelegt, ${updated} verifiziert, ${invalid.length} übersprungen.`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
