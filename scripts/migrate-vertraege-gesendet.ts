/**
 * Migration: GESENDETE (noch nicht unterschriebene) Mietverträge → Buchungen (Status angefragt).
 *
 * Quelle:  docs/Vertrag_gesendet/  (9 Vorgänge, manuell verifiziert)
 * Ziel:    customers, bookings (status = "angefragt", source = "Migration-gesendet"), activity_log, (documents)
 *
 * Modi:
 *   npx tsx scripts/migrate-vertraege-gesendet.ts            → DRY-RUN
 *   npx tsx scripts/migrate-vertraege-gesendet.ts --yes      → schreibt in die DB
 *   npx tsx scripts/migrate-vertraege-gesendet.ts --revert   → nimmt anhand des Manifests zurück
 *
 * Duplikat-Schutz: Eine Buchung wird übersprungen, wenn bereits eine Buchung mit derselben
 *   Kunden-E-Mail UND demselben Anreisedatum existiert (fängt sowohl bereits migrierte
 *   "fertige" Buchungen als auch Doppelläufe dieses Skripts ab).
 *
 * Reversibilität: Manifest scripts/.migrate-vertraege-gesendet-manifest.json + --revert
 *   (analog zu scripts/migrate-vertraege.ts).
 */

import { config as loadEnv } from "dotenv";
import path from "path";
import fs from "fs";

loadEnv({ path: path.join(process.cwd(), ".env.local") });
loadEnv({ path: path.join(process.cwd(), ".env") });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql, eq, and } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

const DOCS_BASE = path.join(process.cwd(), "docs", "Vertrag_gesendet");
const MANIFEST = path.join(process.cwd(), "scripts", ".migrate-vertraege-gesendet-manifest.json");
const SOURCE = "Migration-gesendet";

const euro = (c: number) => (c / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 }) + " €";
const CLEAN = 19000, DEP = 30000, SOLO = 5000;

type Doc = { kind: "anschreiben"; signed: boolean; file: string };
type Rec = {
  key: string;
  customer: { type: "privat" | "mitglied" | "verein" | "firma"; firstName: string; lastName: string; email: string; phone?: string | null; company?: string | null; street?: string | null; zip?: string | null; city?: string | null; country?: string };
  booking: { arrival: string; departure: string; nights: number; adults: number; members: number; children: number; pupils: number; teachers: number; soloUse: boolean; accommodationCents: number; energyFlatCents: number; cleaningCents: number; soloSurchargeCents: number; depositCents: number; kurtaxeCents: number };
  docs: Doc[];
  note?: string;
};

