import {
  pgTable,
  text,
  integer,
  real,
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
  "kurtaxe",
  "rueckerstattung",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "offen",
  "erhalten",
  "fehlgeschlagen",
  "erstattet",
]);

export const userRoleEnum = pgEnum("user_role", ["customer", "member", "manager", "admin"]);

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

    // Geburtstagsmail + persönliche Daten
    birthDate: date("birth_date"),
    // Bulk-Mail Opt-Out: wenn true, schickt unser Bulk-Mailer KEINE Newsletter mehr
    // (transaktionale Mails wie Buchungsbestätigung bleiben unberührt)
    emailOptOut: boolean("email_opt_out").notNull().default(false),
    // Sprach-Präferenz für Mails + Public-Pages (de | en | nl)
    preferredLanguage: varchar("preferred_language", { length: 5 }).notNull().default("de"),

    // DSGVO: anonymisiert nach Konto-Loeschung. Buchungen+Rechnungen bleiben erhalten
    // (10 Jahre handelsrechtliche Aufbewahrungspflicht), aber PII wird ueberschrieben.
    anonymizedAt: timestamp("anonymized_at"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index("customers_email_idx").on(t.email),
    membershipStatusIdx: index("customers_membership_status_idx").on(t.membershipStatus),
    birthDateIdx: index("customers_birth_date_idx").on(t.birthDate),
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

    purpose: varchar("purpose", { length: 500 }),
    // Institution / Einrichtung (Schule, Verein, Firma) — Pflicht bei den
    // Anlaessen klasse/schul/verein/firma. Wird zusaetzlich in customer.company
    // gespiegelt, damit Rechnung/Mietvertrag die Organisation zeigen.
    institution: varchar("institution", { length: 255 }),
    // Zahlungsmodus:
    //  - "standard"        → 50 % Anzahlung + Kaution sofort beim Buchen (Stripe).
    //  - "school_deferred" → Schulgruppen (Klassenfahrt / Schul-/Studienfahrt):
    //    KEIN Sofort-Checkout. Anzahlung wird per Cron 30 Tage vor Anreise
    //    faellig (Zahlungslink-Mail), Warnungen bei T-23/T-18, Auto-Storno bei
    //    T-16 wenn unbezahlt. Nach Zahlung laeuft die normale Restzahlungs-
    //    Pipeline (T-14 Off-Session) wie gehabt.
    paymentMode: varchar("payment_mode", { length: 20 }).notNull().default("standard"),
    // Vorstands-Pruefung vor Stripe-Checkout (Phase B). Greift, wenn der
    // Gast als Anlass "Private Feier" gewaehlt hat. Stripe-Session wird
    // dann erst nach Freigabe erzeugt.
    requiresReview: boolean("requires_review").notNull().default(false),
    reviewStatus: varchar("review_status", { length: 20 }), // 'pending' | 'approved' | 'rejected' (null = n/a)
    reviewDecidedAt: timestamp("review_decided_at"),
    reviewDecidedBy: varchar("review_decided_by", { length: 255 }),
    persons: integer("persons").notNull(),                  // Summe (cached)

    // Pricing snapshot (in cents — alles als integer cents speichern, GoBD-sicher)
    accommodationCents: integer("accommodation_cents").notNull().default(0),
    kurtaxeCents: integer("kurtaxe_cents").notNull().default(0),
    energyFlatCents: integer("energy_flat_cents").notNull().default(0),
    cleaningCents: integer("cleaning_cents").notNull().default(0),
    soloSurchargeCents: integer("solo_surcharge_cents").notNull().default(0),
    // Aufschlag bei Unterschreitung der 15-Personen-Mindestbelegung
    // (pro-rata zum tatsächlichen Personen-Mix). Persons-Spalten oben
    // bleiben dabei UNVERÄNDERT — wichtig fürs Kurkarten-Reporting.
    minOccupancySurchargeCents: integer("min_occupancy_surcharge_cents").notNull().default(0),
    extrasCents: integer("extras_cents").notNull().default(0),
    discountCents: integer("discount_cents").notNull().default(0), // eingeloester Rabatt
    discountCode: varchar("discount_code", { length: 30 }),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    depositCents: integer("deposit_cents").notNull().default(0),  // Kaution (separat)
    totalCents: integer("total_cents").notNull().default(0),      // ohne Kaution
    paidCents: integer("paid_cents").notNull().default(0),

    // Alt-Vertrag mit fest vereinbarten Preisen (i. d. R. Papier-Mietvertrag vor der
    // Portal-Umstellung, erkennbar an 100 € pauschaler Anzahlung). Ist auch nur EINER
    // dieser vier Werte gesetzt, gelten sie fest fuer die Uebernachtung dieser Buchung
    // — resolveTariffs() (aktuelle/saisonale Saetze) wird dann ignoriert, auch wenn
    // spaeter noch Personen korrigiert werden (Vorstandswunsch 23.07.2026).
    legacyNichtmitgliedCents: integer("legacy_nichtmitglied_cents"),
    legacyMitgliedCents: integer("legacy_mitglied_cents"),
    legacyKindCents: integer("legacy_kind_cents"),
    legacySchuelerCents: integer("legacy_schueler_cents"),

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

    // Von Dana hochgeladene AVS-Kurkarten-Sammel-PDF (nach Gruppenregistrierung
    // im AVS-Portal erzeugt). Wird der Huettenwart-T-7-Mail an Toni automatisch
    // als Anhang beigefuegt, damit er sie vor Anreise ausdrucken kann.
    kurkartenPdfUrl: text("kurkarten_pdf_url"),

    // Namen aus der Kurkarten-PDF extrahiert (Vorschlag, von Dana vor der
    // PDF-Erzeugung noch korrigierbar) und die daraus generierte, auf Namen
    // reduzierte Feuerwehr-Meldeliste (kein Preis/QR). Wird T-7 an Toni UND
    // den Gast mitgeschickt.
    feuerwehrNames: jsonb("feuerwehr_names").$type<string[]>(),
    feuerwehrListePdfUrl: text("feuerwehr_liste_pdf_url"),

    internalNotes: text("internal_notes"),
    customerMessage: text("customer_message"),

    // Hausordnungs-Akzept (versioniert für rechtliche Nachvollziehbarkeit)
    acceptedHausordnungVersion: varchar("accepted_hausordnung_version", { length: 20 }),
    acceptedHausordnungAt: timestamp("accepted_hausordnung_at"),

    // Geschenk-Gutschein-Einlösung (separate von discount_codes)
    voucherId: uuid("voucher_id"),
    voucherDiscountCents: integer("voucher_discount_cents").notNull().default(0),

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
  // "sent"/"failed" — Ergebnis der SMTP-UEBERGABE an Brevo, NICHT ob die Mail
  // beim Empfaenger ankam. Siehe deliveryStatus fuer den echten Zustellstatus.
  status: varchar("status", { length: 30 }).notNull().default("sent"),
  error: text("error"),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  // Nodemailer-Message-ID — Bruecke zum Brevo-Zustell-Webhook (matched dort
  // per message-id im Event-Payload).
  messageId: text("message_id"),
  // Echter Zustellstatus von Brevo, asynchron per Webhook nachgetragen:
  // "delivered" | "bounced" | "blocked" | "spam" | null (noch kein Event).
  deliveryStatus: varchar("delivery_status", { length: 20 }),
  deliveryStatusAt: timestamp("delivery_status_at"),
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
// FEEDBACK — Strukturiertes Gäste-Feedback nach dem Aufenthalt
// (intern, NICHT öffentlich; Token-Mail-Workflow + Manager-Analytics)
// =============================================================

export const feedbackEntries = pgTable(
  "feedback_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    // Status-Zeitstempel
    sentAt: timestamp("sent_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
    respondedAt: timestamp("responded_at"),
    // Ratings 1-5 (null bis Antwort kommt)
    overallRating: integer("overall_rating"),
    cleanlinessRating: integer("cleanliness_rating"),
    comfortRating: integer("comfort_rating"),
    locationRating: integer("location_rating"),
    communicationRating: integer("communication_rating"),
    pricePerformanceRating: integer("price_performance_rating"),
    // NPS-artige Frage
    wouldRecommend: boolean("would_recommend"),
    // Freitext-Felder
    highlightText: text("highlight_text"), // "Was hat dir am besten gefallen?"
    improvementText: text("improvement_text"), // "Was könnte besser sein?"
    surpriseText: text("surprise_text"), // "Hat dich was überrascht?"
    // Quote-Permission für interne Nutzung (z.B. Vereins-Berichte)
    allowQuoteInternally: boolean("allow_quote_internally").notNull().default(false),
    // Optionale Verfasser-Info (vom Buchungs-Customer abweichend möglich)
    respondentName: varchar("respondent_name", { length: 120 }),
  },
  (t) => ({
    bookingIdx: index("feedback_entries_booking_idx").on(t.bookingId),
    respondedIdx: index("feedback_entries_responded_idx").on(t.respondedAt),
  })
);

// =============================================================
// COMMUNITY — Schulprojekt-Anekdoten (User-Generated, moderiert)
// (Ehem. auch Gäste-Buch; ersetzt durch feedback_entries oben.)
// =============================================================

export const communityEntries = pgTable(
  "community_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: varchar("kind", { length: 20 }).notNull(), // "guestbook" | "schulprojekt"
    authorName: varchar("author_name", { length: 120 }).notNull(),
    authorContext: varchar("author_context", { length: 200 }), // z.B. "Klasse 9b, ESG" oder "Familie aus Bielefeld"
    authorEmail: varchar("author_email", { length: 255 }), // intern, nicht öffentlich
    title: varchar("title", { length: 200 }),
    body: text("body").notNull(),
    photoUrls: jsonb("photo_urls").$type<string[]>().notNull().default([]),
    visitDate: date("visit_date"), // wann der Aufenthalt/das Projekt war
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    submittedIp: varchar("submitted_ip", { length: 64 }),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | approved | rejected
    moderatedBy: varchar("moderated_by", { length: 255 }),
    moderatedAt: timestamp("moderated_at"),
    moderationNote: text("moderation_note"),
  },
  (t) => ({
    kindStatusIdx: index("community_entries_kind_status_idx").on(t.kind, t.status),
    submittedAtIdx: index("community_entries_submitted_at_idx").on(t.submittedAt),
  })
);

