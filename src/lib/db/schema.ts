import {
  pgTable,
  text,
  integer,
  timestamp,
  date,
  boolean,
  jsonb,
  pgEnum,
  uuid,
  varchar,
  serial,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// =============================================================
// ENUMS
// =============================================================

export const customerTypeEnum = pgEnum("customer_type", [
  "privat",
  "mitglied",
  "verein",
  "firma",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "angefragt",
  "bestaetigt",
  "bezahlt",
  "angereist",
  "abgereist",
  "storniert",
  "wartung", // internal block (Sperrzeit)
]);

export const paymentKindEnum = pgEnum("payment_kind", [
  "anzahlung",
  "restzahlung",
  "vollzahlung",
  "kaution",
  "rueckerstattung",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "offen",
  "erhalten",
  "fehlgeschlagen",
  "erstattet",
]);

export const userRoleEnum = pgEnum("user_role", ["customer", "manager", "admin"]);

// =============================================================
// USERS — for both managers (login) and (later) customer accounts
// =============================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").notNull().default("customer"),
  emailVerified: timestamp("email_verified"),

  // Erzwingt Passwort-Wechsel beim nächsten Login (z. B. nach Admin-Reset)
  mustChangePassword: boolean("must_change_password").notNull().default(false),

  // 2FA (TOTP) — Pflicht für Admin-Rollen, optional für Manager
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorSecret: text("two_factor_secret"),                                          // Base32
  twoFactorBackupCodes: jsonb("two_factor_backup_codes").$type<string[]>(),            // gehashte Einmal-Codes

  // Login-Audit
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: varchar("last_login_ip", { length: 45 }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// =============================================================
// EMAIL CHANGE REQUESTS — Mailwechsel mit Token-Verifizierung
// =============================================================

export const emailChangeRequests = pgTable(
  "email_change_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    newEmail: varchar("new_email", { length: 255 }).notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("email_change_user_idx").on(t.userId),
    expiresIdx: index("email_change_expires_idx").on(t.expiresAt),
  })
);

// =============================================================
// CUSTOMERS — guest details (decoupled from auth user)
// =============================================================

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    type: customerTypeEnum("type").notNull().default("privat"),
    firstName: varchar("first_name", { length: 120 }).notNull(),
    lastName: varchar("last_name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 60 }),
    company: varchar("company", { length: 255 }),
    memberId: varchar("member_id", { length: 60 }),
    street: varchar("street", { length: 255 }),
    zip: varchar("zip", { length: 20 }),
    city: varchar("city", { length: 120 }),
    country: varchar("country", { length: 60 }).notNull().default("DE"),
    notes: text("notes"),
    tags: jsonb("tags").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index("customers_email_idx").on(t.email),
  })
);