const DATA: Rec[] = [
  {
    key: "20260116-Wolf",
    customer: { type: "privat", firstName: "Dana", lastName: "Wolf", email: "dana@die5woelfe.de", phone: "0175 2045148", company: "Gruppe Wolf", street: "Breslauer Str. 10", zip: "33803", city: "Steinhagen", country: "DE" },
    booking: { arrival: "2026-01-16", departure: "2026-01-18", nights: 2, adults: 2, members: 0, children: 0, pupils: 0, teachers: 0, soloUse: false, accommodationCents: 7200, energyFlatCents: 4400, cleaningCents: 1900, soloSurchargeCents: 0, depositCents: 0, kurtaxeCents: 880 },
    docs: [{ kind: "anschreiben", signed: false, file: "20260116-Wolf/20260116-Wolf-Anschreiben+Mietvertrag1.pdf" }],
    note: "Reduzierte Reinigung (19 €), keine Kaution",
  },
  {
    key: "20260701-Söker",
    customer: { type: "firma", firstName: "Arne", lastName: "Söker", email: "soek@esg-guetersloh.de", phone: "0524198050 / 01639856070", company: "ESG Gütersloh", street: "Feldstraße 13", zip: "33330", city: "Gütersloh", country: "DE" },
    booking: { arrival: "2026-07-01", departure: "2026-07-03", nights: 2, adults: 2, members: 0, children: 0, pupils: 26, teachers: 0, soloUse: false, accommodationCents: 0, energyFlatCents: 4400, cleaningCents: CLEAN, soloSurchargeCents: 0, depositCents: 0, kurtaxeCents: 12320 },
    docs: [{ kind: "anschreiben", signed: false, file: "20260701-Söker-Anschreiben+Mietvertrag-skifreunde1.pdf" }],
    note: "Schulgruppe ESG: Übernachtung 0 €, keine Kaution; 26 Schüler ab 16 + 2 Begleiter",
  },
  {
    key: "20260718-Degenhardt",
    customer: { type: "privat", firstName: "Stefani", lastName: "Degenhardt", email: "steffi412@aol.com", phone: "01716335135", company: "Ferienfreizeit Egen", street: "Vossebrechen 1", zip: "51688", city: "Wipperfürth", country: "DE" },
    booking: { arrival: "2026-07-18", departure: "2026-07-25", nights: 7, adults: 4, members: 0, children: 10, pupils: 0, teachers: 0, soloUse: true, accommodationCents: 120400, energyFlatCents: 15400, cleaningCents: CLEAN, soloSurchargeCents: SOLO, depositCents: DEP, kurtaxeCents: 6160 },
    docs: [{ kind: "anschreiben", signed: false, file: "20260718-Degenhardt-Anschreiben+Mietvertrag-skifreunde.pdf" }],
  },
  {
    key: "20261024-Hörbelt",
    customer: { type: "verein", firstName: "Niklas", lastName: "Hörbelt", email: "niklas.hoerbelt@gmail.com", phone: "015254308386", company: "Messdiener St. Johannes Lette", street: "Lindenstraße 1", zip: "48653", city: "Coesfeld", country: "DE" },
    booking: { arrival: "2026-10-24", departure: "2026-10-31", nights: 7, adults: 20, members: 0, children: 0, pupils: 0, teachers: 0, soloUse: true, accommodationCents: 252000, energyFlatCents: 15400, cleaningCents: CLEAN, soloSurchargeCents: SOLO, depositCents: DEP, kurtaxeCents: 30800 },
    docs: [{ kind: "anschreiben", signed: false, file: "20261024-Hörbelt-Anschreiben+Mietvertrag-skifreunde.pdf" }],
  },
  {
    key: "20261230-Reimann-LaraJoy",
    customer: { type: "privat", firstName: "Lara Joy", lastName: "Reimann", email: "larajoyreimann@gmail.com", phone: "01737062543", company: "Freundesgruppe Holzwickede", street: "Hauptstr. 11", zip: "59439", city: "Holzwickede", country: "DE" },
    booking: { arrival: "2026-12-30", departure: "2027-01-02", nights: 3, adults: 10, members: 0, children: 6, pupils: 0, teachers: 0, soloUse: true, accommodationCents: 72000, energyFlatCents: 6600, cleaningCents: CLEAN, soloSurchargeCents: SOLO, depositCents: DEP, kurtaxeCents: 6600 },
    docs: [{ kind: "anschreiben", signed: false, file: "20261230-Reimann-Anschreiben+Mietvertrag-skifreunde.pdf" }],
    note: "Zzgl. 2 Kleinkinder (0–3 J., kostenlos) — im Schema nicht abbildbar, nicht in Personenzahl",
  },
  {
    key: "20270115-Zimmermann",
    customer: { type: "privat", firstName: "Malte", lastName: "Zimmermann", email: "malte.zimmermann@googlemail.de", phone: "05241307798 / 01711423646", company: "Die Camper", street: "Kolonatsweg 20", zip: "33334", city: "Gütersloh", country: "DE" },
    booking: { arrival: "2027-01-15", departure: "2027-01-17", nights: 2, adults: 15, members: 0, children: 4, pupils: 0, teachers: 0, soloUse: true, accommodationCents: 62000, energyFlatCents: 4400, cleaningCents: CLEAN, soloSurchargeCents: SOLO, depositCents: DEP, kurtaxeCents: 6600 },
    docs: [{ kind: "anschreiben", signed: false, file: "20270115-Zimmermann-Anschreiben+Mietvertrag-skifreunde.pdf" }],
  },
  {
    key: "20270122-Legge",
    customer: { type: "privat", firstName: "Barbara", lastName: "Legge", email: "barbara.legge@provinzial.de", phone: "017678124146", company: "Private Familienreise", street: "Rheinstraße 25", zip: "48145", city: "Münster", country: "DE" },
    booking: { arrival: "2027-01-22", departure: "2027-01-24", nights: 2, adults: 14, members: 0, children: 18, pupils: 0, teachers: 0, soloUse: true, accommodationCents: 86400, energyFlatCents: 4400, cleaningCents: CLEAN, soloSurchargeCents: SOLO, depositCents: DEP, kurtaxeCents: 6160 },
    docs: [{ kind: "anschreiben", signed: false, file: "20270122-Legge-Anschreiben+Mietvertrag-skifreunde.pdf" }],
  },
  {
    key: "20270129-Kayisi",
    customer: { type: "privat", firstName: "Muecahit", lastName: "Kayisi", email: "m.kayisi@gmx.de", phone: "01632582175", company: null, street: "Clara-Schumann-Str. 25", zip: "50129", city: "Bergheim", country: "DE" },
    booking: { arrival: "2027-01-29", departure: "2027-01-31", nights: 2, adults: 10, members: 0, children: 15, pupils: 0, teachers: 0, soloUse: true, accommodationCents: 66000, energyFlatCents: 4400, cleaningCents: CLEAN, soloSurchargeCents: SOLO, depositCents: DEP, kurtaxeCents: 4400 },
    docs: [{ kind: "anschreiben", signed: false, file: "20270129-Kayisi-Anschreiben+Mietvertrag-skifreunde.pdf" }],
  },
  {
    key: "20270514-Tonhäuser",
    customer: { type: "privat", firstName: "Yvonne", lastName: "Tonhäuser", email: "yton@gmx.de", phone: "015775057485", company: null, street: "Heinrich-Zinß-Weg 4", zip: "60388", city: "Frankfurt", country: "DE" },
    booking: { arrival: "2027-05-14", departure: "2027-05-17", nights: 3, adults: 18, members: 0, children: 5, pupils: 0, teachers: 0, soloUse: true, accommodationCents: 112200, energyFlatCents: 6600, cleaningCents: CLEAN, soloSurchargeCents: SOLO, depositCents: DEP, kurtaxeCents: 11880 },
    docs: [{ kind: "anschreiben", signed: false, file: "20270514-Tonhäuser-Anschreiben+Mietvertrag-skifreunde.pdf" }],
  },
];

