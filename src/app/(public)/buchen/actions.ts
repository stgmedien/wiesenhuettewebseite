"use server";

import { z } from "zod";
import { eq, and, gt } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { BOOKING_BLOCKS_TAG } from "@/lib/availability";
import { db } from "@/lib/db";
import { bookings, customers, payments, activityLog, users, bookingAttempts } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { createMagicLinkToken } from "@/lib/magic-link";
import { sendMail } from "@/lib/mail/send";
import WelcomeEmail from "@/lib/mail/templates/welcome";
import ReviewPendingGuestEmail from "@/lib/mail/templates/review-pending-guest";
import ReviewPendingInternalEmail from "@/lib/mail/templates/review-pending-internal";
import { isSchoolDeferredPurpose } from "@/lib/school-deposit";
import {
  validateDiscountCode,
  calculateDiscountCents,
  markDiscountRedeemed,
  previewDiscount,
} from "@/lib/discount";
import { resolveTariffs } from "@/lib/pricing-tariffs";
import {
  calculatePrice,
  validateBookingInput,
  formatEuro,
  type Persons,
} from "@/lib/pricing";
import { isRangeAvailable } from "@/lib/availability";
import { stripe } from "@/lib/stripe";
import { generateBookingNumber, formatDateLong, daysUntilLocalDate } from "@/lib/utils";
import { CURRENT_HAUSORDNUNG_VERSION } from "@/lib/hausordnung";
import type { Locale } from "@/lib/i18n-shared";

const STRIPE_LOCALE: Record<Locale, "de" | "en" | "nl"> = {
  de: "de",
  en: "en",
  nl: "nl",
};

const CHECKOUT_LINES: Record<Locale, {
  depositName: (arrival: string, departure: string) => string;
  depositDescription: (
    persons: number,
    nights: number,
    bookingNumber: string,
    discount: string | null,
    remainder: string
  ) => string;
  // Komplettzahlung (Anreise < 14 Tage): gesamter Mietpreis sofort.
  fullName: (arrival: string, departure: string) => string;
  fullDescription: (
    persons: number,
    nights: number,
    bookingNumber: string,
    discount: string | null
  ) => string;
  kautionName: string;
  kautionDescription: string;
}> = {
  de: {
    depositName: (a, d) => `Anzahlung 50 % — Wiesenhütte ${a} bis ${d}`,
    depositDescription: (p, n, bn, disc, rem) =>
      `${p} Personen · ${n} Nächte · Buchung ${bn}${disc ? ` · Rabatt ${disc}` : ""} · Restzahlung ${rem} folgt 14 Tage vor Anreise.`,
    fullName: (a, d) => `Gesamtbetrag — Wiesenhütte ${a} bis ${d}`,
    fullDescription: (p, n, bn, disc) =>
      `${p} Personen · ${n} Nächte · Buchung ${bn}${disc ? ` · Rabatt ${disc}` : ""} · Komplettzahlung, da Anreise in weniger als 14 Tagen.`,
    kautionName: "Kaution",
    kautionDescription: "Erstattung innerhalb 14 Tagen nach mangelfreier Abreise.",
  },
  en: {
    depositName: (a, d) => `Deposit 50 % — Wiesenhütte ${a} to ${d}`,
    depositDescription: (p, n, bn, disc, rem) =>
      `${p} guests · ${n} nights · Booking ${bn}${disc ? ` · Discount ${disc}` : ""} · Remaining ${rem} due 14 days before arrival.`,
    fullName: (a, d) => `Full amount — Wiesenhütte ${a} to ${d}`,
    fullDescription: (p, n, bn, disc) =>
      `${p} guests · ${n} nights · Booking ${bn}${disc ? ` · Discount ${disc}` : ""} · Paid in full because arrival is less than 14 days away.`,
    kautionName: "Damage deposit",
    kautionDescription: "Refunded within 14 days of a clean departure.",
  },
  nl: {
    depositName: (a, d) => `Aanbetaling 50 % — Wiesenhütte ${a} t/m ${d}`,
    depositDescription: (p, n, bn, disc, rem) =>
      `${p} personen · ${n} nachten · Boeking ${bn}${disc ? ` · Korting ${disc}` : ""} · Restbedrag ${rem} 14 dagen vóór aankomst.`,
    fullName: (a, d) => `Totaalbedrag — Wiesenhütte ${a} t/m ${d}`,
    fullDescription: (p, n, bn, disc) =>
      `${p} personen · ${n} nachten · Boeking ${bn}${disc ? ` · Korting ${disc}` : ""} · Volledige betaling, want aankomst is binnen 14 dagen.`,
    kautionName: "Borg",
    kautionDescription: "Terugbetaling binnen 14 dagen na schadevrije afreis.",
  },
};

