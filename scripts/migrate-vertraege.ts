/**
 * Migration: Altbestand-Mietverträge → Buchungen + Kunden (+ Dokumente).
 *
 * Quelle:  docs/Vertrag_unterschrieben/  (13 Vorgänge, manuell verifiziert)
 * Ziel:    customers, bookings, (documents), activity_log
 *
 * Modi:
 *   npx tsx scripts/migrate-vertraege.ts            → DRY-RUN (zeigt nur, was passieren würde)
 *   npx tsx scripts/migrate-vertraege.ts --yes      → schreibt in die DB (idempotent)
 *   npx tsx scripts/migrate-vertraege.ts --revert    → nimmt die Migration anhand des Manifests zurück
 *
 * Sicherheit / Reversibilität:
 *   - Alle erzeugten IDs (customers, bookings, documents) + Blob-Pfade landen im
 *     Manifest scripts/.migrate-vertraege-manifest.json.
 *   - bookings.source = "Migration", documents.source = "migration" als zusätzliche Marker.
 *   - --revert löscht exakt die im Manifest vermerkten Datensätze (Kunden nur, wenn
 *     SIE von dieser Migration angelegt wurden) und die hochgeladenen Blobs.
 *   - Die documents-Tabelle selbst bleibt bei --revert bestehen (additive, harmlose
 *     Strukturänderung). Manuell entfernbar via: DROP TABLE documents; DROP TYPE document_kind;
 *
 * PDF-Upload: nur wenn BLOB_READ_WRITE_TOKEN gesetzt ist (sonst werden Buchungen+Kunden
 *   migriert und die Dokumente übersprungen — können später nachgeladen werden).
 */

import { config as loadEnv } from "dotenv";
import path from "path";
import fs from "fs";

loadEnv({ path: path.join(process.cwd(), ".env.local") });
loadEnv({ path: path.join(process.cwd(), ".env") });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql, eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

const DOCS_BASE = path.join(process.cwd(), "docs", "Vertrag_unterschrieben");
const MANIFEST = path.join(process.cwd(), "scripts", ".migrate-vertraege-manifest.json");

const euro = (cents: number) => (cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 }) + " €";

type Doc = { kind: "mietvertrag" | "anschreiben" | "meldeschein"; signed: boolean; file: string };

type Rec = {
  key: string;
  customer: {
    type: "privat" | "mitglied" | "verein" | "firma";
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    company?: string | null;
    street?: string | null;
    zip?: string | null;
    city?: string | null;
    country?: string;
  };
  booking: {
    status: "angefragt" | "bestaetigt" | "abgereist";
    arrival: string;
    departure: string;
    nights: number;
    adults: number;
    members: number;
    children: number;
    pupils: number;
    teachers: number;
    soloUse: boolean;
    accommodationCents: number;
    energyFlatCents: number;
    cleaningCents: number;
    soloSurchargeCents: number;
    kurtaxeCents: number;
  };
  docs: Doc[];
};

// Basis-Posten
const CLEAN = 19000; // Endreinigung 190 €
const DEP = 30000; // Kaution 300 €
const SOLO = 5000; // Allein-Nutzung 50 €