const subtotal = (b: Rec["booking"]) => b.accommodationCents + b.energyFlatCents + b.cleaningCents + b.soloSurchargeCents + b.kurtaxeCents;
const persons = (b: Rec["booking"]) => b.adults + b.members + b.children + b.pupils + b.teachers;

type Manifest = { createdAt: string; records: Array<{ key: string; customerId: string; customerCreated: boolean; bookingId: string; bookingNumber: string; documentIds: string[]; blobPathnames: string[] }> };

async function uniqueBookingNumber(db: any): Promise<string> {
  for (let i = 0; i < 100; i++) {
    const rand = Math.floor(Math.random() * 9000) + 1000;
    const num = `WH-2026-${rand}`;
    const hit = await db.select({ id: schema.bookings.id }).from(schema.bookings).where(eq(schema.bookings.bookingNumber, num)).limit(1);
    if (!hit[0]) return num;
  }
  throw new Error("Keine eindeutige Buchungsnummer gefunden");
}

async function ensureDocumentsTable(db: any) {
  await db.execute(sql`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='document_kind') THEN CREATE TYPE document_kind AS ENUM ('mietvertrag','anschreiben','meldeschein','sonstiges'); END IF; END $$;`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS documents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE, customer_id uuid REFERENCES customers(id) ON DELETE SET NULL, kind document_kind NOT NULL DEFAULT 'sonstiges', title varchar(255) NOT NULL, blob_url text NOT NULL, original_filename varchar(500), content_type varchar(100), size_bytes integer, signed boolean NOT NULL DEFAULT false, signed_at timestamp, uploaded_by varchar(255), source varchar(40) NOT NULL DEFAULT 'upload', created_at timestamp NOT NULL DEFAULT now());`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS documents_booking_idx ON documents (booking_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS documents_customer_idx ON documents (customer_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS documents_kind_idx ON documents (kind);`);
}

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--yes");
  const revert = args.includes("--revert");
  if (!process.env.DATABASE_URL) { console.error("❌ DATABASE_URL fehlt"); process.exit(1); }
  const client = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
  const db = drizzle(client, { schema });
  try {
    if (revert) return await doRevert(db);
    await doMigrate(db, write);
  } finally { await client.end(); }
}

