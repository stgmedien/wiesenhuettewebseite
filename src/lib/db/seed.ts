/**
 * Seed for the Wiesenhütte demo / dev environment.
 *
 *   npm run db:seed
 *
 * Creates:
 *   - 1 manager user (jonathan@stg-medien.com) with the IONOS password as initial pass
 *   - 1 admin user (admin@wiesenhuette.de — change after first login)
 *   - A handful of demo bookings spanning past, present, future + one Sperrzeit
 *
 * Idempotent: re-runs upsert by email/booking number.
 */

import "dotenv/config";
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { db } from "./index";
import { users, customers, bookings, payments, activityLog } from "./schema";
import { eq } from "drizzle-orm";
import { calculatePrice } from "../pricing";
import { generateBookingNumber } from "../utils";

const MANAGER_EMAIL = "jonathan@stg-medien.com";
const MANAGER_PASS = process.env.MANAGER_INITIAL_PASSWORD ?? process.env.SMTP_PASSWORD ?? "ChangeMe123!";

async function upsertUser(email: string, name: string, role: "manager" | "admin", password: string) {
  const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const passwordHash = await bcrypt.hash(password, 12);
  if (found[0]) {
    await db.update(users).set({ name, role, passwordHash, updatedAt: new Date() }).where(eq(users.email, email));
    console.log(`✓ user updated: ${email} (${role})`);
  } else {
    await db.insert(users).values({ email, name, role, passwordHash });
    console.log(`✓ user created: ${email} (${role})`);
  }
}

async function upsertCustomer(c: {
  email: string;
  firstName: string;
  lastName: string;
  type: "privat" | "mitglied" | "verein" | "firma";
  phone?: string;
  company?: string;
}) {
  const found = await db.select().from(customers).where(eq(customers.email, c.email.toLowerCase())).limit(1);
  if (found[0]) return found[0].id;
  const ins = await db.insert(customers).values({ ...c, email: c.email.toLowerCase() }).returning({ id: customers.id });
  return ins[0].id;
}

async function ensureBooking(opts: {
  bookingNumber: string;
  customerId: string;
  status: "angefragt" | "bestaetigt" | "bezahlt" | "angereist" | "abgereist" | "storniert" | "wartung";
  arrival: string;
  departure: string;
  adults: number;
  members: number;
  children: number;
  pupils: number;
  teachers: number;
  soloUse: boolean;
  purpose: string;
  source?: string;
}) {
  const found = await db.select().from(bookings).where(eq(bookings.bookingNumber, opts.bookingNumber)).limit(1);
  if (found[0]) return found[0].id;

  const persons = {
    adults: opts.adults, members: opts.members, children: opts.children,
    pupils: opts.pupils, teachers: opts.teachers,
  };
  const breakdown = calculatePrice({
    arrival: opts.arrival,
    departure: opts.departure,
    persons,
    soloUse: opts.soloUse,
  });
  const totalPersons = persons.adults + persons.members + persons.children + persons.pupils + persons.teachers;
  const paid =
    opts.status === "bezahlt" || opts.status === "angereist" || opts.status === "abgereist"
      ? breakdown.subtotalCents + breakdown.depositCents
      : 0;

  const ins = await db
    .insert(bookings)
    .values({
      bookingNumber: opts.bookingNumber,
      customerId: opts.customerId,
      status: opts.status,
      arrival: opts.arrival,
      departure: opts.departure,
      nights: breakdown.nights,
      adults: persons.adults,
      members: persons.members,
      children: persons.children,
      pupils: persons.pupils,
      teachers: persons.teachers,
      persons: totalPersons,
      purpose: opts.purpose,
      accommodationCents: breakdown.accommodationCents,
      kurtaxeCents: 0,
      energyFlatCents: breakdown.energyFlatCents,
      cleaningCents: breakdown.cleaningCents,
      soloSurchargeCents: breakdown.soloSurchargeCents,
      minOccupancySurchargeCents: breakdown.minOccupancySurchargeCents,
      extrasCents: breakdown.extrasCents,
      subtotalCents: breakdown.subtotalCents,
      depositCents: breakdown.depositCents,
      totalCents: breakdown.subtotalCents,
      paidCents: paid,
      cleaningOptedIn: opts.status !== "wartung",
      soloUse: opts.soloUse,
      source: opts.source ?? "Demo-Seed",
    })
    .returning({ id: bookings.id });

  if (paid > 0) {
    await db.insert(payments).values({
      bookingId: ins[0].id,
      kind: "vollzahlung",
      status: "erhalten",
      amountCents: paid,
      method: "Stripe (Demo)",
      receivedAt: new Date(opts.arrival),
    });
  }

  console.log(`✓ booking ${opts.bookingNumber} (${opts.status})`);
  return ins[0].id;
}