const ACTION_ERRORS: Record<Locale, {
  invalidInput: string;
  tooManyAttempts: string;
  memberLocked: string;
  memberLockedField: string;
  rangeUnavailable: string;
  rangeBlocked: string;
  voucherPrefix: string;
  discountPrefix: string;
  stripeFailed: (msg: string) => string;
  stripeUnknown: string;
  checkoutUrlMissing: string;
}> = {
  de: {
    invalidInput: "Ungültige Eingaben.",
    tooManyAttempts: "Zu viele Buchungs-Versuche von dieser Email-Adresse in kurzer Zeit. Bitte versuche es in einer Stunde erneut oder kontaktiere uns direkt.",
    memberLocked: "Der Mitglieds-Tarif ist nur für verifizierte Vereinsmitglieder buchbar. Bitte logge Dich ein und beantrage die Mitgliedschaft im Konto-Profil.",
    memberLockedField: "Mitglieds-Tarif gesperrt",
    rangeUnavailable: "Dieser Zeitraum ist leider nicht mehr verfügbar.",
    rangeBlocked: "Zeitraum belegt",
    voucherPrefix: "Gutschein",
    discountPrefix: "Rabatt-Code",
    stripeFailed: (msg) => `Zahlung konnte nicht initialisiert werden: ${msg}`,
    stripeUnknown: "unbekannter Stripe-Fehler",
    checkoutUrlMissing: "Stripe-Checkout konnte nicht erstellt werden.",
  },
  en: {
    invalidInput: "Invalid input.",
    tooManyAttempts: "Too many booking attempts from this email address recently. Please try again in an hour or contact us directly.",
    memberLocked: "The member rate is only bookable for verified club members. Please log in and apply for membership in your account profile.",
    memberLockedField: "Member rate locked",
    rangeUnavailable: "Sorry, this range is no longer available.",
    rangeBlocked: "Range booked",
    voucherPrefix: "Voucher",
    discountPrefix: "Discount code",
    stripeFailed: (msg) => `Payment could not be initialised: ${msg}`,
    stripeUnknown: "unknown Stripe error",
    checkoutUrlMissing: "Stripe checkout could not be created.",
  },
  nl: {
    invalidInput: "Ongeldige invoer.",
    tooManyAttempts: "Te veel boekingspogingen vanaf dit e-mailadres in korte tijd. Probeer het over een uur opnieuw of neem direct contact op.",
    memberLocked: "Het ledentarief is alleen beschikbaar voor geverifieerde verenigingsleden. Log in en vraag lidmaatschap aan in je accountprofiel.",
    memberLockedField: "Ledentarief geblokkeerd",
    rangeUnavailable: "Deze periode is helaas niet meer beschikbaar.",
    rangeBlocked: "Periode geboekt",
    voucherPrefix: "Cadeaubon",
    discountPrefix: "Kortingscode",
    stripeFailed: (msg) => `Betaling kon niet worden gestart: ${msg}`,
    stripeUnknown: "onbekende Stripe-fout",
    checkoutUrlMissing: "Stripe-checkout kon niet worden aangemaakt.",
  },
};

const personsSchema = z.object({
  adults: z.coerce.number().int().min(0),
  members: z.coerce.number().int().min(0),
  children: z.coerce.number().int().min(0),
  pupils: z.coerce.number().int().min(0),
  teachers: z.coerce.number().int().min(0),
});

