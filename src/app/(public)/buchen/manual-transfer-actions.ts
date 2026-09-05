"use server";

/**
 * Selbstbedienungs-Buchung per klassischer Überweisung — Alternative zum
 * Stripe-Checkout (actions.ts, createBookingAndCheckout) für Institutionen,
 * die Stripe (auch dessen eingebaute SEPA-Überweisung) nicht nutzen können
 * oder wollen und stattdessen direkt auf das Vereinskonto überweisen.
 *
 * Dupliziert bewusst die Vorbereitung (Validierung, Rate-Limit, Tarife,
 * Kunden-Resolution, Rabattcode) aus createBookingAndCheckout, statt sie
 * herauszuziehen — der bestehende Stripe-Zahlungsweg mit echtem Geld soll
 * dabei nicht angefasst werden, insbesondere weil hier kein Live-Browser-Test
 * möglich ist. Siehe /Users/johannesleiskau/.claude/plans/tender-sprouting-biscuit.md.
 *
 * Anders als beim Stripe-Pfad gibt es hier keine "Gast lässt die Session
 * offen"-Wartephase — der Vorgang schließt synchron mit einem Klick ab.
 * paymentMode "manual_transfer" ist deshalb bewusst von JEDER automatischen
 * Verfalls-/Storno-Logik ausgenommen (Stripe-Webhook und daily-cleanup prüfen
 * beide explizit auf paymentMode==="standard") — die Buchung bleibt
 * "angefragt", bis sie manuell bestätigt oder storniert wird, genau wie eine
 * heute von Hand im Manager-Bereich angelegte Buchung.
 */

import { z } from "zod";
import { eq, and, gt } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { BOOKING_BLOCKS_TAG, isRangeAvailable } from "@/lib/availability";
import { db } from "@/lib/db";
import { bookings, customers, payments, activityLog, users, bookingAttempts } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { sendMail } from "@/lib/mail/send";
import BookingInternalEmail from "@/lib/mail/templates/booking-internal";
import { isSchoolDeferredPurpose } from "@/lib/school-deposit";
import {
  validateDiscountCode,
  calculateDiscountCents,
  markDiscountRedeemed,
} from "@/lib/discount";
import { resolveTariffs } from "@/lib/pricing-tariffs";
import { calculatePrice, validateBookingInput, formatEuro, type Persons } from "@/lib/pricing";
import { generateBookingNumber, formatDateLong, daysUntilLocalDate } from "@/lib/utils";
import { CURRENT_HAUSORDNUNG_VERSION } from "@/lib/hausordnung";
import { MANUAL_REST_MARKER } from "@/lib/payment-markers";
import { CLUB_BANK_DETAILS } from "@/lib/bank-details";
import type { Locale } from "@/lib/i18n-shared";

// Nur diese drei Anlaesse -- explizit OHNE "firma".
const MANUAL_TRANSFER_PURPOSES = new Set(["klasse", "schul", "verein"]);
// Unterhalb dieses Vorlaufs waere die T-14-Zahlungsfrist schon in der
// Vergangenheit -- Button in BookingFlow.tsx wird ab hier ausgeblendet,
// server-seitig hier nochmal hart geprueft.
const MIN_LEAD_DAYS = 21;