const today = new Date();
today.setHours(0, 0, 0, 0);
const dayIso = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set. Add it to .env.local first.");
    process.exit(1);
  }

  console.log("Seeding ...");

  await upsertUser(MANAGER_EMAIL, "Jonathan (STG Medien)", "admin", MANAGER_PASS);
  await upsertUser("admin@wiesenhuette.de", "Vorstand", "admin", "ChangeMeNow!");

  // Demo customers
  const c1 = await upsertCustomer({
    email: "maren.holtkamp@web.de",
    firstName: "Maren",
    lastName: "Holtkamp",
    type: "mitglied",
  });
  const c2 = await upsertCustomer({
    email: "sekretariat@esg-guetersloh.de",
    firstName: "ESG",
    lastName: "Gütersloh",
    type: "verein",
    company: "ESG — Jgst. 11",
  });
  const c3 = await upsertCustomer({
    email: "thorsten.wiegmann@gmail.com",
    firstName: "Thorsten",
    lastName: "Wiegmann",
    type: "privat",
  });
  const c4 = await upsertCustomer({
    email: "events@pott-soehne.de",
    firstName: "Pott",
    lastName: "& Söhne GmbH",
    type: "firma",
    company: "Pott & Söhne GmbH",
  });

  // Spread of bookings
  await ensureBooking({
    bookingNumber: "WH-2026-1001",
    customerId: c1,
    status: "abgereist",
    arrival: dayIso(-30),
    departure: dayIso(-26),
    adults: 6, members: 2, children: 4, pupils: 0, teachers: 0,
    soloUse: false,
    purpose: "Gruppen-Aufenthalt Frühling",
  });
  await ensureBooking({
    bookingNumber: "WH-2026-1002",
    customerId: c2,
    status: "abgereist",
    arrival: dayIso(-90),
    departure: dayIso(-85),
    adults: 0, members: 0, children: 0, pupils: 25, teachers: 3,
    soloUse: false,
    purpose: "ESG Skifreizeit Jgst. 11",
  });
  await ensureBooking({
    bookingNumber: "WH-2026-1003",
    customerId: c3,
    status: "bezahlt",
    arrival: dayIso(14),
    departure: dayIso(17),
    adults: 4, members: 0, children: 6, pupils: 0, teachers: 0,
    soloUse: false,
    purpose: "Pfingsten mit Gruppe",
  });
  await ensureBooking({
    bookingNumber: "WH-2026-1004",
    customerId: c4,
    status: "bestaetigt",
    arrival: dayIso(45),
    departure: dayIso(47),
    adults: 11, members: 0, children: 0, pupils: 0, teachers: 0,
    soloUse: true,
    purpose: "Strategieklausur Pott & Söhne",
  });
  await ensureBooking({
    bookingNumber: "WH-2026-1005",
    customerId: c1,
    status: "angefragt",
    arrival: dayIso(120),
    departure: dayIso(124),
    adults: 8, members: 4, children: 6, pupils: 0, teachers: 0,
    soloUse: false,
    purpose: "Gruppen-Aufenthalt Sommer",
  });
  await ensureBooking({
    bookingNumber: "WH-2026-9001",
    customerId: c1,
    status: "wartung",
    arrival: dayIso(7),
    departure: dayIso(9),
    adults: 0, members: 0, children: 0, pupils: 0, teachers: 0,
    soloUse: false,
    purpose: "WARTUNG: Heizung & Schornsteinfeger",
    source: "Intern",
  });

  await db.insert(activityLog).values({
    who: "System",
    what: "Demo-Daten geladen (Seed)",
  });

  console.log("Seeding done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .then(() => process.exit(0));