async function doMigrate(db: any, write: boolean) {
  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
  console.log(`\n=== Migration GESENDETE Verträge (${write ? "SCHREIBEN" : "DRY-RUN"}) — alle Status "angefragt" ===`);
  console.log(`Datensätze: ${DATA.length} · Blob-Upload: ${hasBlob ? "aktiv" : "DEAKTIVIERT (kein BLOB_READ_WRITE_TOKEN)"}\n`);

  // Duplikat-Vorprüfung (read-only) gegen Bestand
  for (const r of DATA) {
    const b = r.booking;
    const dup = await db.select({ n: schema.bookings.bookingNumber })
      .from(schema.bookings).innerJoin(schema.customers, eq(schema.bookings.customerId, schema.customers.id))
      .where(and(eq(schema.customers.email, r.customer.email.toLowerCase()), eq(schema.bookings.arrival, b.arrival))).limit(1);
    const flag = dup[0] ? `⛔ DUPLIKAT (vorhanden: ${dup[0].n}) → wird übersprungen` : "neu";
    console.log(`• ${r.key.padEnd(24)} ${b.arrival}→${b.departure} ${String(persons(b)).padStart(2)}P/${b.nights}N  Summe(o.Kaution) ${euro(subtotal(b)).padStart(11)}  Kaution ${euro(b.depositCents).padStart(8)}  [${flag}]${r.note ? "  · " + r.note : ""}`);
  }

  if (!write) { console.log("\nℹ️  DRY-RUN — nichts geschrieben. Mit  --yes  ausführen."); return; }

  await ensureDocumentsTable(db);
  let put: any = null;
  if (hasBlob) ({ put } = await import("@vercel/blob"));

  const manifest: Manifest = { createdAt: new Date().toISOString(), records: [] };
  let skipped = 0;

  for (const r of DATA) {
    const b = r.booking;
    const email = r.customer.email.toLowerCase();

    // Duplikat-Schutz: gleiche E-Mail + gleiche Anreise existiert bereits?
    const dup = await db.select({ id: schema.bookings.id })
      .from(schema.bookings).innerJoin(schema.customers, eq(schema.bookings.customerId, schema.customers.id))
      .where(and(eq(schema.customers.email, email), eq(schema.bookings.arrival, b.arrival))).limit(1);
    if (dup[0]) { console.log(`   ⏭️  übersprungen (Duplikat): ${r.key}`); skipped++; continue; }

    const existing = await db.select().from(schema.customers).where(eq(schema.customers.email, email)).limit(1);
    let customerId: string, customerCreated = false;
    if (existing[0]) customerId = existing[0].id;
    else {
      const ins = await db.insert(schema.customers).values({
        type: r.customer.type, firstName: r.customer.firstName, lastName: r.customer.lastName, email,
        phone: r.customer.phone ?? null, company: r.customer.company ?? null,
        street: r.customer.street ?? null, zip: r.customer.zip ?? null, city: r.customer.city ?? null, country: r.customer.country ?? "DE",
      }).returning({ id: schema.customers.id });
      customerId = ins[0].id; customerCreated = true;
    }

    const bookingNumber = await uniqueBookingNumber(db);
    const sub = subtotal(b);
    const insB = await db.insert(schema.bookings).values({
      bookingNumber, customerId, status: "angefragt",
      arrival: b.arrival, departure: b.departure, nights: b.nights,
      adults: b.adults, members: b.members, children: b.children, pupils: b.pupils, teachers: b.teachers, persons: persons(b),
      institution: r.customer.company ?? null,
      accommodationCents: b.accommodationCents, kurtaxeCents: b.kurtaxeCents, energyFlatCents: b.energyFlatCents,
      cleaningCents: b.cleaningCents, soloSurchargeCents: b.soloSurchargeCents, minOccupancySurchargeCents: 0,
      extrasCents: 0, subtotalCents: sub, depositCents: b.depositCents, totalCents: sub, paidCents: 0,
      cleaningOptedIn: true, soloUse: b.soloUse, source: SOURCE,
    }).returning({ id: schema.bookings.id });
    const bookingId = insB[0].id;

    const documentIds: string[] = [], blobPathnames: string[] = [];
    if (hasBlob && put) {
      for (const d of r.docs) {
        const abs = path.join(DOCS_BASE, d.file);
        if (!fs.existsSync(abs)) { console.warn(`   ⚠️ Datei fehlt: ${d.file}`); continue; }
        const orig = path.basename(d.file);
        const pathname = `vertraege/${bookingNumber}/${d.kind}-${orig}`;
        const blob = await put(pathname, fs.readFileSync(abs), { access: "public", addRandomSuffix: false, contentType: "application/pdf" });
        const insD = await db.insert(schema.documents).values({
          bookingId, customerId, kind: d.kind, title: `Anschreiben + Vertrag ${r.customer.lastName}`,
          blobUrl: blob.url, originalFilename: orig, contentType: "application/pdf", sizeBytes: fs.statSync(abs).size, signed: d.signed, source: "migration",
        }).returning({ id: schema.documents.id });
        documentIds.push(insD[0].id); blobPathnames.push(pathname);
      }
    }

    await db.insert(schema.activityLog).values({ who: "Migration", what: `Gesendeter Vertrag migriert: ${r.key} (${persons(b)} P · ${b.nights} N · angefragt)`, bookingId });
    manifest.records.push({ key: r.key, customerId, customerCreated, bookingId, bookingNumber, documentIds, blobPathnames });
    console.log(`   ✓ ${r.key}  →  Buchung ${bookingNumber} (${documentIds.length} Dok.)`);
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Fertig. ${manifest.records.length} angelegt, ${skipped} als Duplikat übersprungen. Manifest: ${path.relative(process.cwd(), MANIFEST)}`);
  if (!hasBlob) console.log("ℹ️  PDFs NICHT hochgeladen (kein BLOB_READ_WRITE_TOKEN).");
  console.log("↩️  Rückgängig:  npx tsx scripts/migrate-vertraege-gesendet.ts --revert");
}

async function doRevert(db: any) {
  if (!fs.existsSync(MANIFEST)) { console.error(`❌ Kein Manifest (${path.relative(process.cwd(), MANIFEST)}).`); process.exit(1); }
  const manifest: Manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf-8"));
  console.log(`\n=== REVERT — ${manifest.records.length} gesendete Vorgänge zurücknehmen ===\n`);
  let blobDel: any = null;
  if (process.env.BLOB_READ_WRITE_TOKEN) ({ del: blobDel } = await import("@vercel/blob"));
  for (const rec of manifest.records) {
    if (blobDel) for (const p of rec.blobPathnames) { try { await blobDel(p); } catch (e: any) { console.warn(`   ⚠️ Blob ${p}: ${e.message}`); } }
    await db.delete(schema.documents).where(eq(schema.documents.bookingId, rec.bookingId));
    await db.delete(schema.activityLog).where(eq(schema.activityLog.bookingId, rec.bookingId));
    await db.delete(schema.bookings).where(eq(schema.bookings.id, rec.bookingId));
    if (rec.customerCreated) {
      const remaining = await db.select({ id: schema.bookings.id }).from(schema.bookings).where(eq(schema.bookings.customerId, rec.customerId)).limit(1);
      if (!remaining[0]) await db.delete(schema.customers).where(eq(schema.customers.id, rec.customerId));
      else console.warn(`   ⚠️ Kunde ${rec.customerId} behalten (hat andere Buchungen).`);
    }
    console.log(`   ✓ zurückgenommen: ${rec.key} (${rec.bookingNumber})`);
  }
  fs.renameSync(MANIFEST, MANIFEST + ".reverted");
  console.log(`\n✅ Revert fertig. Manifest archiviert.`);
}

main().catch((e) => { console.error("FEHLER:", e); process.exit(1); });
