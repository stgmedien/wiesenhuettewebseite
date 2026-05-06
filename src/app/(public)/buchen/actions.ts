"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, customers, payments, activityLog } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
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
  const persons: Persons = data.persons;

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

  const breakdown = calculatePrice({
    arrival: data.arrival,
    departure: data.departure,
    persons,
    soloUse: data.soloUse,
  });

  const totalPersons = breakdown.totalPersons;

  const bookingNumber = generateBookingNumber();

  // Customer-Resolution:
  //  - Eingeloggter Kunde -> sein Customer-Record (linked via userId), Email aus Session.
  //    Mitgliedschafts-Status NICHT durch Formular ueberschreiben (manueller Workflow).
  //  - Nicht eingeloggt -> per Email finden oder neu anlegen.
  let customerId: string;
  const session = await auth();
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
  const sessionEmail = session?.user?.email?.toLowerCase();
  const effectiveEmail = sessionEmail ?? data.email.toLowerCase();

  if (sessionUserId) {
    const linked = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, sessionUserId))
      .limit(1);
    if (linked[0]) {
      customerId = linked[0].id;
      // Optional: Profil-Felder mit Form-Daten anreichern, falls leer
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
      // User existiert, aber noch kein Customer-Record (z.B. Magic-Link-Login ohne Sign-up)
      const inserted = await db
        .insert(customers)
        .values({
          userId: sessionUserId,
          type: data.customerType === "mitglied" ? "privat" : data.customerType,
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
    const found = await db
      .select()
      .from(customers)
      .where(eq(customers.email, effectiveEmail))
      .limit(1);
    if (found[0]) {
      customerId = found[0].id;
    } else {
      const inserted = await db
        .insert(customers)
        .values({
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
  }

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
      subtotalCents: breakdown.subtotalCents,
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
          unit_amount: breakdown.prepaymentCents,
          product_data: {
            name: `Anzahlung 50 % — Wiesenhütte ${data.arrival} bis ${data.departure}`,
            description: `${totalPersons} Personen · ${breakdown.nights} Nächte · Buchung ${bookingNumber} · Restzahlung ${formatEuro(breakdown.remainderCents)} folgt vor Anreise.`,
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
      amountCents: breakdown.prepaymentCents,
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
      amountCents: breakdown.remainderCents,
      method: "noch offen",
    },
  ]);

  await db.insert(activityLog).values({
    who: "Portal",
    what: `Neue Buchung ${bookingNumber} angelegt — Anzahlung ${formatEuro(breakdown.prepaymentCents)} + Kaution ${formatEuro(breakdown.depositCents)} via Stripe; Restzahlung ${formatEuro(breakdown.remainderCents)} offen`,
    bookingId,
  });

  if (!checkoutSession.url) {
    return { ok: false, error: "Stripe-Checkout konnte nicht erstellt werden." };
  }

  return { ok: true, checkoutUrl: checkoutSession.url, bookingNumber };
}

// =============================================================
// PREFILL — fuer eingeloggte Kunden, damit Buchen-Form vorausgefuellt wird
// =============================================================

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