// =============================================================
// WANDERTOUREN — Kuratierte Routen rund um Langewiese mit GPX
// =============================================================

export const hikingRoutes = pgTable(
  "hiking_routes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),
    summary: varchar("summary", { length: 500 }), // 1-2 Zeilen Teaser
    description: text("description"), // Markdown / Multi-Absatz
    difficulty: varchar("difficulty", { length: 20 }).notNull(), // leicht | mittel | schwer
    distanceKm: real("distance_km"),
    elevationGainM: integer("elevation_gain_m"),
    durationMinutes: integer("duration_minutes"),
    startLat: real("start_lat"),
    startLng: real("start_lng"),
    gpxUrl: text("gpx_url"), // Vercel Blob URL
    coverImageUrl: text("cover_image_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("hiking_routes_slug_uniq").on(t.slug),
  })
);

// =============================================================
// GESCHENK-GUTSCHEINE — bezahlte Gift-Cards (separat von discount_codes)
// =============================================================

export const vouchers = pgTable(
  "vouchers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 24 }).notNull().unique(), // WH-GIFT-XXXX-YYYY
    valueCents: integer("value_cents").notNull(),
    redeemedCents: integer("redeemed_cents").notNull().default(0),
    // Käufer
    purchaserName: varchar("purchaser_name", { length: 200 }).notNull(),
    purchaserEmail: varchar("purchaser_email", { length: 255 }).notNull(),
    // Empfänger (kann gleich Käufer sein)
    recipientName: varchar("recipient_name", { length: 200 }),
    recipientEmail: varchar("recipient_email", { length: 255 }),
    personalMessage: text("personal_message"),
    deliveryMode: varchar("delivery_mode", { length: 20 }).notNull().default("email"), // email | print
    // Stripe payment
    stripeSessionId: text("stripe_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    paidAt: timestamp("paid_at"),
    // Lifecycle
    expiresAt: timestamp("expires_at"), // typisch 3 Jahre nach Kauf
    firstRedeemedAt: timestamp("first_redeemed_at"),
    fullyRedeemed: boolean("fully_redeemed").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    codeIdx: uniqueIndex("vouchers_code_uniq").on(t.code),
    recipientIdx: index("vouchers_recipient_email_idx").on(t.recipientEmail),
    purchaserIdx: index("vouchers_purchaser_email_idx").on(t.purchaserEmail),
  })
);

