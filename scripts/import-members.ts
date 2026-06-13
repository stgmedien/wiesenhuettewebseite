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
import { addContactToMembersList, brevoConfigured } from "../src/lib/brevo";

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
          type: customers.type,
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
  // Hinweis: bewusst keine vollständige E-Mail-Liste ausgeben (PII sparsam halten);
  // fehlerhafte Zeilen werden gezeigt, weil der/die Ausführende sie korrigieren muss.
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
  let alreadyMember = 0;
  let brevoOk = 0;
  let brevoFail = 0;
  const brevoOn = brevoConfigured();

  // Jedes Mitglied in die Brevo-Mitgliederliste spiegeln (best effort).
  const syncBrevo = async (v: Row) => {
    if (!brevoOn) return;
    try {
      const res = await addContactToMembersList(v.email, {
        firstName: v.firstName,
        lastName: v.lastName,
      });
      if (res.ok) brevoOk++;
      else {
        brevoFail++;
        console.warn(`  ⚠ Brevo fehlgeschlagen: ${v.email} (${res.reason})`);
      }
    } catch (e) {
      brevoFail++;
      console.warn(`  ⚠ Brevo-Ausnahme: ${v.email}`, e instanceof Error ? e.message : e);
    }
  };

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
    await syncBrevo(v);
  }
  for (const v of toUpdate) {
    const ex = existingByEmail.get(v.email)!;
    if (ex.status === "verified" && ex.type === "mitglied") {
      // Bereits verifiziertes Mitglied → DB unverändert lassen (idempotent),
      // nur nach Brevo spiegeln. Das macht den Brevo-Nachzug gefahrlos wiederholbar.
      alreadyMember++;
    } else {
      await db
        .update(customers)
        .set({
          type: "mitglied",
          membershipStatus: "verified",
          membershipVerifiedAt: now,
          membershipVerifiedBy: ACTOR,
          membershipRejectedReason: null,
        })
        .where(eq(customers.id, ex.id));
      updated++;
      await db.insert(activityLog).values({
        who: ACTOR,
        what: `Mitglied via xlsx-Import verifiziert: ${v.email}`,
      });
    }
    await syncBrevo(v);
  }

  console.log(
    `\n✓ Fertig: ${created} neu, ${updated} verifiziert, ${alreadyMember} bereits Mitglied (DB unverändert), ${invalid.length} übersprungen.`
  );
  console.log(
    brevoOn
      ? `   Brevo-Mitgliederliste: ${brevoOk} ok, ${brevoFail} fehlgeschlagen.`
      : "   Brevo: nicht konfiguriert (übersprungen)."
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
