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

export const membershipStatusEnum = pgEnum("membership_status", [
  "none",
  "pending",   // Customer hat behauptet Mitglied zu sein, Verifizierung steht aus
  "verified",  // Manager hat Mitgliedschaft bestätigt
  "rejected",  // Manager hat Mitgliedschaft abgelehnt
]);

export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "new",
  "in_progress",
  "replied",
  "converted",
  "rejected",
]);

export const handoverKindEnum = pgEnum("handover_kind", ["checkin", "checkout"]);

export const damageStatusEnum = pgEnum("damage_status", [
  "offen",
  "in_bearbeitung",
  "behoben",
  "abgerechnet",
]);

export const damageSeverityEnum = pgEnum("damage_severity", [
  "klein",       // Bagatell, keine Verrechnung
  "mittel",      // Reparatur < 100 €
  "gross",       // Reparatur > 100 €
  "abrechnung",  // mit Kaution verrechnen
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "entwurf",
  "ausgestellt",
  "bezahlt",
  "storniert",
]);

export const noteScopeEnum = pgEnum("note_scope", [
  "booking",
  "customer",
  "inquiry",
]);

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

  // Erzwingt 2FA-Setup beim nächsten Login (Admin-Pflicht für echte Manager)
  mustEnable2FA: boolean("must_enable_2fa").notNull().default(false),

  // Login-Audit
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: varchar("last_login_ip", { length: 45 }),

  // DSGVO Soft-Delete: Kunde fordert Loeschung an, hard-delete nach Frist (30 Tage)
  deletedAt: timestamp("deleted_at"),

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

    // Mitgliedschafts-Verifizierung — manueller Workflow
    membershipStatus: membershipStatusEnum("membership_status").notNull().default("none"),
    membershipVerifiedAt: timestamp("membership_verified_at"),
    membershipVerifiedBy: varchar("membership_verified_by", { length: 255 }),
    membershipRejectedReason: text("membership_rejected_reason"),

    // Mitgliedsbeitrag-Abo via Stripe (optional — perspektivisch fuer Automatik)
    membershipTierCode: varchar("membership_tier_code", { length: 60 }),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripeSubscriptionCustomerId: text("stripe_subscription_customer_id"),
    subscriptionStatus: varchar("subscription_status", { length: 30 }), // active / past_due / canceled / unpaid / incomplete
    subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),

    // Loyalty — gecachter Counter, wird beim Setzen auf "abgereist" inkrementiert
    completedStays: integer("completed_stays").notNull().default(0),
    loyaltyTier: integer("loyalty_tier").notNull().default(0), // Stufe: 0=keine, 1=>=3 Aufenthalte, 2=>=10
    loyaltyDiscountIssuedAt: timestamp("loyalty_discount_issued_at"),

    // DSGVO: anonymisiert nach Konto-Loeschung. Buchungen+Rechnungen bleiben erhalten
    // (10 Jahre handelsrechtliche Aufbewahrungspflicht), aber PII wird ueberschrieben.
    anonymizedAt: timestamp("anonymized_at"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index("customers_email_idx").on(t.email),
    membershipStatusIdx: index("customers_membership_status_idx").on(t.membershipStatus),
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
    discountCents: integer("discount_cents").notNull().default(0), // eingeloester Rabatt
    discountCode: varchar("discount_code", { length: 30 }),
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
// SEASONS — zeitliche Tarif-Perioden (Hauptsaison, Nebensaison, Ferien)
// =============================================================

export const seasons = pgTable(
  "seasons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    code: varchar("code", { length: 30 }).notNull().unique(),     // z.B. "winter", "sommer"
    startMonthDay: varchar("start_month_day", { length: 5 }).notNull(),  // "MM-DD" yearly recurrence (e.g. "12-15")
    endMonthDay: varchar("end_month_day", { length: 5 }).notNull(),      // "MM-DD"
    priority: integer("priority").notNull().default(0),           // Höhere Zahl gewinnt bei Überschneidungen
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    activeIdx: index("seasons_active_idx").on(t.active),
  })
);

// =============================================================
// TARIFFS — Personenkategorie × Saison → Preis pro Nacht
// =============================================================

export const tariffCategoryEnum = pgEnum("tariff_category", [
  "mitglied",
  "nichtmitglied",
  "kind",     // 4–15 J.
  "schueler",
  "lehrer",
]);

