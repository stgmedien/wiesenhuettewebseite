/**
 * Seed für Konfigurations-Stammdaten:
 *   - Tariffs (basierend auf den aktuellen Hardcoded-Preisen)
 *   - Extras (typische Zusatzleistungen)
 *   - Permissions (Default-Capabilities pro Rolle)
 *
 * Aufruf:    npm run db:seed:config
 * Idempotent: Re-Run aktualisiert per Code/UniqueKey statt zu duplizieren.
 */

import "dotenv/config";
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });

import { db } from "./index";
import { tariffs, extras, permissions } from "./schema";
import { eq, and } from "drizzle-orm";
import { PRICES } from "../pricing";

// =============================================================
// TARIFFS
// =============================================================

const DEFAULT_TARIFFS = [
  {
    name: "Erwachsene Nichtmitglieder",
    category: "nichtmitglied" as const,
    priceCentsPerNight: PRICES.adultNonMemberCents,
    minNights: 2,
  },
  {
    name: "Erwachsene Vereinsmitglieder",
    category: "mitglied" as const,
    priceCentsPerNight: PRICES.adultMemberCents,
    minNights: 2,
  },
  {
    name: "Kinder (4–15 J.)",
    category: "kind" as const,
    priceCentsPerNight: PRICES.childCents,
    minNights: 2,
  },
  {
    name: "Schüler (Schulgruppe)",
    category: "schueler" as const,
    priceCentsPerNight: PRICES.pupilCents,
    minNights: 2,
  },
  {
    name: "Lehrkräfte",
    category: "lehrer" as const,
    priceCentsPerNight: PRICES.adultNonMemberCents,
    minNights: 2,
  },
];

async function seedTariffs() {
  for (const t of DEFAULT_TARIFFS) {
    const existing = await db
      .select()
      .from(tariffs)
      .where(and(eq(tariffs.category, t.category), eq(tariffs.active, true)))
      .limit(1);
    if (existing[0]) {
      await db
        .update(tariffs)
        .set({
          name: t.name,
          priceCentsPerNight: t.priceCentsPerNight,
          minNights: t.minNights,
          updatedAt: new Date(),
        })
        .where(eq(tariffs.id, existing[0].id));
      console.log(`✓ tariff updated: ${t.name}`);
    } else {
      await db.insert(tariffs).values(t);
      console.log(`✓ tariff created: ${t.name}`);
    }
  }
}

// =============================================================
// EXTRAS — leer: die frueheren Default-Extras (Brennholz, Handtuch-Set,
// Bettwaesche-Set, Fruehstuecks-Paket, Skiservice-Termin) spiegelten keine
// tatsaechlich angebotene Leistung des Vereins wider und wurden entfernt
// (siehe drizzle/remove-unused-extras.sql fuer den einmaligen DB-Cleanup
// der schon gesaeten Zeilen). Manager kann bei Bedarf ueber /m/stammdaten
// echte Extras anlegen.
// =============================================================

const DEFAULT_EXTRAS: {
  code: string;
  label: string;
  description: string;
  unitCents: number;
  unitLabel: string;
  perNight: boolean;
  perPerson: boolean;
  sortOrder: number;
  active: boolean;
}[] = [];

async function seedExtras() {
  for (const e of DEFAULT_EXTRAS) {
    const existing = await db.select().from(extras).where(eq(extras.code, e.code)).limit(1);
    if (existing[0]) {
      await db
        .update(extras)
        .set({
          label: e.label,
          description: e.description,
          unitCents: e.unitCents,
          unitLabel: e.unitLabel,
          perNight: e.perNight,
          perPerson: e.perPerson,
          sortOrder: e.sortOrder,
          updatedAt: new Date(),
          // active bewusst nicht überschreiben — Manager-Entscheidung respektieren
        })
        .where(eq(extras.id, existing[0].id));
      console.log(`✓ extra updated: ${e.code}`);
    } else {
      await db.insert(extras).values(e);
      console.log(`✓ extra created: ${e.code}`);
    }
  }
}

// =============================================================
// PERMISSIONS — Default-Capability-Set
// =============================================================

const DEFAULT_PERMISSIONS = [
  // Manager-Capabilities
  { role: "manager" as const, capability: "bookings.read", description: "Buchungen einsehen" },
  { role: "manager" as const, capability: "bookings.create", description: "Buchung anlegen" },
  { role: "manager" as const, capability: "bookings.update", description: "Buchung bearbeiten" },
  { role: "manager" as const, capability: "bookings.cancel", description: "Buchung stornieren" },
  { role: "manager" as const, capability: "bookings.refund_deposit", description: "Kaution erstatten" },
  { role: "manager" as const, capability: "customers.read", description: "Kunden einsehen" },
  { role: "manager" as const, capability: "customers.update", description: "Kunden bearbeiten" },
  { role: "manager" as const, capability: "customers.verify_membership", description: "Mitgliedschaft verifizieren" },
  { role: "manager" as const, capability: "inquiries.handle", description: "Anfragen bearbeiten" },
  { role: "manager" as const, capability: "blocked_dates.manage", description: "Sperrzeiten verwalten" },
  { role: "manager" as const, capability: "extras.manage", description: "Extras verwalten" },
  { role: "manager" as const, capability: "blog.manage", description: "Blog-Artikel verwalten" },
  { role: "manager" as const, capability: "settings.update", description: "Einstellungen ändern" },
  { role: "manager" as const, capability: "handovers.create", description: "Übergaben dokumentieren" },
  { role: "manager" as const, capability: "damage_reports.manage", description: "Schadensmeldungen verwalten" },
  { role: "manager" as const, capability: "invoices.manage", description: "Rechnungen verwalten" },
  { role: "manager" as const, capability: "notes.create", description: "Notizen anlegen" },

  // Admin-Capabilities zusätzlich
  { role: "admin" as const, capability: "*", description: "Alle Rechte" },
  { role: "admin" as const, capability: "users.manage", description: "Benutzer verwalten" },
  { role: "admin" as const, capability: "tariffs.manage", description: "Tarife verwalten" },
  { role: "admin" as const, capability: "audit.read", description: "Audit-Log einsehen" },
  { role: "admin" as const, capability: "permissions.manage", description: "Rollen-Permissions ändern" },
];

async function seedPermissions() {
  for (const p of DEFAULT_PERMISSIONS) {
    const existing = await db
      .select()
      .from(permissions)
      .where(and(eq(permissions.role, p.role), eq(permissions.capability, p.capability)))
      .limit(1);
    if (existing[0]) {
      await db
        .update(permissions)
        .set({ description: p.description })
        .where(eq(permissions.id, existing[0].id));
    } else {
      await db.insert(permissions).values(p);
    }
  }
  console.log(`✓ ${DEFAULT_PERMISSIONS.length} permissions seeded`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set. Add it to .env.local first.");
    process.exit(1);
  }

  console.log("Seeding configuration data ...");
  await seedTariffs();
  await seedExtras();
  await seedPermissions();
  console.log("Configuration seed done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .then(() => process.exit(0));