const ERRORS: Record<Locale, {
  invalidInput: string;
  tooManyAttempts: string;
  memberLocked: string;
  memberLockedField: string;
  rangeUnavailable: string;
  rangeBlocked: string;
  discountPrefix: string;
  notEligible: string;
  leadTimeTooShort: string;
}> = {
  de: {
    invalidInput: "Ungültige Eingaben.",
    tooManyAttempts: "Zu viele Buchungs-Versuche von dieser Email-Adresse in kurzer Zeit. Bitte versuche es in einer Stunde erneut oder kontaktiere uns direkt.",
    memberLocked: "Der Mitglieds-Tarif ist nur für verifizierte Vereinsmitglieder buchbar. Bitte logge Dich ein und beantrage die Mitgliedschaft im Konto-Profil.",
    memberLockedField: "Mitglieds-Tarif gesperrt",
    rangeUnavailable: "Dieser Zeitraum ist leider nicht mehr verfügbar.",
    rangeBlocked: "Zeitraum belegt",
    discountPrefix: "Rabatt-Code",
    notEligible: "Klassische Überweisung ist für diesen Anlass nicht verfügbar.",
    leadTimeTooShort: `Klassische Überweisung erfordert mindestens ${MIN_LEAD_DAYS} Tage Vorlauf bis zur Anreise.`,
  },
  en: {
    invalidInput: "Invalid input.",
    tooManyAttempts: "Too many booking attempts from this email address recently. Please try again in an hour or contact us directly.",
    memberLocked: "The member rate is only bookable for verified club members. Please log in and apply for membership in your account profile.",
    memberLockedField: "Member rate locked",
    rangeUnavailable: "Sorry, this range is no longer available.",
    rangeBlocked: "Range booked",
    discountPrefix: "Discount code",
    notEligible: "Classic bank transfer is not available for this purpose.",
    leadTimeTooShort: `Classic bank transfer requires at least ${MIN_LEAD_DAYS} days before arrival.`,
  },
  nl: {
    invalidInput: "Ongeldige invoer.",
    tooManyAttempts: "Te veel boekingspogingen vanaf dit e-mailadres in korte tijd. Probeer het over een uur opnieuw of neem direct contact op.",
    memberLocked: "Het ledentarief is alleen beschikbaar voor geverifieerde verenigingsleden. Log in en vraag lidmaatschap aan in je accountprofiel.",
    memberLockedField: "Ledentarief geblokkeerd",
    rangeUnavailable: "Deze periode is helaas niet meer beschikbaar.",
    rangeBlocked: "Periode geboekt",
    discountPrefix: "Kortingscode",
    notEligible: "Klassieke overschrijving is niet beschikbaar voor dit doel.",
    leadTimeTooShort: `Klassieke overschrijving vereist minstens ${MIN_LEAD_DAYS} dagen tot aankomst.`,
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
  phone: z.string().min(5).max(60),
  company: z.string().max(255).optional().nullable(),
  institution: z.string().max(255).optional().nullable(),
  street: z.string().max(255).optional().nullable(),
  zip: z.string().max(20).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  purpose: z.string().min(1).max(500),
  purposeCategory: z
    .enum(["familie", "klasse", "schul", "verein", "firma", "sonstiges"])
    .optional(),
  customerMessage: z.string().max(2000).optional().nullable(),
  discountCode: z.string().max(30).optional().nullable(),
  acceptedTerms: z.literal(true),
  locale: z.enum(["de", "en", "nl"]).default("de"),
});

export type ManualTransferResult =
  | {
      ok: true;
      bookingNumber: string;
      anzahlungCents: number;
      restzahlungCents: number;
      restzahlungDeadlineIso: string;
      bank: string;
      iban: string;
      kontoinhaber: string;
    }
  | { ok: false; error: string; issues?: { field: string; message: string }[] };

const BOOKING_RATE_WINDOW_MS = 60 * 60_000;
const BOOKING_MAX_PER_WINDOW = 5;