const inputSchema = z.object({
  arrival: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departure: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  persons: personsSchema,
  soloUse: z.boolean().default(false),
  customerType: z.enum(["privat", "mitglied", "verein", "firma"]).default("privat"),
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  email: z.string().email().max(255),
  // Phase A: Telefonnummer ist jetzt Pflicht (Frontend min 5 Zeichen).
  phone: z.string().min(5).max(60),
  company: z.string().max(255).optional().nullable(),
  // Institution / Einrichtung (Schule, Verein, Firma). Frontend macht es bei
  // den Anlaessen klasse/schul/verein/firma zur Pflicht.
  institution: z.string().max(255).optional().nullable(),
  street: z.string().max(255).optional().nullable(),
  zip: z.string().max(20).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  // Phase A: Anlass ist jetzt Pflicht. Wird vom Frontend als zusammengesetzter
  // String geliefert ("Gruppen-Aufenthalt" / "Private Feier — JGA — Grund: ...").
  purpose: z.string().min(1).max(500),
  // Phase B: maschinenlesbare Anlass-Kategorie (optional fuer Abwaerts-Kompat).
  // Bei "privat" wird der Stripe-Checkout uebersprungen und die Buchung in den
  // Vorstands-Review-Flow geschickt.
  purposeCategory: z
    .enum(["familie", "klasse", "schul", "verein", "firma", "privat", "sonstiges"])
    .optional(),
  purposeSubtypeLabel: z.string().max(120).optional().nullable(),
  purposeReason: z.string().max(2000).optional().nullable(),
  customerMessage: z.string().max(2000).optional().nullable(),
  discountCode: z.string().max(30).optional().nullable(),
  acceptedTerms: z.literal(true),
  locale: z.enum(["de", "en", "nl"]).default("de"),
});

export type BookingInput = z.infer<typeof inputSchema>;

export type ActionResult =
  | { ok: true; checkoutUrl: string; bookingNumber: string }
  | { ok: true; requiresReview: true; bookingNumber: string } // Phase B: Private Feier → Vorstands-Prüfung
  | { ok: true; schoolDeferred: true; bookingNumber: string } // Schulgruppe → Anzahlung erst 30 Tage vor Anreise
  | { ok: false; error: string; issues?: { field: string; message: string }[] };

const BOOKING_RATE_WINDOW_MS = 60 * 60_000; // 1 Stunde
const BOOKING_MAX_PER_WINDOW = 5;

