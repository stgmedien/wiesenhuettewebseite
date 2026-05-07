"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, customers, payments, activityLog, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { createMagicLinkToken } from "@/lib/magic-link";
import { sendMail } from "@/lib/mail/send";
import WelcomeEmail from "@/lib/mail/templates/welcome";
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
import { generateBookingNumber } from "@/lib/utils";

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
  phone: z.string().max(60).optional().nullable(),
  company: z.string().max(255).optional().nullable(),
  street: z.string().max(255).optional().nullable(),
  zip: z.string().max(20).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  purpose: z.string().max(255).optional().nullable(),
  customerMessage: z.string().max(2000).optional().nullable(),
  discountCode: z.string().max(30).optional().nullable(),
  acceptedTerms: z.literal(true),
});

export type BookingInput = z.infer<typeof inputSchema>;

export type ActionResult =
  | { ok: true; checkoutUrl: string; bookingNumber: string }
  | { ok: false; error: string; issues?: { field: string; message: string }[] };

export async function createBookingAndCheckout(raw: unknown): Promise<ActionResult> {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Ungültige Eingaben.",
      issues: parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    };
  }
  const data = parsed.data;
  const persons: Persons = { ...data.persons };

  // ---------------------------------------------------------------
  // Member-Discount-Gate: nur verifizierte Vereinsmitglieder duerfen
  // den Mitglieds-Tarif (7,50 €/Nacht) buchen.
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
      error:
        "Der Mitglieds-Tarif ist nur für verifizierte Vereinsmitglieder buchbar. Bitte logge Dich ein und beantrage die Mitgliedschaft im Konto-Profil.",
      issues: [
        {
          field: "persons.members",
          message: "Mitglieds-Tarif gesperrt",
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
      error: "Dieser Zeitraum ist leider nicht mehr verfügbar.",
      issues: [{ field: "dates", message: "Zeitraum belegt" }],
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
  if (data.discountCode && data.discountCode.trim()) {
    const r = await validateDiscountCode(
      data.discountCode,
      customerId,
      breakdown.subtotalCents
    );
    if (!r.ok) {
      return {
        ok: false,
        error: `Rabatt-Code: ${r.error}`,
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

  // Effektive Werte nach Rabatt
  const effectiveSubtotal = breakdown.subtotalCents - discountCents;
  const effectivePrepayment = Math.round((effectiveSubtotal * 50) / 100);
  const effectiveRemainder = effectiveSubtotal - effectivePrepayment;

  const inserted = await db
    .insert(bookings)
    .values({
      bookingNumber,
      customerId,
      status: "angefragt",
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
    })
    .returning({ id: bookings.id, bookingNumber: bookings.bookingNumber });

  const bookingId = inserted[0].id;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    locale: "de",
    customer_email: effectiveEmail,
    billing_address_collection: "auto",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: effectivePrepayment,
          product_data: {
            name: `Anzahlung 50 % — Wiesenhütte ${data.arrival} bis ${data.departure}`,
            description: `${totalPersons} Personen · ${breakdown.nights} Nächte · Buchung ${bookingNumber}${
              discountCents > 0 ? ` · Rabatt ${formatEuro(discountCents)} (${appliedDiscountCode})` : ""
            } · Restzahlung ${formatEuro(effectiveRemainder)} folgt vor Anreise.`,
          },
        },
      },
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: breakdown.depositCents,
          product_data: {
            name: "Kaution",
            description: "Erstattung innerhalb 14 Tagen nach mangelfreier Abreise.",
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

  await db
    .update(bookings)
    .set({ stripeSessionId: checkoutSession.id, updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));

  // Open payment rows: Anzahlung + Kaution (jetzt fällig), Restzahlung (offen)
  await db.insert(payments).values([
    {
      bookingId,
      kind: "anzahlung",
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
    {
      bookingId,
      kind: "restzahlung",
      status: "offen",
      amountCents: effectiveRemainder,
      method: "Stripe Off-Session (auto T-7)",
    },
  ]);

  // Discount-Code als eingeloest markieren
  if (appliedDiscountCodeId) {
    await markDiscountRedeemed(appliedDiscountCodeId, bookingId);
  }

  await db.insert(activityLog).values({
    who: "Portal",
    what: `Neue Buchung ${bookingNumber} angelegt — Anzahlung ${formatEuro(effectivePrepayment)} + Kaution ${formatEuro(breakdown.depositCents)} via Stripe; Restzahlung ${formatEuro(effectiveRemainder)} offen${
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
    return { ok: false, error: "Stripe-Checkout konnte nicht erstellt werden." };
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