// =============================================================
// BOOKINGS
// =============================================================

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingNumber: varchar("booking_number", { length: 20 }).notNull().unique(),
    customerId: uuid("customer_id")
      .references(() => customers.id, { onDelete: "restrict" }),
    status: bookingStatusEnum("status").notNull().default("angefragt"),
    arrival: date("arrival").notNull(),
    departure: date("departure").notNull(),
    nights: integer("nights").notNull(),

    // Personenzahlen
    adults: integer("adults").notNull().default(0),         // Nichtmitglieder ab 16
    members: integer("members").notNull().default(0),       // Vereinsmitglieder ab 16
    children: integer("children").notNull().default(0),     // 4–15 J.
    pupils: integer("pupils").notNull().default(0),         // Schüler bei Schulgruppen
    teachers: integer("teachers").notNull().default(0),     // Lehrkräfte (zählen als Erwachsene Nichtmitglieder)

    purpose: varchar("purpose", { length: 255 }),
    persons: integer("persons").notNull(),                  // Summe (cached)

    // Pricing snapshot (in cents — alles als integer cents speichern, GoBD-sicher)
    accommodationCents: integer("accommodation_cents").notNull().default(0),
    kurtaxeCents: integer("kurtaxe_cents").notNull().default(0),
    energyFlatCents: integer("energy_flat_cents").notNull().default(0),
    cleaningCents: integer("cleaning_cents").notNull().default(0),
    soloSurchargeCents: integer("solo_surcharge_cents").notNull().default(0),
    extrasCents: integer("extras_cents").notNull().default(0),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    depositCents: integer("deposit_cents").notNull().default(0),  // Kaution (separat)
    totalCents: integer("total_cents").notNull().default(0),      // ohne Kaution
    paidCents: integer("paid_cents").notNull().default(0),

    // Manager kann Kaution-Auto-Refund pausieren (z. B. bei Schaden)
    depositHold: boolean("deposit_hold").notNull().default(false),
    depositHoldReason: text("deposit_hold_reason"),
    depositHoldAt: timestamp("deposit_hold_at"),
    depositHoldBy: varchar("deposit_hold_by", { length: 255 }),

    // Extras snapshot (line items as JSON for transparency)
    extrasSnapshot: jsonb("extras_snapshot")
      .$type<Array<{ id: string; label: string; qty: number; unitCents: number; totalCents: number }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),

    cleaningOptedIn: boolean("cleaning_opted_in").notNull().default(true),
    soloUse: boolean("solo_use").notNull().default(false),

    stripeSessionId: text("stripe_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),

    source: varchar("source", { length: 60 }).notNull().default("Portal"),
    keyMethod: varchar("key_method", { length: 60 }).default("Schlüsselsafe"),

    internalNotes: text("internal_notes"),
    customerMessage: text("customer_message"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    arrivalIdx: index("bookings_arrival_idx").on(t.arrival),
    departureIdx: index("bookings_departure_idx").on(t.departure),
    statusIdx: index("bookings_status_idx").on(t.status),
  })
);

// =============================================================
// PAYMENTS
// =============================================================

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  kind: paymentKindEnum("kind").notNull(),
  status: paymentStatusEnum("status").notNull().default("offen"),
  amountCents: integer("amount_cents").notNull(),
  method: varchar("method", { length: 60 }),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  receivedAt: timestamp("received_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// =============================================================
// EMAIL LOG
// =============================================================

export const emailLog = pgTable("email_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
  to: varchar("to", { length: 255 }).notNull(),
  subject: text("subject").notNull(),
  template: varchar("template", { length: 60 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("sent"),
  error: text("error"),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

// =============================================================
// ACTIVITY LOG (for the manager backend)
// =============================================================

export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  who: varchar("who", { length: 255 }).notNull(),
  what: text("what").notNull(),
  bookingId: uuid("booking_id"),
  at: timestamp("at").notNull().defaultNow(),
});

// =============================================================
// SITE SETTINGS — Singleton-Row mit Manager-konfigurierbaren Werten
// =============================================================

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  cleaningDaysAfterDeparture: integer("cleaning_days_after_departure").notNull().default(1),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: varchar("updated_by", { length: 255 }),
});

// =============================================================
// BLOG / CMS
// =============================================================

export const blogStatusEnum = pgEnum("blog_status", ["draft", "published", "archived"]);

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    excerpt: text("excerpt"),
    contentHtml: text("content_html").notNull().default(""),
    contentJson: jsonb("content_json"), // TipTap doc state
    coverImageUrl: text("cover_image_url"),
    coverImageAlt: varchar("cover_image_alt", { length: 500 }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    status: blogStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at"),
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    readingMinutes: integer("reading_minutes").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: index("blog_posts_slug_idx").on(t.slug),
    statusIdx: index("blog_posts_status_idx").on(t.status),
    publishedIdx: index("blog_posts_published_idx").on(t.publishedAt),
  })
);

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  author: one(users, { fields: [blogPosts.authorId], references: [users.id] }),
}));

// =============================================================
// RELATIONS
// =============================================================

export const customersRelations = relations(customers, ({ many, one }) => ({
  bookings: many(bookings),
  user: one(users, { fields: [customers.userId], references: [users.id] }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  customer: one(customers, { fields: [bookings.customerId], references: [customers.id] }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
}));

// =============================================================
// Type inference helpers
// =============================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