// =============================================================
// SPENDEN (z. B. Zeltpodest) — reine Aufzeichnung fuer Dankes-Mail/
// Zuwendungsnachweis; die eigentliche Zahlungsabwicklung/Buchhaltung
// bleibt bei Stripe (siehe huette/spenden-actions.ts).
// =============================================================

export const donations = pgTable("donations", {
  id: uuid("id").primaryKey().defaultRandom(),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  donorName: varchar("donor_name", { length: 255 }).notNull(),
  donorEmail: varchar("donor_email", { length: 255 }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  purpose: varchar("purpose", { length: 60 }).notNull().default("zeltpodest"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// =============================================================
// WARTUNGS-TICKETS — Hüttenwart-Mängelliste
// =============================================================

export const maintenanceTickets = pgTable(
  "maintenance_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    location: varchar("location", { length: 200 }), // z.B. "Bad EG", "Küche", "Außen"
    severity: varchar("severity", { length: 20 }).notNull().default("medium"), // low | medium | high | urgent
    status: varchar("status", { length: 20 }).notNull().default("open"), // open | in_progress | resolved
    photoUrls: jsonb("photo_urls").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    createdBy: varchar("created_by", { length: 255 }),
    assignedTo: varchar("assigned_to", { length: 255 }),
    resolvedAt: timestamp("resolved_at"),
    resolutionNote: text("resolution_note"),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("maintenance_tickets_status_idx").on(t.status),
    severityIdx: index("maintenance_tickets_severity_idx").on(t.severity),
    createdAtIdx: index("maintenance_tickets_created_at_idx").on(t.createdAt),
  })
);

// =============================================================
// BULK-MAIL — Kampagnen + per-Empfänger Sendings (Opt-Out-tauglich)
// =============================================================

export const bulkMailCampaigns = pgTable("bulk_mail_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: varchar("subject", { length: 200 }).notNull(),
  body: text("body").notNull(), // Markdown
  audience: varchar("audience", { length: 40 }).notNull(), // all_customers | verified_members | recent_guests | upcoming_guests
  audienceFilter: jsonb("audience_filter"), // optional saved JSON filter
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft | sending | sent | cancelled
  totalRecipients: integer("total_recipients").notNull().default(0),
  totalSent: integer("total_sent").notNull().default(0),
  totalFailed: integer("total_failed").notNull().default(0),
  totalOptedOut: integer("total_opted_out").notNull().default(0),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bulkMailSends = pgTable(
  "bulk_mail_sends",
  {
    id: serial("id").primaryKey(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => bulkMailCampaigns.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    email: varchar("email", { length: 255 }).notNull(),
    status: varchar("status", { length: 20 }).notNull(), // sent | failed | opted_out
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at").notNull().defaultNow(),
  },
  (t) => ({
    campaignIdx: index("bulk_mail_sends_campaign_idx").on(t.campaignId),
  })
);

// =============================================================
// REGIONALE EMPFEHLUNGEN — Post-Checkout "Was kannst Du hier machen?"
// =============================================================

export const regionalRecommendations = pgTable(
  "regional_recommendations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    category: varchar("category", { length: 40 }).notNull(),
    // category-Vokabular: restaurant | einkauf | aktivitaet | sehenswuerdigkeit | notdienst | verleih
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    address: varchar("address", { length: 500 }),
    websiteUrl: text("website_url"),
    phone: varchar("phone", { length: 60 }),
    openingHours: varchar("opening_hours", { length: 500 }),
    distanceFromHuetteKm: real("distance_from_huette_km"),
    lat: real("lat"),
    lng: real("lng"),
    imageUrl: text("image_url"),
    seasonalOnly: varchar("seasonal_only", { length: 40 }), // null | winter | sommer
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    categoryIdx: index("regional_recommendations_category_idx").on(t.category),
    activeIdx: index("regional_recommendations_active_idx").on(t.active),
  })
);

// =============================================================
// SECURITY — Stripe-Webhook-Idempotency, Login-Throttle, Booking-Throttle
// =============================================================

/**
 * Dedupe für Stripe-Webhook-Events: bei Retries derselbe `event.id` wird
 * geblockt durch PRIMARY KEY → INSERT scheitert → wir antworten 200 deduped.
 * status ermöglicht spätere Retry-after-failure-Semantik (bisher nur "processed").
 */
export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
  eventId: text("event_id").primaryKey(),
  eventType: text("event_type").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("processed"),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
});