export const tariffs = pgTable(
  "tariffs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    category: tariffCategoryEnum("category").notNull(),
    seasonId: uuid("season_id").references(() => seasons.id, { onDelete: "set null" }),
    priceCentsPerNight: integer("price_cents_per_night").notNull(),
    minNights: integer("min_nights").notNull().default(1),
    validFrom: date("valid_from"),
    validUntil: date("valid_until"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    categoryIdx: index("tariffs_category_idx").on(t.category),
    activeIdx: index("tariffs_active_idx").on(t.active),
  })
);

// =============================================================
// EXTRAS — buchbare Zusatzleistungen (Holz, Handtuchset, …)
// =============================================================

export const extras = pgTable(
  "extras",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 60 }).notNull().unique(),
    label: varchar("label", { length: 200 }).notNull(),
    description: text("description"),
    unitCents: integer("unit_cents").notNull(),
    unitLabel: varchar("unit_label", { length: 60 }),  // z.B. "pro Bündel", "pro Person"
    perNight: boolean("per_night").notNull().default(false),  // soll pro Nacht abgerechnet werden?
    perPerson: boolean("per_person").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    activeIdx: index("extras_active_idx").on(t.active),
  })
);

// =============================================================
// BOOKING_EXTRAS — eigene Tabelle für Buchungs-Extras (statt nur JSON)
// =============================================================

export const bookingExtras = pgTable(
  "booking_extras",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    extraId: uuid("extra_id").references(() => extras.id, { onDelete: "set null" }),
    label: varchar("label", { length: 200 }).notNull(),  // Snapshot des Labels zur Buchungszeit
    qty: integer("qty").notNull().default(1),
    unitCents: integer("unit_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    bookingIdx: index("booking_extras_booking_idx").on(t.bookingId),
  })
);

// =============================================================
// BLOCKED_DATES — eigene Tabelle für Sperrzeiten (saubere Trennung von Bookings)
// =============================================================

export const blockedDateKindEnum = pgEnum("blocked_date_kind", [
  "wartung",
  "reinigung",
  "veranstaltung",
  "sonstiges",
]);

export const blockedDates = pgTable(
  "blocked_dates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromDate: date("from_date").notNull(),
    toDate: date("to_date").notNull(),
    kind: blockedDateKindEnum("kind").notNull().default("wartung"),
    reason: varchar("reason", { length: 255 }),
    notes: text("notes"),
    createdBy: varchar("created_by", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    fromIdx: index("blocked_dates_from_idx").on(t.fromDate),
    toIdx: index("blocked_dates_to_idx").on(t.toDate),
  })
);

// =============================================================
// HANDOVERS — Schlüssel-/Zustands-Übergabe an An- und Abreise
// =============================================================

export const handovers = pgTable(
  "handovers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    kind: handoverKindEnum("kind").notNull(),
    at: timestamp("at").notNull().defaultNow(),
    by: varchar("by", { length: 255 }),
    notes: text("notes"),
    checklist: jsonb("checklist")
      .$type<Array<{ key: string; label: string; ok: boolean; comment?: string }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    photoUrls: jsonb("photo_urls").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    signatureGuestUrl: text("signature_guest_url"),
    signatureManagerUrl: text("signature_manager_url"),
    guestName: varchar("guest_name", { length: 255 }),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    bookingIdx: index("handovers_booking_idx").on(t.bookingId),
  })
);

// =============================================================
// MEMBERSHIP TIERS — Beitragskategorien für Mitglieder
// =============================================================

export const membershipTiers = pgTable(
  "membership_tiers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 60 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    annualFeeCents: integer("annual_fee_cents").notNull(),
    stripePriceId: text("stripe_price_id"),    // Stripe Price (recurring yearly)
    stripeProductId: text("stripe_product_id"),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    codeIdx: index("membership_tiers_code_idx").on(t.code),
  })
);

// =============================================================
// MAIL TEMPLATES — Versionierte Templates (Editor + Diff)
// =============================================================

export const mailTemplates = pgTable(
  "mail_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: varchar("key", { length: 80 }).notNull().unique(),  // z.B. "booking-confirmed"
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    variables: jsonb("variables")
      .$type<Array<{ name: string; description: string; example?: string }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    activeVersionId: uuid("active_version_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    keyIdx: index("mail_templates_key_idx").on(t.key),
  })
);