const DATA: Rec[] = [
  {
    key: "20260528-Goorts",
    customer: { type: "firma", firstName: "Walter", lastName: "Goorts", email: "walter.goorts@nl.bosch.com", phone: "0031 6 13569260", company: "Bosch Transmission Technology", street: "Mergelven 71", zip: "5464", city: "Veghel", country: "NL" },
    booking: { status: "bestaetigt", arrival: "2026-06-04", departure: "2026-06-07", nights: 3, adults: 20, members: 0, children: 0, pupils: 0, teachers: 0, soloUse: true, accommodationCents: 108000, energyFlatCents: 6600, cleaningCents: CLEAN, soloSurchargeCents: SOLO, kurtaxeCents: 13200 },
    docs: [
      { kind: "mietvertrag", signed: true, file: "20260528-Goorts/20260604-Goorts-Anschreiben+Mietvertrag-skifreunde1-unterschrieben.pdf" },
      { kind: "anschreiben", signed: false, file: "20260528-Goorts/20260528-Goorts-Anschreiben+Mietvertrag-skifreunde1.pdf" },
      { kind: "meldeschein", signed: false, file: "20260528-Goorts/meldescheine-groots-pdfDruck.pdf" },
    ],
  },
  {
    key: "20260518-ESG-Bannert",
    customer: { type: "firma", firstName: "Eva", lastName: "Bannert", email: "bne@esg-guetersloh.de", phone: "015206102520", company: "Evangelisch Stiftisches Gymnasium Gütersloh", street: "Beethovenstraße 50", zip: "33604", city: "Bielefeld", country: "DE" },
    booking: { status: "abgereist", arrival: "2026-05-18", departure: "2026-05-21", nights: 3, adults: 2, members: 0, children: 0, pupils: 27, teachers: 0, soloUse: false, accommodationCents: 71550, energyFlatCents: 6600, cleaningCents: CLEAN, soloSurchargeCents: 0, kurtaxeCents: 1320 },
    docs: [
      { kind: "mietvertrag", signed: true, file: "20260518-ESG-Bannert/Mietvertrag Bannert (ESG)-unterschrieben.pdf" },
      { kind: "anschreiben", signed: false, file: "20260518-ESG-Bannert/20260518-ESG-Bannert-Anschreiben+Mietvertrag-skifreunde.pdf" },
      { kind: "meldeschein", signed: false, file: "20260518-ESG-Bannert/meldescheine-esg-bannert-pdfDruck.pdf" },
    ],
  },
  {
    key: "20260529-Kahlhöfer",
    customer: { type: "verein", firstName: "Tom", lastName: "Kahlhöfer", email: "tomkahlhoefer@gmx.de", phone: "0175 1855191", company: "HSG Wetter/ Grundschöttel Handballverein", street: "Auf der Höhe 11", zip: "58300", city: "Wetter", country: "DE" },
    booking: { status: "abgereist", arrival: "2026-05-29", departure: "2026-05-31", nights: 2, adults: 16, members: 0, children: 0, pupils: 0, teachers: 0, soloUse: true, accommodationCents: 57600, energyFlatCents: 4400, cleaningCents: CLEAN, soloSurchargeCents: SOLO, kurtaxeCents: 7040 },
    docs: [
      { kind: "mietvertrag", signed: true, file: "20260529-Kahlhöfer/20260529-Kahlhöfer-Anschreiben+Mietvertrag-skifreunde-unterschrieben.pdf" },
      { kind: "anschreiben", signed: false, file: "20260529-Kahlhöfer/20260529-Kahlhöfer-Anschreiben+Mietvertrag-skifreunde.pdf" },
      { kind: "meldeschein", signed: false, file: "20260529-Kahlhöfer/meldescheine-kahlhöfer-pdfDruck.pdf" },
    ],
  },
  {
    key: "20260612-Reimann",
    customer: { type: "verein", firstName: "Francis", lastName: "Reimann", email: "francis.reimann@web.de", phone: "01575 1476203", company: "Trompetercorps Neubeckum e.V.", street: "Oelder Straße 46", zip: "59269", city: "Beckum", country: "DE" },
    booking: { status: "bestaetigt", arrival: "2026-06-12", departure: "2026-06-14", nights: 2, adults: 22, members: 0, children: 0, pupils: 0, teachers: 0, soloUse: true, accommodationCents: 79200, energyFlatCents: 4400, cleaningCents: CLEAN, soloSurchargeCents: SOLO, kurtaxeCents: 9680 },
    docs: [
      { kind: "mietvertrag", signed: true, file: "20260612-Reimann/20260612-Reimann-Anschreiben+Mietvertrag-skifreunde-unterschrieben.pdf" },
      { kind: "anschreiben", signed: false, file: "20260612-Reimann/20260612-Reimann-Anschreiben+Mietvertrag-skifreunde.pdf" },
    ],
  },
  {
    key: "20260807-Meyer",
    customer: { type: "verein", firstName: "Torben", lastName: "Meyer", email: "torbenmeyer.vfl@gmail.com", phone: "05902 940633 / 015117660160", company: "KLJB Suttrup-Lohe", street: "Witten Wall 1", zip: "49832", city: "Freren", country: "DE" },
    booking: { status: "bestaetigt", arrival: "2026-08-07", departure: "2026-08-09", nights: 2, adults: 25, members: 0, children: 0, pupils: 0, teachers: 0, soloUse: true, accommodationCents: 90000, energyFlatCents: 4400, cleaningCents: CLEAN, soloSurchargeCents: SOLO, kurtaxeCents: 11000 },
    docs: [
      { kind: "mietvertrag", signed: true, file: "20260807-Meyer/20260807-Meyer-Anschreiben+Mietvertrag-unterschrieben.pdf" },
      { kind: "anschreiben", signed: false, file: "20260807-Meyer/20260807-Meyer-Anschreiben+Mietvertrag.pdf" },
    ],
  },
  {
    key: "20261009-Grothusheitkamp",
    customer: { type: "verein", firstName: "Frank", lastName: "Grothusheitkamp", email: "fgro2@gmx.de", phone: "01735235796", company: "Schützenverein", street: "Fasanenweg 14", zip: "33378", city: "Rheda-Wiedenbrück", country: "DE" },
    booking: { status: "bestaetigt", arrival: "2026-10-09", departure: "2026-10-11", nights: 2, adults: 15, members: 0, children: 0, pupils: 0, teachers: 0, soloUse: true, accommodationCents: 54000, energyFlatCents: 4400, cleaningCents: CLEAN, soloSurchargeCents: SOLO, kurtaxeCents: 6600 },
    docs: [
      { kind: "mietvertrag", signed: true, file: "20261009-Grothusheitkamp/20261009-Grothusheitkamp-Skihuette-unterschrieben.pdf" },
      { kind: "anschreiben", signed: false, file: "20261009-Grothusheitkamp/20261009-Grothusheitkamp-Anschreiben+Mietvertrag-skifreunde1.pdf" },
    ],
  },
  {
    key: "20270104-Neuhaus",
    customer: { type: "firma", firstName: "Leonie", lastName: "Neuhaus", email: "leonie.neuhaus@stadtallendorf.de", phone: "06428 707261 / 0151 75632637", company: "Stadtjugendpflege Stadtallendorf", street: "Bahnhofstraße 2", zip: "35260", city: "Stadtallendorf", country: "DE" },
    booking: { status: "bestaetigt", arrival: "2027-01-04", departure: "2027-01-08", nights: 4, adults: 2, members: 0, children: 16, pupils: 0, teachers: 0, soloUse: true, accommodationCents: 78400, energyFlatCents: 8800, cleaningCents: CLEAN, soloSurchargeCents: SOLO, kurtaxeCents: 1760 },
    docs: [
      { kind: "mietvertrag", signed: true, file: "20270104-neuhaus-unterschrieben-Skifreunde Gütersloh e.V..pdf" },
      { kind: "anschreiben", signed: false, file: "20270104-Neuhaus-Anschreiben+Mietvertrag-skifreunde.pdf" },
    ],
  },
  // --- Angefragt (nicht unterschrieben) ---
  {
    key: "20260511-Corbett",
    customer: { type: "firma", firstName: "Margarete", lastName: "Corbett", email: "m.corbett@christopherus-haus.de", phone: "01577 6811279", company: "Christopherus-Schule Dortmund Holzen", street: "Hohle Eiche 28", zip: "44229", city: "Dortmund", country: "DE" },
    booking: { status: "angefragt", arrival: "2026-05-11", departure: "2026-05-16", nights: 5, adults: 5, members: 0, children: 0, pupils: 10, teachers: 0, soloUse: true, accommodationCents: 82500, energyFlatCents: 11000, cleaningCents: CLEAN, soloSurchargeCents: SOLO, kurtaxeCents: 0 },
    docs: [
      { kind: "anschreiben", signed: false, file: "20260511-Corbett/20260511-Corbett-Anschreiben+Mietvertrag3.pdf" },
    ],
  },
  {
    key: "20260522-Berges",
    customer: { type: "privat", firstName: "Michael", lastName: "Berges", email: "segreb1973@gmail.com", phone: "01711263460", company: null, street: "Holunderweg 4", zip: "58540", city: "Meinerzhagen", country: "DE" },
    booking: { status: "angefragt", arrival: "2026-05-22", departure: "2026-05-25", nights: 3, adults: 18, members: 0, children: 0, pupils: 0, teachers: 0, soloUse: true, accommodationCents: 97200, energyFlatCents: 6600, cleaningCents: CLEAN, soloSurchargeCents: SOLO, kurtaxeCents: 0 },
    docs: [
      { kind: "anschreiben", signed: false, file: "20260522-Berges/20260522-Berges-Anschreiben+Mietvertrag.pdf" },
      { kind: "meldeschein", signed: false, file: "meldescheine-berges-pdfDruck.pdf" },
    ],
  },
  {
    key: "20260719-Hirschmann",
    customer: { type: "verein", firstName: "Kathrin", lastName: "Hirschmann", email: "kathrin.hirschmann@johanniter.de", phone: "+49 221 99399-402", company: "Johanniter-Unfall-Hilfe e.V.", street: "Siegburger Str. 197", zip: "50679", city: "Köln", country: "DE" },
    booking: { status: "angefragt", arrival: "2026-06-19", departure: "2026-06-21", nights: 2, adults: 25, members: 0, children: 0, pupils: 0, teachers: 0, soloUse: true, accommodationCents: 90000, energyFlatCents: 4400, cleaningCents: CLEAN, soloSurchargeCents: SOLO, kurtaxeCents: 11000 },
    docs: [
      { kind: "anschreiben", signed: false, file: "20260719-Hirschmann/20260719-Hirschmann-Anschreiben+Mietvertrag-skifreunde1.pdf" },
    ],
  },
  {
    key: "20260904-Hermes",
    customer: { type: "verein", firstName: "Lukas", lastName: "Hermes", email: "hermes-l@bistum-muenster.de", phone: "015141915416", company: "Kath. Kirchengemeinde St. Peter", street: "Lange Str. 2", zip: "47228", city: "Duisburg", country: "DE" },
    booking: { status: "angefragt", arrival: "2026-09-04", departure: "2026-09-06", nights: 2, adults: 9, members: 0, children: 24, pupils: 0, teachers: 0, soloUse: false, accommodationCents: 80400, energyFlatCents: 4400, cleaningCents: CLEAN, soloSurchargeCents: 0, kurtaxeCents: 3960 },
    docs: [
      { kind: "anschreiben", signed: false, file: "20260904-Hermes/20260904-Hermes-Anschreiben+Mietvertrag-skifreunde.pdf" },
    ],
  },
  {
    key: "20260911-Bambana",
    customer: { type: "privat", firstName: "Inga", lastName: "Bambana", email: "inga@bambana.de", phone: "015155534854", company: null, street: "Vinzenzweg 15", zip: "48147", city: "Münster", country: "DE" },
    booking: { status: "angefragt", arrival: "2026-09-11", departure: "2026-09-13", nights: 2, adults: 7, members: 0, children: 9, pupils: 0, teachers: 0, soloUse: true, accommodationCents: 43200, energyFlatCents: 4400, cleaningCents: CLEAN, soloSurchargeCents: SOLO, kurtaxeCents: 3080 },
    docs: [
      { kind: "anschreiben", signed: false, file: "20260911-Bambana/20260911-Bambana-Anschreiben+Mietvertrag-skifreunde.pdf" },
    ],
  },
  {
    key: "20261002-Söldenwagner",
    customer: { type: "privat", firstName: "Ursula", lastName: "Söldenwagner", email: "ursula.soeldenwagner@gmx.de", phone: "0252118072 / 016098532596", company: "Familien Treffen Schniederkötter", street: "Dünninghausen 16", zip: "59269", city: "Beckum", country: "DE" },
    booking: { status: "angefragt", arrival: "2026-10-02", departure: "2026-10-06", nights: 4, adults: 20, members: 0, children: 0, pupils: 0, teachers: 0, soloUse: true, accommodationCents: 144000, energyFlatCents: 8800, cleaningCents: CLEAN, soloSurchargeCents: SOLO, kurtaxeCents: 17600 },
    docs: [
      { kind: "anschreiben", signed: false, file: "20261002-Söldenwagner/20261002-Söldenwagner-Anschreiben+Mietvertrag-skifreunde.pdf" },
    ],
  },
];