/**
 * Login-Throttle: pro (email,ip) zählen wir Fehlversuche in den letzten 15 min.
 * Bei > 10 Failures wird Login-Endpoint blockiert.
 * Auch erfolgreiche Logins werden geloggt für Audit-Trail.
 */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    ip: varchar("ip", { length: 64 }),
    kind: varchar("kind", { length: 20 }).notNull(), // "password" | "totp" | "magic"
    success: boolean("success").notNull(),
    at: timestamp("at").notNull().defaultNow(),
  },
  (t) => ({
    emailAtIdx: index("login_attempts_email_at_idx").on(t.email, t.at),
    ipAtIdx: index("login_attempts_ip_at_idx").on(t.ip, t.at),
  })
);

/**
 * Booking-Spam-Throttle: pro (email,ip) max 5 Booking-Versuche pro Stunde.
 */
export const bookingAttempts = pgTable(
  "booking_attempts",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }),
    ip: varchar("ip", { length: 64 }),
    at: timestamp("at").notNull().defaultNow(),
  },
  (t) => ({
    emailAtIdx: index("booking_attempts_email_at_idx").on(t.email, t.at),
    ipAtIdx: index("booking_attempts_ip_at_idx").on(t.ip, t.at),
  })
);

// =============================================================
// EXTERNAL REVIEWS — Bewertungen aus Drittquellen (Google, Plattformen)
// kuratiert ueber Manager-Backend. Anzeige im Trust-Badge auf der Landing-Page.
// =============================================================