export async function createBookingAndCheckout(raw: unknown): Promise<ActionResult> {
  // Erste Locale-Extraktion bevor Schema-Validierung — fuer korrekte Fehlertexte
  // selbst wenn der Rest des Inputs ungueltig ist.
  const rawLocale = (raw as { locale?: string } | null)?.locale;
  const earlyLocale: Locale =
    rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const E = ACTION_ERRORS[earlyLocale];

  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: E.invalidInput,
      issues: parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    };
  }
  const data = parsed.data;
  const persons: Persons = { ...data.persons };
  const locale: Locale = data.locale;
  const T = ACTION_ERRORS[locale];

  // -----------------------------------------------------------------
  // Spam-Schutz: max 5 Buchungs-Versuche pro (Email, IP) pro Stunde.
  // Verhindert Mass-Booking-Spam und Fake-Checkout-Link-Generierung.
  // -----------------------------------------------------------------
  const lowerEmail = data.email.toLowerCase().trim();
  const reqHeaders = await headers();
  const ip =
    reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    reqHeaders.get("x-real-ip") ||
    null;
  const since = new Date(Date.now() - BOOKING_RATE_WINDOW_MS);
  const recentAttempts = await db
    .select({ id: bookingAttempts.id })
    .from(bookingAttempts)
    .where(
      and(eq(bookingAttempts.email, lowerEmail), gt(bookingAttempts.at, since))
    )
    .limit(BOOKING_MAX_PER_WINDOW + 1);
  if (recentAttempts.length >= BOOKING_MAX_PER_WINDOW) {
    return {
      ok: false,
      error: T.tooManyAttempts,
    };
  }
  // Best-effort log — wenn DB-Insert fehlschlägt, soll Booking trotzdem laufen
  try {
    await db.insert(bookingAttempts).values({ email: lowerEmail, ip });
  } catch (err) {
    console.error("[booking-throttle] log failed:", err);
  }

  // ---------------------------------------------------------------
  // Member-Discount-Gate: nur verifizierte Vereinsmitglieder duerfen
  // die Mitglieds-Tarife (−50 %) buchen.
  // ---------------------------------------------------------------
  const session = await auth();
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
  const sessionEmail = session?.user?.email?.toLowerCase();
  let isVerifiedMember = false;
  if (sessionUserId) {
    const linked = await db
      .select({ status: customers.membershipStatus })
      .from(customers)
      .where(eq(customers.userId, sessionUserId))
      .limit(1);
    isVerifiedMember = linked[0]?.status === "verified";
  }

  if (persons.members > 0 && !isVerifiedMember) {
    return {
      ok: false,
      error: T.memberLocked,
      issues: [
        {
          field: "persons.members",
          message: T.memberLockedField,
        },
      ],
    };
  }

  // Customer-Type analog absichern: "mitglied" nur fuer verifizierte Mitglieder.
  if (data.customerType === "mitglied" && !isVerifiedMember) {
    data.customerType = "privat";
  }

  const issues = validateBookingInput({
    arrival: data.arrival,
    departure: data.departure,
    persons,
    soloUse: data.soloUse,
    locale,
  });
  if (issues.length > 0) {
    return { ok: false, error: issues.map((i) => i.message).join(" "), issues };
  }

  const free = await isRangeAvailable({
    arrival: data.arrival,
    departure: data.departure,
  });
  if (!free) {
    return {
      ok: false,
      error: T.rangeUnavailable,
      issues: [{ field: "dates", message: T.rangeBlocked }],
    };
  }

  // Tarife auflösen (DB-Tarife mit Saison-Resolution, Fallback auf hardcoded)
  const resolvedTariffs = await resolveTariffs(data.arrival);

  const breakdown = calculatePrice({
    arrival: data.arrival,
    departure: data.departure,
    persons,
    soloUse: data.soloUse,
    tariffs: resolvedTariffs,
    locale,
  });

  const totalPersons = breakdown.totalPersons;

  const bookingNumber = generateBookingNumber();

  // Customer-Resolution + Auto-Account-Creation:
  //  - Eingeloggt → benutze den verknuepften Customer-Record (oder lege einen an,
  //    falls der User noch keinen hat).
  //  - Nicht eingeloggt → suche User per Email; wenn keiner existiert, lege
  //    automatisch einen User-Account (rolle=customer, ohne Passwort) + Customer-
  //    Record an. Nach der Buchung schicken wir einen Magic-Link, ueber den der
  //    Kunde sein Konto "uebernehmen" kann.
  let customerId: string;
  let resolvedUserId = sessionUserId;
  let isNewAccount = false;
  const effectiveEmail = sessionEmail ?? data.email.toLowerCase();

  if (sessionUserId) {
    const linked = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, sessionUserId))
      .limit(1);
    if (linked[0]) {
      customerId = linked[0].id;
      // Profil-Felder mit Form-Daten anreichern, falls leer
      const updates: Partial<typeof customers.$inferInsert> = {};
      if (!linked[0].phone && data.phone) updates.phone = data.phone;
      if (!linked[0].street && data.street) updates.street = data.street;
      if (!linked[0].zip && data.zip) updates.zip = data.zip;
      if (!linked[0].city && data.city) updates.city = data.city;
      if (!linked[0].company && data.company) updates.company = data.company;
      if (Object.keys(updates).length > 0) {
        await db.update(customers).set(updates).where(eq(customers.id, customerId));
      }
    } else {
      const inserted = await db
        .insert(customers)
        .values({
          userId: sessionUserId,
          type: data.customerType,
          firstName: data.firstName,
          lastName: data.lastName,
          email: effectiveEmail,
          phone: data.phone ?? null,
          company: data.company ?? null,
          street: data.street ?? null,
          zip: data.zip ?? null,
          city: data.city ?? null,
        })
        .returning({ id: customers.id });
      customerId = inserted[0].id;
    }
  } else {
    // Auto-Account-Creation
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, effectiveEmail))
      .limit(1);

    if (existingUser[0]) {
      // User mit dieser Email existiert schon — Buchung an seinen Customer haengen.
      resolvedUserId = existingUser[0].id;
      const linked = await db
        .select()
        .from(customers)
        .where(eq(customers.userId, existingUser[0].id))
        .limit(1);
      if (linked[0]) {
        customerId = linked[0].id;
      } else {
        // User hat noch keinen Customer — ggf. Customer per Email finden und linken
        const customerByEmail = await db
          .select()
          .from(customers)
          .where(eq(customers.email, effectiveEmail))
          .limit(1);
        if (customerByEmail[0]) {
          await db
            .update(customers)
            .set({ userId: existingUser[0].id })
            .where(eq(customers.id, customerByEmail[0].id));
          customerId = customerByEmail[0].id;
        } else {
          const ins = await db
            .insert(customers)
            .values({
              userId: existingUser[0].id,
              type: data.customerType,
              firstName: data.firstName,
              lastName: data.lastName,
              email: effectiveEmail,
              phone: data.phone ?? null,
              company: data.company ?? null,
              street: data.street ?? null,
              zip: data.zip ?? null,
              city: data.city ?? null,
            })
            .returning({ id: customers.id });
          customerId = ins[0].id;
        }
      }
    } else {
      // Brandneuer Account: User + Customer atomar anlegen, kein Passwort.
      const fullName = `${data.firstName} ${data.lastName}`.trim();
      const insertedUser = await db
        .insert(users)
        .values({
          email: effectiveEmail,
          name: fullName,
          role: "customer",
        })
        .returning({ id: users.id });
      resolvedUserId = insertedUser[0].id;

      // Falls schon ein anonymer Customer-Record existiert (alte Buchung gleicher Email),
      // mit dem neuen User verknuepfen statt zu duplizieren.
      const customerByEmail = await db
        .select()
        .from(customers)
        .where(eq(customers.email, effectiveEmail))
        .limit(1);
      if (customerByEmail[0]) {
        await db
          .update(customers)
          .set({ userId: resolvedUserId })
          .where(eq(customers.id, customerByEmail[0].id));
        customerId = customerByEmail[0].id;
      } else {
        const ins = await db
          .insert(customers)
          .values({
            userId: resolvedUserId,
            type: data.customerType,
            firstName: data.firstName,
            lastName: data.lastName,
            email: effectiveEmail,
            phone: data.phone ?? null,
            company: data.company ?? null,
            street: data.street ?? null,
            zip: data.zip ?? null,
            city: data.city ?? null,
          })
          .returning({ id: customers.id });
        customerId = ins[0].id;
      }
      isNewAccount = true;
    }
  }

  // ---------------------------------------------------------------
  // Discount-Code (optional): valdieren + Rabatt berechnen.
  // ---------------------------------------------------------------
  let discountCents = 0;
  let appliedDiscountCode: string | null = null;
  let appliedDiscountCodeId: string | null = null;
  let appliedVoucherId: string | null = null;
  if (data.discountCode && data.discountCode.trim()) {
    const trimmed = data.discountCode.trim().toUpperCase();
    if (trimmed.startsWith("WH-GIFT-")) {
      // Geschenk-Gutschein-Pfad
      const { previewVoucher } = await import("@/lib/voucher-redeem");
      const r = await previewVoucher(trimmed, breakdown.subtotalCents);
      if (!r.ok) {
        return {
          ok: false,
          error: `${T.voucherPrefix}: ${r.error}`,
          issues: [{ field: "discountCode", message: r.error }],
        };
      }
      discountCents = r.discountCents;
      appliedDiscountCode = r.code;
      appliedVoucherId = r.voucherId;
    } else {
      // Normaler Rabatt-Code
      const r = await validateDiscountCode(
        data.discountCode,
        customerId,
        breakdown.subtotalCents
      );
      if (!r.ok) {
        return {
          ok: false,
          error: `${T.discountPrefix}: ${r.error}`,
          issues: [{ field: "discountCode", message: r.error }],
        };
      }
      discountCents = calculateDiscountCents(
        breakdown.subtotalCents,
        r.percentOff,
        r.fixedOffCents
      );
      appliedDiscountCode = r.code;
      appliedDiscountCodeId = r.codeId;
    }
  }

  // Effektive Werte nach Rabatt
  const effectiveSubtotal = breakdown.subtotalCents - discountCents;
  const isSchoolPurpose = isSchoolDeferredPurpose(data.purposeCategory);
  // Komplettzahlung erzwingen, wenn die Anreise in weniger als 14 Tagen ist.
  // Schulgruppen zahlen 10 % Anzahlung, alle anderen 50 %.
  const fullPaymentRequired = daysUntilLocalDate(data.arrival) < 14;
  const prepayPercent = isSchoolPurpose ? 10 : 50;
  const effectivePrepayment = fullPaymentRequired
    ? effectiveSubtotal
    : Math.round((effectiveSubtotal * prepayPercent) / 100);
  const effectiveRemainder = effectiveSubtotal - effectivePrepayment;

  // Phase B: Wenn Anlass "Private Feier" → Vorstands-Pruefung vor Stripe.
  const isPrivatePartyReview = data.purposeCategory === "privat";

  const inserted = await db
    .insert(bookings)
    .values({
      bookingNumber,
      customerId,
      status: "angefragt",
      requiresReview: isPrivatePartyReview,
      reviewStatus: isPrivatePartyReview ? "pending" : null,
      paymentMode: "standard",
      institution: data.institution?.trim() || null,
      arrival: data.arrival,
      departure: data.departure,
      nights: breakdown.nights,
      adults: persons.adults,
      members: persons.members,
      children: persons.children,
      pupils: persons.pupils,
      teachers: persons.teachers,
      persons: totalPersons,
      purpose: data.purpose ?? null,
      accommodationCents: breakdown.accommodationCents,
      kurtaxeCents: 0, // Kurtaxe nicht mehr Teil der Buchung — separates Portal
      energyFlatCents: breakdown.energyFlatCents,
      cleaningCents: breakdown.cleaningCents,
      soloSurchargeCents: breakdown.soloSurchargeCents,
      minOccupancySurchargeCents: breakdown.minOccupancySurchargeCents,
      extrasCents: breakdown.extrasCents,
      discountCents,
      discountCode: appliedDiscountCode,
      subtotalCents: effectiveSubtotal,
      depositCents: breakdown.depositCents,
      totalCents: breakdown.subtotalCents,
      paidCents: 0,
      cleaningOptedIn: true, // Pflicht
      soloUse: data.soloUse,
      source: "Portal",
      customerMessage: data.customerMessage ?? null,
      // Hausordnung-Akzept (versioniert, fuer rechtliche Nachvollziehbarkeit)
      acceptedHausordnungVersion: CURRENT_HAUSORDNUNG_VERSION,
      acceptedHausordnungAt: new Date(),
      // Geschenk-Gutschein-Einlösung (separat von discount_codes)
      voucherId: appliedVoucherId,
      voucherDiscountCents: appliedVoucherId ? discountCents : 0,
    })
    .returning({ id: bookings.id, bookingNumber: bookings.bookingNumber });

  const bookingId = inserted[0].id;

  // Institution in den Kunden-Datensatz spiegeln (company), damit Rechnung /
  // Mietvertrag die Organisation zeigen. Nur wenn angegeben.
  if (data.institution?.trim()) {
    try {
      await db
        .update(customers)
        .set({ company: data.institution.trim() })
        .where(eq(customers.id, customerId));
    } catch (err) {
      console.error("[booking] institution→customer.company mirror failed (non-blocking):", err);
    }
  }

  // Neue Buchung (status "angefragt") blockt sofort Kalendertage →
  // booking-blocks-Cache invalidieren, damit /buchen das Datum direkt sperrt.
  revalidateTag(BOOKING_BLOCKS_TAG, "max");

  // =====================================================================
  // Phase B: Private-Feier-Review-Pfad
  // =====================================================================
  if (isPrivatePartyReview) {
    const baseUrlReview =
      process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.xn--wiesenhtte-geb.com";
    const partyTypeLabel = data.purposeSubtypeLabel?.trim() || "Private Feier";
    const reasonText = data.purposeReason?.trim() || "(keine Beschreibung angegeben)";

    // 1) Bestätigungs-Mail an den Gast (keine Zahlungsaufforderung!).
    try {
      await sendMail({
        to: effectiveEmail,
        subject: `Wir prüfen Eure Anfrage — Buchung ${bookingNumber}`,
        template: "review-pending-guest",
        bookingId,
        react: ReviewPendingGuestEmail({
          firstName: data.firstName,
          bookingNumber,
          arrival: data.arrival,
          departure: data.departure,
          partyType: partyTypeLabel,
          reason: reasonText,
        }),
      });
    } catch (err) {
      console.error("[review-pending-guest] mail failed (non-blocking):", err);
    }

    // 2) Interne Notification an den Vorstand.
    const internalTo = process.env.MAIL_INTERNAL_TO;
    if (internalTo) {
      try {
        await sendMail({
          to: internalTo,
          subject: `⚠ Private-Feier-Anfrage zur Prüfung — ${bookingNumber}`,
          template: "review-pending-internal",
          bookingId,
          react: ReviewPendingInternalEmail({
            bookingNumber,
            managerUrl: `${baseUrlReview}/m/buchungen/${bookingId}`,
            guestName: `${data.firstName} ${data.lastName}`,
            guestEmail: effectiveEmail,
            guestPhone: data.phone ?? null,
            arrival: data.arrival,
            departure: data.departure,
            persons: totalPersons,
            partyType: partyTypeLabel,
            reason: reasonText,
          }),
        });
      } catch (err) {
        console.error("[review-pending-internal] mail failed (non-blocking):", err);
      }
    }

    await db.insert(activityLog).values({
      who: "Portal",
      what: `Private-Feier-Anfrage ${bookingNumber} eingegangen — wartet auf Vorstands-Freigabe (Subtyp: ${partyTypeLabel}).`,
      bookingId,
    });

    return { ok: true, requiresReview: true, bookingNumber };
  }
  // =====================================================================

  // =====================================================================
  // Schulgruppen-Zahlungsaufschub: KEIN Sofort-Checkout. Die Anzahlung wird
  // per Cron 30 Tage vor Anreise faellig (Zahlungslink-Mail). Bis dahin ist
  // die Buchung in "angefragt" + payment_mode "school_deferred" und blockt
  // die Tage. Sobald die Anzahlung bezahlt ist, laeuft alles wie eine
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  let checkoutSession;
  try {
    const CL = CHECKOUT_LINES[locale];
    const discountSnippet = discountCents > 0
      ? `${formatEuro(discountCents, locale)} (${appliedDiscountCode})`
      : null;
    checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      locale: STRIPE_LOCALE[locale],
      customer_email: effectiveEmail,
      billing_address_collection: "auto",
      // Session läuft nach 60 Min ab. Die Buchung blockt die Tage als
      // "angefragt"; bei Ablauf/Abbruch wird sie über den
      // checkout.session.expired-Webhook (+ Cron-Safety-Net) wieder
      // freigegeben, damit verwaiste Buchungen keine Termine dauerblockieren.
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: effectivePrepayment,
            product_data: {
              name: fullPaymentRequired
                ? CL.fullName(data.arrival, data.departure)
                : isSchoolPurpose
                  ? CL.depositName(data.arrival, data.departure).replace("50 %", "10 %").replace("50%", "10%")
                  : CL.depositName(data.arrival, data.departure),
              description: fullPaymentRequired
                ? CL.fullDescription(totalPersons, breakdown.nights, bookingNumber, discountSnippet)
                : CL.depositDescription(
                    totalPersons,
                    breakdown.nights,
                    bookingNumber,
                    discountSnippet,
                    formatEuro(effectiveRemainder, locale)
                  ),
            },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: breakdown.depositCents,
            product_data: {
              name: CL.kautionName,
              description: CL.kautionDescription,
            },
          },
        },
      ],
      // Stripe-Customer und Payment-Method speichern fuer spaetere
      // Off-Session-Restzahlung (Cron T-7 vor Anreise).
      customer_creation: "always",
      payment_intent_data: {
        setup_future_usage: "off_session",
        metadata: { bookingId, bookingNumber },
      },
      metadata: {
        bookingId,
        bookingNumber,
        kind: "anzahlung",
      },
      success_url: `${baseUrl}/buchen/erfolg?bn=${bookingNumber}`,
      cancel_url: `${baseUrl}/buchen/abbruch?bn=${bookingNumber}`,
    });
  } catch (err) {
    // Diagnose-Logging: schreibe den exakten Stripe-Error in activity_log
    // damit wir bei Live-Mode-Problemen sehen was schiefgeht.
    const e = err as {
      message?: string;
      code?: string;
      type?: string;
      raw?: { code?: string; message?: string; type?: string };
      statusCode?: number;
    };
    const detail = JSON.stringify({
      message: e.message,
      code: e.code ?? e.raw?.code,
      type: e.type ?? e.raw?.type,
      statusCode: e.statusCode,
      keyPrefix: (process.env.STRIPE_SECRET_KEY ?? "").slice(0, 12),
    });
    try {
      await db.insert(activityLog).values({
        who: "Stripe-Error",
        what: `Session-Create FEHLGESCHLAGEN für ${bookingNumber}: ${detail.slice(0, 480)}`,
        bookingId,
      });
    } catch {}
    console.error("[stripe sessions.create] failed:", err);
    return {
      ok: false,
      error: T.stripeFailed(e.message ?? T.stripeUnknown),
    };
  }

  await db
    .update(bookings)
    .set({ stripeSessionId: checkoutSession.id, updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));

  // Open payment rows: (Voll- bzw. An-)Zahlung + Kaution jetzt fällig.
  // Restzahlung-Zeile nur, wenn es überhaupt eine gibt (entfällt bei
  // Komplettzahlung < 14 Tage vor Anreise).
  await db.insert(payments).values([
    {
      bookingId,
      kind: fullPaymentRequired ? "vollzahlung" : "anzahlung",
      status: "offen",
      amountCents: effectivePrepayment,
      method: "Stripe Checkout",
    },
    {
      bookingId,
      kind: "kaution",
      status: "offen",
      amountCents: breakdown.depositCents,
      method: "Stripe Checkout",
    },
    ...(effectiveRemainder > 0
      ? [
          {
            bookingId,
            kind: "restzahlung" as const,
            status: "offen" as const,
            amountCents: effectiveRemainder,
            method: "Stripe Off-Session (auto T-14)",
          },
        ]
      : []),
  ]);

  // Discount-Code als eingeloest markieren
  if (appliedDiscountCodeId) {
    await markDiscountRedeemed(appliedDiscountCodeId, bookingId);
  }

  await db.insert(activityLog).values({
    who: "Portal",
    what: `Neue Buchung ${bookingNumber} angelegt — ${
      fullPaymentRequired
        ? `Komplettzahlung ${formatEuro(effectivePrepayment)} (Anreise < 14 Tage)`
        : `Anzahlung ${formatEuro(effectivePrepayment)}; Restzahlung ${formatEuro(effectiveRemainder)} offen`
    } + Kaution ${formatEuro(breakdown.depositCents)} via Stripe${
      discountCents > 0 ? ` · Rabatt ${formatEuro(discountCents)} (${appliedDiscountCode})` : ""
    }${isNewAccount ? " (Konto automatisch angelegt)" : ""}`,
    bookingId,
  });

  // Wenn wir gerade ein neues Kunden-Konto angelegt haben: Welcome-Mail mit
  // Magic-Link-Login schicken, damit der Kunde sofort sein Konto uebernehmen kann.
  if (isNewAccount && resolvedUserId) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.xn--wiesenhtte-geb.com";
      const tokenRes = await createMagicLinkToken(effectiveEmail);
      const loginUrl =
        "rateLimited" in tokenRes
          ? `${baseUrl}/konto`
          : `${baseUrl}/auth/magic?token=${encodeURIComponent(tokenRes.token)}`;
      await sendMail({
        to: effectiveEmail,
        subject: "Dein Wiesenhütten-Konto + Buchung",
        template: "welcome_with_booking",
        bookingId,
        react: WelcomeEmail({
          firstName: data.firstName,
          email: effectiveEmail,
          membershipPending: false,
          loginUrl,
        }),
      });
    } catch (err) {
      console.error("[booking-welcome-mail] failed (non-blocking):", err);
    }
  }

  if (!checkoutSession.url) {
    return { ok: false, error: T.checkoutUrlMissing };
  }

  return { ok: true, checkoutUrl: checkoutSession.url, bookingNumber };
}