function subtotal(b: Rec["booking"]) {
  return b.accommodationCents + b.energyFlatCents + b.cleaningCents + b.soloSurchargeCents + b.kurtaxeCents;
}
function persons(b: Rec["booking"]) {
  return b.adults + b.members + b.children + b.pupils + b.teachers;
}

type Manifest = {
  createdAt: string;
  records: Array<{
    key: string;
    customerId: string;
    customerCreated: boolean;
    bookingId: string;
    bookingNumber: string;
    documentIds: string[];
    blobPathnames: string[];
  }>;
};

async function uniqueBookingNumber(db: any): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const year = 2026;
    const rand = Math.floor(Math.random() * 9000) + 1000;
    const num = `WH-${year}-${rand}`;
    const hit = await db.select({ id: schema.bookings.id }).from(schema.bookings).where(eq(schema.bookings.bookingNumber, num)).limit(1);
    if (!hit[0]) return num;
  }
  throw new Error("Konnte keine eindeutige Buchungsnummer finden");
}

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--yes");
  const revert = args.includes("--revert");
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL nicht gesetzt — .env.local nicht geladen?");
    process.exit(1);
  }
  const client = postgres(connectionString, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  try {
    if (revert) {
      await doRevert(db);
      return;
    }
    await doMigrate(db, write);
  } finally {
    await client.end();
  }
}