export const externalReviewSourceEnum = pgEnum("external_review_source", [
  "google",
  "gruppenhaus",
  "gruppenunterkuenfte",
  "manual",
]);

export const externalReviews = pgTable(
  "external_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: externalReviewSourceEnum("source").notNull(),
    authorName: varchar("author_name", { length: 200 }).notNull(),
    rating: integer("rating"), // 1-5; null = keine Sterne (z.B. Text-only Plattformen)
    text: text("text"),
    // Approximatives Review-Datum (bei Google nur als "vor X Jahren" gegeben → wir
    // schaetzen ab Zeitpunkt der Aufnahme rueckwaerts).
    reviewedAt: date("reviewed_at"),
    // Original-Relative-Time-Text fuer Audit ("vor 5 Monaten")
    relativeTime: varchar("relative_time", { length: 60 }),
    // Quellen-Referenz (URL oder stabile Hash-ID); Eindeutigkeits-Constraint je
    // (source, source_ref), damit Re-Imports keine Duplikate erzeugen.
    sourceRef: varchar("source_ref", { length: 255 }),
    sourceUrl: text("source_url"),
    // Original-Sprache des Reviews (falls von Google uebersetzt: hier die original-locale)
    originalLanguage: varchar("original_language", { length: 5 }),
    translated: boolean("translated").notNull().default(false),
    // Manager-Kontrolle: nur published=true scheinen auf der Landing-Page auf.
    published: boolean("published").notNull().default(true),
    // Highlight: explizit fuer den Trust-Badge-Carousel ausgewaehlt.
    highlight: boolean("highlight").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    sourceRefIdx: uniqueIndex("ext_reviews_source_ref_idx").on(t.source, t.sourceRef),
    publishedIdx: index("ext_reviews_published_idx").on(t.published),
    sourceIdx: index("ext_reviews_source_idx").on(t.source),
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
export type ExternalReview = typeof externalReviews.$inferSelect;
export type NewExternalReview = typeof externalReviews.$inferInsert;
