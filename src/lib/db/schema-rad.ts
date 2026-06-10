/**
 * Radtouren-Matching — Tabellen.
 *
 * Bewusst in einer eigenen Datei (nicht in schema.ts), damit parallele
 * Schema-Arbeit unberührt bleibt. Die Tabellen wurden per SQL-Migration
 * angelegt (siehe drizzle/rad-matching.sql).
 */
import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";

/** Eine Interessensbekundung: E-Mail + gewünschte Wochenend-Slots. */
export const rideInterests = pgTable(
  "ride_interests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 120 }),
    /** Wochenend-Slots als ISO-Datum des Freitags, z. B. ["2026-07-10", …]. */
    slots: jsonb("slots").$type<string[]>().notNull(),
    /** Interesse am Gerke-Lunchpaket („Brotzeit mit Frikadellen"). */
    lunch: boolean("lunch").notNull().default(false),
    verifyToken: varchar("verify_token", { length: 64 }).notNull(),
    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index("ride_interests_email_idx").on(t.email),
  })
);

/** Bereits gematchte (benachrichtigte) Slots — verhindert Doppel-Mails. */
export const rideMatches = pgTable("ride_matches", {
  /** ISO-Datum des Freitags. */
  slot: varchar("slot", { length: 10 }).primaryKey(),
  participantCount: integer("participant_count").notNull(),
  lunchCount: integer("lunch_count").notNull().default(0),
  notifiedAt: timestamp("notified_at").notNull().defaultNow(),
});