async function ensureDocumentsTable(db: any) {
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_kind') THEN
        CREATE TYPE document_kind AS ENUM ('mietvertrag','anschreiben','meldeschein','sonstiges');
      END IF;
    END $$;
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
      customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
      kind document_kind NOT NULL DEFAULT 'sonstiges',
      title varchar(255) NOT NULL,
      blob_url text NOT NULL,
      original_filename varchar(500),
      content_type varchar(100),
      size_bytes integer,
      signed boolean NOT NULL DEFAULT false,
      signed_at timestamp,
      uploaded_by varchar(255),
      source varchar(40) NOT NULL DEFAULT 'upload',
      created_at timestamp NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS documents_booking_idx ON documents (booking_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS documents_customer_idx ON documents (customer_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS documents_kind_idx ON documents (kind);`);
}

async function doMigrate(db: any, write: boolean) {
  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
  console.log(`\n=== Migration Mietverträge  (${write ? "SCHREIBEN" : "DRY-RUN"}) ===`);
  console.log(`Datensätze: ${DATA.length}  ·  Blob-Upload: ${hasBlob ? "aktiv" : "DEAKTIVIERT (kein BLOB_READ_WRITE_TOKEN)"}\n`);

  // Vorschau-Tabelle
  for (const r of DATA) {
    const b = r.booking;
    console.log(
      `• ${r.key.padEnd(26)} ${b.arrival}→${b.departure}  ${String(persons(b)).padStart(2)}P/${b.nights}N  ` +
      `Übernacht ${euro(subtotal(b) - b.kurtaxeCents).padStart(11)}  Kurtaxe ${euro(b.kurtaxeCents).padStart(9)}  ` +
      `Summe(o.Kaution) ${euro(subtotal(b)).padStart(11)}  [${b.status}]  ${r.customer.type}`
    );
  }

  if (!write) {
    console.log("\nℹ️  DRY-RUN — nichts geschrieben. Mit  --yes  ausführen.");
    return;
  }

  await ensureDocumentsTable(db);

  let put: any = null;
  if (hasBlob) {
    ({ put } = await import("@vercel/blob"));
  }

  const manifest: Manifest = { createdAt: new Date().toISOString(), records: [] };

  for (const r of DATA) {
    const b = r.booking;
    // Kunde: dedupe per E-Mail
    const email = r.customer.email.toLowerCase();
    const existing = await db.select().from(schema.customers).where(eq(schema.customers.email, email)).limit(1);
    let customerId: string;
    let customerCreated = false;
    if (existing[0]) {
      customerId = existing[0].id;
    } else {
      const ins = await db.insert(schema.customers).values({
        type: r.customer.type,
        firstName: r.customer.firstName,
        lastName: r.customer.lastName,
        email,
        phone: r.customer.phone ?? null,
        company: r.customer.company ?? null,
        street: r.customer.street ?? null,
        zip: r.customer.zip ?? null,
        city: r.customer.city ?? null,
        country: r.customer.country ?? "DE",
      }).returning({ id: schema.customers.id });
      customerId = ins[0].id;
      customerCreated = true;
    }

    const bookingNumber = await uniqueBookingNumber(db);
    const sub = subtotal(b);
    const insB = await db.insert(schema.bookings).values({
      bookingNumber,
      customerId,
      status: b.status,
      arrival: b.arrival,
      departure: b.departure,
      nights: b.nights,
      adults: b.adults,
      members: b.members,
      children: b.children,
      pupils: b.pupils,
      teachers: b.teachers,
      persons: persons(b),
      institution: r.customer.company ?? null,
      accommodationCents: b.accommodationCents,
      kurtaxeCents: b.kurtaxeCents,
      energyFlatCents: b.energyFlatCents,
      cleaningCents: b.cleaningCents,
      soloSurchargeCents: b.soloSurchargeCents,
      minOccupancySurchargeCents: 0,
      extrasCents: 0,
      subtotalCents: sub,
      depositCents: DEP,
      totalCents: sub,
      paidCents: 0,
      cleaningOptedIn: true,
      soloUse: b.soloUse,
      source: "Migration",
    }).returning({ id: schema.bookings.id });
    const bookingId = insB[0].id;

    // Dokumente (nur mit Blob-Token)
    const documentIds: string[] = [];
    const blobPathnames: string[] = [];
    if (hasBlob && put) {
      for (const d of r.docs) {
        const abs = path.join(DOCS_BASE, d.file);
        if (!fs.existsSync(abs)) {
          console.warn(`   ⚠️  Datei fehlt, übersprungen: ${d.file}`);
          continue;
        }
        const orig = path.basename(d.file);
        const pathname = `vertraege/${bookingNumber}/${d.kind}-${orig}`;
        const blob = await put(pathname, fs.readFileSync(abs), {
          access: "public",
          addRandomSuffix: false,
          contentType: "application/pdf",
        });
        const insD = await db.insert(schema.documents).values({
          bookingId,
          customerId,
          kind: d.kind,
          title: `${d.kind === "mietvertrag" ? "Mietvertrag" : d.kind === "anschreiben" ? "Anschreiben + Vertrag" : "Meldeschein"} ${r.customer.lastName}`,
          blobUrl: blob.url,
          originalFilename: orig,
          contentType: "application/pdf",
          sizeBytes: fs.statSync(abs).size,
          signed: d.signed,
          source: "migration",
        }).returning({ id: schema.documents.id });
        documentIds.push(insD[0].id);
        blobPathnames.push(pathname);
      }
    }

    await db.insert(schema.activityLog).values({
      who: "Migration",
      what: `Altbestand migriert: ${r.key} (${persons(b)} P · ${b.nights} N · ${b.status})`,
      bookingId,
    });

    manifest.records.push({ key: r.key, customerId, customerCreated, bookingId, bookingNumber, documentIds, blobPathnames });
    console.log(`   ✓ ${r.key}  →  Buchung ${bookingNumber}  (${documentIds.length} Dok.)`);
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Fertig. ${manifest.records.length} Buchungen migriert. Manifest: ${path.relative(process.cwd(), MANIFEST)}`);
  if (!hasBlob) console.log("ℹ️  PDFs NICHT hochgeladen (kein BLOB_READ_WRITE_TOKEN). Erneut mit Token laufen lassen, um Dokumente nachzuladen.");
  console.log("↩️  Rückgängig machen:  npx tsx scripts/migrate-vertraege.ts --revert");
}

async function doRevert(db: any) {
  if (!fs.existsSync(MANIFEST)) {
    console.error(`❌ Kein Manifest gefunden (${path.relative(process.cwd(), MANIFEST)}). Nichts zu reverten.`);
    process.exit(1);
  }
  const manifest: Manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf-8"));
  console.log(`\n=== REVERT — ${manifest.records.length} migrierte Vorgänge zurücknehmen ===\n`);

  let blobDel: any = null;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    ({ del: blobDel } = await import("@vercel/blob"));
  }

  for (const rec of manifest.records) {
    // Blobs löschen
    if (blobDel) {
      for (const p of rec.blobPathnames) {
        try { await blobDel(p); } catch (e: any) { console.warn(`   ⚠️ Blob ${p}: ${e.message}`); }
      }
    }
    // Dokumente (FK-Cascade über booking würde sie ohnehin entfernen, aber explizit ist sauber)
    await db.delete(schema.documents).where(eq(schema.documents.bookingId, rec.bookingId));
    // activity_log entkoppeln/löschen
    await db.delete(schema.activityLog).where(eq(schema.activityLog.bookingId, rec.bookingId));
    // Buchung
    await db.delete(schema.bookings).where(eq(schema.bookings.id, rec.bookingId));
    // Kunde nur löschen, wenn von dieser Migration angelegt UND keine weitere Buchung hängt
    if (rec.customerCreated) {
      const remaining = await db.select({ id: schema.bookings.id }).from(schema.bookings).where(eq(schema.bookings.customerId, rec.customerId)).limit(1);
      if (!remaining[0]) {
        await db.delete(schema.customers).where(eq(schema.customers.id, rec.customerId));
      } else {
        console.warn(`   ⚠️ Kunde ${rec.customerId} behalten (hat noch andere Buchungen).`);
      }
    }
    console.log(`   ✓ zurückgenommen: ${rec.key} (${rec.bookingNumber})`);
  }

  fs.renameSync(MANIFEST, MANIFEST + ".reverted");
  console.log(`\n✅ Revert fertig. Manifest archiviert als ${path.relative(process.cwd(), MANIFEST + ".reverted")}.`);
  console.log("ℹ️  Die documents-Tabelle bleibt bestehen. Komplett entfernen (optional):");
  console.log("    DROP TABLE IF EXISTS documents; DROP TYPE IF EXISTS document_kind;");
}

main().catch((e) => {
  console.error("FEHLER:", e);
  process.exit(1);
});