export async function createManualTransferBooking(raw: unknown): Promise<ManualTransferResult> {
  const rawLocale = (raw as { locale?: string } | null)?.locale;
  const earlyLocale: Locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const E = ERRORS[earlyLocale];

  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: E.invalidInput,
      issues: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    };
  }
  const data = parsed.data;
  const persons: Persons = { ...data.persons };
  const locale: Locale = data.locale;
  const T = ERRORS[locale];

  // Defense in depth -- niemals nur dem Client-seitigen Gate vertrauen.
  if (!MANUAL_TRANSFER_PURPOSES.has(data.purposeCategory ?? "")) {
    return { ok: false, error: T.notEligible };
  }
  if (daysUntilLocalDate(data.arrival) < MIN_LEAD_DAYS) {
    return { ok: false, error: T.leadTimeTooShort };
  }

  // -----------------------------------------------------------------
  // Spam-Schutz: max 5 Buchungs-Versuche pro (Email, IP) pro Stunde.
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
    .where(and(eq(bookingAttempts.email, lowerEmail), gt(bookingAttempts.at, since)))
    .limit(BOOKING_MAX_PER_WINDOW + 1);
  if (recentAttempts.length >= BOOKING_MAX_PER_WINDOW) {
    return { ok: false, error: T.tooManyAttempts };
  }
  try {
    await db.insert(bookingAttempts).values({ email: lowerEmail, ip });
  } catch (err) {
    console.error("[booking-throttle] log failed:", err);
  }

  // ---------------------------------------------------------------
  // Member-Discount-Gate.
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
      issues: [{ field: "persons.members", message: T.memberLockedField }],
    };
  }
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

  const free = await isRangeAvailable({ arrival: data.arrival, departure: data.departure });
  if (!free) {
    return {
      ok: false,
      error: T.rangeUnavailable,
      issues: [{ field: "dates", message: T.rangeBlocked }],
    };
  }

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

  // Customer-Resolution + Auto-Account-Creation -- identisch zu
  // createBookingAndCheckout (actions.ts).
  let customerId: string;
  const effectiveEmail = sessionEmail ?? data.email.toLowerCase();

  if (sessionUserId) {
    const linked = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, sessionUserId))
      .limit(1);
    if (linked[0]) {
      customerId = linked[0].id;
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
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, effectiveEmail))
      .limit(1);

    if (existingUser[0]) {
      const linked = await db
        .select()
        .from(customers)
        .where(eq(customers.userId, existingUser[0].id))
        .limit(1);
      if (linked[0]) {
        customerId = linked[0].id;
      } else {
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
      const fullName = `${data.firstName} ${data.lastName}`.trim();
      const insertedUser = await db
        .insert(users)
        .values({ email: effectiveEmail, name: fullName, role: "customer" })
        .returning({ id: users.id });
      const newUserId = insertedUser[0].id;

      const customerByEmail = await db
        .select()
        .from(customers)
        .where(eq(customers.email, effectiveEmail))
        .limit(1);
      if (customerByEmail[0]) {
        await db.update(customers).set({ userId: newUserId }).where(eq(customers.id, customerByEmail[0].id));
        customerId = customerByEmail[0].id;
      } else {
        const ins = await db
          .insert(customers)
          .values({
            userId: newUserId,
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
  }

  // ---------------------------------------------------------------
  // Discount-Code (optional).
  // ---------------------------------------------------------------
  let discountCents = 0;
  let appliedDiscountCode: string | null = null;
  let appliedDiscountCodeId: string | null = null;
  if (data.discountCode && data.discountCode.trim()) {
    const r = await validateDiscountCode(data.discountCode, customerId, breakdown.subtotalCents);
    if (!r.ok) {
      return {
        ok: false,
        error: `${T.discountPrefix}: ${r.error}`,
        issues: [{ field: "discountCode", message: r.error }],
      };
    }
    discountCents = calculateDiscountCents(breakdown.subtotalCents, r.percentOff, r.fixedOffCents);
    appliedDiscountCode = r.code;
    appliedDiscountCodeId = r.codeId;
  }

  const effectiveSubtotal = breakdown.subtotalCents - discountCents;
  const isSchoolPurpose = isSchoolDeferredPurpose(data.purposeCategory);
  const prepayPercent = isSchoolPurpose ? 10 : 50;
  const effectivePrepayment = Math.round((effectiveSubtotal * prepayPercent) / 100);
  const effectiveRemainder = effectiveSubtotal - effectivePrepayment;
  const restzahlungCents = effectiveRemainder + breakdown.depositCents + breakdown.kurtaxeCents;

  const restzahlungDeadlineDate = new Date(`${data.arrival}T00:00:00`);
  restzahlungDeadlineDate.setDate(restzahlungDeadlineDate.getDate() - 14);
  const restzahlungDeadlineIso = restzahlungDeadlineDate.toISOString().slice(0, 10);

  const result = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(bookings)
      .values({
        bookingNumber,
        customerId,
        status: "angefragt",
        paymentMode: "manual_transfer",
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
        kurtaxeCents: breakdown.kurtaxeCents,
        energyFlatCents: breakdown.energyFlatCents,
        cleaningCents: breakdown.cleaningCents,
        soloSurchargeCents: breakdown.soloSurchargeCents,
        minOccupancySurchargeCents: breakdown.minOccupancySurchargeCents,
        extrasCents: breakdown.extrasCents,
        discountCents,
        discountCode: appliedDiscountCode,
        subtotalCents: effectiveSubtotal,
        depositCents: breakdown.depositCents,
        totalCents: effectiveSubtotal,
        paidCents: 0,
        cleaningOptedIn: true,
        soloUse: data.soloUse,
        source: "Portal",
        customerMessage: data.customerMessage ?? null,
        acceptedHausordnungVersion: CURRENT_HAUSORDNUNG_VERSION,
        acceptedHausordnungAt: new Date(),
      })
      .returning({ id: bookings.id });
    const bookingId = inserted[0].id;

    await tx.insert(payments).values([
      {
        bookingId,
        kind: "anzahlung",
        status: "offen",
        amountCents: effectivePrepayment,
        method: "Klassische Überweisung (Selbstbedienung)",
      },
      {
        bookingId,
        kind: "restzahlung",
        status: "offen",
        amountCents: restzahlungCents,
        method: MANUAL_REST_MARKER,
      },
    ]);

    await tx.insert(activityLog).values({
      who: "Portal",
      what: `Neue Buchung ${bookingNumber} angelegt — klassische Überweisung (Selbstbedienung): Anzahlung ${formatEuro(effectivePrepayment)}, Restzahlung ${formatEuro(restzahlungCents)} fällig bis ${formatDateLong(restzahlungDeadlineIso)}.`,
      bookingId,
    });

    if (appliedDiscountCodeId) await markDiscountRedeemed(appliedDiscountCodeId, bookingId);

    return { bookingId };
  });

  if (data.institution?.trim()) {
    try {
      await db.update(customers).set({ company: data.institution.trim() }).where(eq(customers.id, customerId));
    } catch (err) {
      console.error("[manual-transfer] institution→customer.company mirror failed (non-blocking):", err);
    }
  }

  revalidateTag(BOOKING_BLOCKS_TAG, "max");

  // Interne Benachrichtigung -- ohne die weiss niemand, dass diese Buchung
  // existiert und wann der Kontoeingang zu erwarten ist. Best-effort.
  try {
    const internalTo = process.env.MAIL_INTERNAL_TO;
    if (internalTo) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      await sendMail({
        to: internalTo,
        subject: `Neue Überweisungs-Buchung ${bookingNumber} — bitte Kontoeingang prüfen`,
        template: "booking_internal_manual_transfer",
        bookingId: result.bookingId,
        react: BookingInternalEmail({
          bookingNumber,
          guestName: `${data.firstName} ${data.lastName}`.trim(),
          guestEmail: effectiveEmail,
          guestPhone: data.phone,
          arrival: formatDateLong(data.arrival),
          departure: formatDateLong(data.departure),
          nights: breakdown.nights,
          persons: totalPersons,
          customerType: data.customerType,
          totalCents: effectiveSubtotal,
          paidCents: 0,
          managerUrl: `${baseUrl}/m/buchungen/${result.bookingId}`,
          notes: `Klassische Überweisung (Selbstbedienung), kein Stripe. Anzahlung ${formatEuro(effectivePrepayment)} und Restzahlung ${formatEuro(restzahlungCents)} (fällig bis ${formatDateLong(restzahlungDeadlineIso)}) sind als offene Zahlungen hinterlegt — die Restzahlung wird automatisch per T-21-Erinnerungsmail an den Gast angemahnt.`,
        }),
      });
    }
  } catch (err) {
    console.error("[manual-transfer] internal notice failed (non-blocking):", err);
  }

  return {
    ok: true,
    bookingNumber,
    anzahlungCents: effectivePrepayment,
    restzahlungCents,
    restzahlungDeadlineIso,
    bank: CLUB_BANK_DETAILS.bank,
    iban: CLUB_BANK_DETAILS.iban,
    kontoinhaber: CLUB_BANK_DETAILS.kontoinhaber,
  };
}