export const mailTemplateVersions = pgTable(
  "mail_template_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => mailTemplates.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),         // 1, 2, 3, ...
    subject: text("subject").notNull(),
    bodyMd: text("body_md").notNull(),             // Markdown mit {{variable}} placeholders
    changeNote: text("change_note"),
    createdBy: varchar("created_by", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    templateVersionIdx: uniqueIndex("mail_template_version_uniq").on(t.templateId, t.version),
  })
);

// =============================================================
// DAMAGE_REPORTS — Schadensmeldungen (verknüpft mit Buchung + Kaution)
// =============================================================

export const damageReports = pgTable(
  "damage_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    reportedAt: timestamp("reported_at").notNull().defaultNow(),
    reportedBy: varchar("reported_by", { length: 255 }),
    severity: damageSeverityEnum("severity").notNull().default("klein"),
    status: damageStatusEnum("status").notNull().default("offen"),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    estimatedCostCents: integer("estimated_cost_cents").notNull().default(0),
    actualCostCents: integer("actual_cost_cents").notNull().default(0),
    photoUrls: jsonb("photo_urls").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    deductFromDeposit: boolean("deduct_from_deposit").notNull().default(false),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: varchar("resolved_by", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    bookingIdx: index("damage_reports_booking_idx").on(t.bookingId),
    statusIdx: index("damage_reports_status_idx").on(t.status),
  })
);

// =============================================================
// INVOICES — Rechnungen mit eigener Nummer + Snapshot
// =============================================================

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceNumber: varchar("invoice_number", { length: 30 }).notNull().unique(),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    status: invoiceStatusEnum("status").notNull().default("entwurf"),

    issueDate: date("issue_date"),
    dueDate: date("due_date"),
    paidAt: timestamp("paid_at"),
    sentAt: timestamp("sent_at"),

    // Customer snapshot — Rechnungs-Adresse zum Zeitpunkt der Ausstellung
    customerSnapshot: jsonb("customer_snapshot")
      .$type<{
        name: string;
        company?: string;
        street?: string;
        zip?: string;
        city?: string;
        country?: string;
        email?: string;
      }>()
      .notNull(),

    lineItems: jsonb("line_items")
      .$type<Array<{ label: string; qty: number; unitCents: number; totalCents: number }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),

    subtotalCents: integer("subtotal_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),

    pdfUrl: text("pdf_url"),
    notes: text("notes"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    bookingIdx: index("invoices_booking_idx").on(t.bookingId),
    customerIdx: index("invoices_customer_idx").on(t.customerId),
    statusIdx: index("invoices_status_idx").on(t.status),
  })
);

// =============================================================
// INQUIRIES — Anfragen, die noch nicht zu einer Buchung wurden
// =============================================================

export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    inquiryNumber: varchar("inquiry_number", { length: 20 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 60 }),
    organization: varchar("organization", { length: 255 }),
    arrival: date("arrival"),
    departure: date("departure"),
    persons: integer("persons"),
    purpose: varchar("purpose", { length: 255 }),
    message: text("message"),
    status: inquiryStatusEnum("status").notNull().default("new"),
    convertedToBookingId: uuid("converted_to_booking_id").references(() => bookings.id, {
      onDelete: "set null",
    }),
    repliedAt: timestamp("replied_at"),
    repliedBy: varchar("replied_by", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("inquiries_status_idx").on(t.status),
    emailIdx: index("inquiries_email_idx").on(t.email),
  })
);

// =============================================================
// NOTES — generische Notizen, an Buchung/Customer/Anfrage hängbar
// =============================================================

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scope: noteScopeEnum("scope").notNull(),
    refId: uuid("ref_id").notNull(),       // bookingId / customerId / inquiryId
    body: text("body").notNull(),
    pinned: boolean("pinned").notNull().default(false),
    internal: boolean("internal").notNull().default(true),  // false = sichtbar für Kunde
    by: varchar("by", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    scopeRefIdx: index("notes_scope_ref_idx").on(t.scope, t.refId),
  })
);

// =============================================================
// MAGIC LINK TOKENS — passwordless Login per Email
// =============================================================

export const magicLinkTokens = pgTable(
  "magic_link_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    requestIp: varchar("request_ip", { length: 45 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index("magic_link_email_idx").on(t.email),
    expiresIdx: index("magic_link_expires_idx").on(t.expiresAt),
  })
);

