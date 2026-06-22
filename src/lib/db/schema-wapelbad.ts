/**
 * Wapelbad-Anmeldungen — Tabelle.
 *
 * Bewusst in einer eigenen Datei (nicht in schema.ts), analog zu schema-rad.ts.
 * Die Tabelle wird per SQL-Migration angelegt (siehe drizzle/wapelbad.sql).
 */
import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/** Eine Anmeldung zum Wapelbad-Vereinsfest. */
export const wapelbadRegistrations = pgTable(
  "wapelbad_registrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    persons: integer("persons").notNull().default(1),
    /** Nimmt am Grillbuffet teil (10 € pro Person). */
    grill: boolean("grill").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    createdAtIdx: index("wapelbad_registrations_created_at_idx").on(t.createdAt),
  })
);