// =============================================================
// PREFILL — fuer eingeloggte Kunden, damit Buchen-Form vorausgefuellt wird
// =============================================================

// =============================================================
// DISCOUNT-CODE-PREVIEW — Live-Validierung im Buchen-UI
// =============================================================

export async function previewDiscountAction(
  rawCode: string,
  subtotalCents: number
): Promise<
  | { ok: true; code: string; discountCents: number; percentOff: number; fixedOffCents: number }
  | { ok: false; error: string }
> {
  // Heuristik: wenn Code mit WH-GIFT- anfängt, ist es ein Geschenk-Gutschein
  const trimmed = rawCode.trim().toUpperCase();
  if (trimmed.startsWith("WH-GIFT-")) {
    const { previewVoucher } = await import("@/lib/voucher-redeem");
    const r = await previewVoucher(trimmed, subtotalCents);
    if (!r.ok) return { ok: false, error: r.error };
    return {
      ok: true,
      code: r.code,
      discountCents: r.discountCents,
      percentOff: 0,
      fixedOffCents: r.discountCents,
    };
  }
  // Sonst normaler Discount-Code-Pfad
  const session = await auth();
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
  let customerId: string | null = null;
  if (sessionUserId) {
    const linked = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.userId, sessionUserId))
      .limit(1);
    customerId = linked[0]?.id ?? null;
  }
  return previewDiscount(rawCode, customerId, subtotalCents);
}

export type BookingPrefill = {
  loggedIn: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  street?: string;
  zip?: string;
  city?: string;
  customerType?: "privat" | "mitglied" | "verein" | "firma";
  membershipVerified?: boolean;
};

export async function getBookingPrefill(): Promise<BookingPrefill> {
  const session = await auth();
  if (!session?.user) return { loggedIn: false };

  const userId = (session.user as { id?: string }).id;
  if (!userId) return { loggedIn: false };

  const linked = await db.select().from(customers).where(eq(customers.userId, userId)).limit(1);
  const c = linked[0];
  if (!c) {
    return {
      loggedIn: true,
      email: session.user.email ?? undefined,
    };
  }

  return {
    loggedIn: true,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone ?? undefined,
    street: c.street ?? undefined,
    zip: c.zip ?? undefined,
    city: c.city ?? undefined,
    customerType: c.membershipStatus === "verified" ? "mitglied" : c.type,
    membershipVerified: c.membershipStatus === "verified",
  };
}