// =============================================================
// DISCOUNT CODES — Loyalty-Rabatte + Manager-Codes
// =============================================================

export const discountKindEnum = pgEnum("discount_kind", ["loyalty", "manager", "promo"]);

export const discountCodes = pgTable(
  "discount_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 30 }).notNull().unique(),
    kind: discountKindEnum("kind").notNull().default("manager"),
    percentOff: integer("percent_off").notNull().default(0), // 0–100
    fixedOffCents: integer("fixed_off_cents").notNull().default(0),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    issuedReason: varchar("issued_reason", { length: 255 }),
    minSubtotalCents: integer("min_subtotal_cents").notNull().default(0),
    validFrom: date("valid_from"),
    validUntil: date("valid_until"),
    maxRedemptions: integer("max_redemptions").notNull().default(1),
    redemptions: integer("redemptions").notNull().default(0),
    redeemedBookingId: uuid("redeemed_booking_id").references(() => bookings.id, {
      onDelete: "set null",
    }),
    redeemedAt: timestamp("redeemed_at"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    codeIdx: index("discount_codes_code_idx").on(t.code),
    customerIdx: index("discount_codes_customer_idx").on(t.customerId),
  })
);

// =============================================================
// PERMISSIONS — granulare Rollen-Capabilities
// =============================================================

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    role: userRoleEnum("role").notNull(),
    capability: varchar("capability", { length: 80 }).notNull(),  // z.B. "bookings.refund", "users.create"
    description: varchar("description", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("permissions_role_cap_uniq").on(t.role, t.capability),
  })
);

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
  bookingExtras: many(bookingExtras),
  handovers: many(handovers),
  damageReports: many(damageReports),
  invoices: many(invoices),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
}));

export const seasonsRelations = relations(seasons, ({ many }) => ({
  tariffs: many(tariffs),
}));

export const tariffsRelations = relations(tariffs, ({ one }) => ({
  season: one(seasons, { fields: [tariffs.seasonId], references: [seasons.id] }),
}));

export const bookingExtrasRelations = relations(bookingExtras, ({ one }) => ({
  booking: one(bookings, { fields: [bookingExtras.bookingId], references: [bookings.id] }),
  extra: one(extras, { fields: [bookingExtras.extraId], references: [extras.id] }),
}));

export const handoversRelations = relations(handovers, ({ one }) => ({
  booking: one(bookings, { fields: [handovers.bookingId], references: [bookings.id] }),
}));

export const damageReportsRelations = relations(damageReports, ({ one }) => ({
  booking: one(bookings, { fields: [damageReports.bookingId], references: [bookings.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  booking: one(bookings, { fields: [invoices.bookingId], references: [bookings.id] }),
  customer: one(customers, { fields: [invoices.customerId], references: [customers.id] }),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  convertedBooking: one(bookings, {
    fields: [inquiries.convertedToBookingId],
    references: [bookings.id],
  }),
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
export type Season = typeof seasons.$inferSelect;
export type NewSeason = typeof seasons.$inferInsert;
export type Tariff = typeof tariffs.$inferSelect;
export type NewTariff = typeof tariffs.$inferInsert;
export type Extra = typeof extras.$inferSelect;
export type NewExtra = typeof extras.$inferInsert;
export type BookingExtra = typeof bookingExtras.$inferSelect;
export type NewBookingExtra = typeof bookingExtras.$inferInsert;
export type BlockedDate = typeof blockedDates.$inferSelect;
export type NewBlockedDate = typeof blockedDates.$inferInsert;
export type Handover = typeof handovers.$inferSelect;
export type NewHandover = typeof handovers.$inferInsert;
export type DamageReport = typeof damageReports.$inferSelect;
export type NewDamageReport = typeof damageReports.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type Inquiry = typeof inquiries.$inferSelect;
export type NewInquiry = typeof inquiries.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
export type NewMagicLinkToken = typeof magicLinkTokens.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type NewDiscountCode = typeof discountCodes.$inferInsert;
export type MailTemplate = typeof mailTemplates.$inferSelect;
export type NewMailTemplate = typeof mailTemplates.$inferInsert;
export type MembershipTier = typeof membershipTiers.$inferSelect;
export type NewMembershipTier = typeof membershipTiers.$inferInsert;
export type MailTemplateVersion = typeof mailTemplateVersions.$inferSelect;
export type NewMailTemplateVersion = typeof mailTemplateVersions.$inferInsert;
