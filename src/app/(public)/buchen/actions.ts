"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, customers, payments, activityLog } from "@/lib/db/schema";
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
  cleaningOptedIn: z.boolean().default(true),
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

  // Server-side pricing & rules validation
  const issues = validateBookingInput({
    arrival: data.arrival,
    departure: data.departure,
    persons,
    cleaningOptedIn: data.cleaningOptedIn,
    soloUse: data.soloUse,
  });
  if (issues.length > 0) {
    return { ok: false, error: issues.map((i) => i.message).join(" "), issues };
  }

  // Availability check against DB
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
    cleaningOptedIn: data.cleaningOptedIn,
    soloUse: data.soloUse,
  });

  const totalPersons =
    persons.adults +
    persons.members +
    persons.children +
    persons.pupils +
    persons.teachers;

  const bookingNumber = generateBookingNumber();

  let customerId: string;
  {
    const found = await db
      .select()
      .from(customers)
      .where(eq(customers.email, data.email.toLowerCase()))
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
          email: data.email.toLowerCase(),
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

  // Insert booking (status: angefragt)
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
      kurtaxeCents: breakdown.kurtaxeCents,
      energyFlatCents: breakdown.energyFlatCents,
      cleaningCents: breakdown.cleaningCents,
      soloSurchargeCents: breakdown.soloSurchargeCents,
      extrasCents: breakdown.extrasCents,
      subtotalCents: breakdown.subtotalCents,
      depositCents: breakdown.depositCents,
      totalCents: breakdown.subtotalCents,
      paidCents: 0,
      cleaningOptedIn: data.cleaningOptedIn,
      soloUse: data.soloUse,
      source: "Portal",
      customerMessage: data.customerMessage ?? null,
    })
    .returning({ id: bookings.id, bookingNumber: bookings.bookingNumber });

  const bookingId = inserted[0].id;

  // Stripe Checkout Session (in EUR cents)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    locale: "de",
    customer_email: data.email,
    billing_address_collection: "auto",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: breakdown.subtotalCents,
          product_data: {
            name: `Wiesenhütte — ${data.arrival} bis ${data.departure}`,
            description: `${totalPersons} Personen · ${breakdown.nights} Nächte · Buchung ${bookingNumber}`,
          },
        },
      },
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: breakdown.depositCents,
          product_data: {
            name: "Kaution (Erstattung innerhalb 14 Tagen)",
            description: "Wird nach mangelfreier Abreise zurückerstattet.",
          },
        },
      },
    ],
    metadata: {
      bookingId,
      bookingNumber,
    },
    success_url: `${baseUrl}/buchen/erfolg?bn=${bookingNumber}`,
    cancel_url: `${baseUrl}/buchen/abbruch?bn=${bookingNumber}`,
  });

  // Save stripe session id
  await db
    .update(bookings)
    .set({ stripeSessionId: session.id, updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));

  // Open payment row
  await db.insert(payments).values({
    bookingId,
    kind: "vollzahlung",
    status: "offen",
    amountCents: breakdown.subtotalCents + breakdown.depositCents,
    method: "Stripe Checkout",
    stripePaymentIntentId: session.payment_intent as string | null,
  });

  await db.insert(activityLog).values({
    who: "Portal",
    what: `Neue Buchung ${bookingNumber} angelegt — ${formatEuro(breakdown.subtotalCents + breakdown.depositCents)} → Stripe`,
    bookingId,
  });

  if (!session.url) {
    return { ok: false, error: "Stripe-Checkout konnte nicht erstellt werden." };
  }

  return { ok: true, checkoutUrl: session.url, bookingNumber };
}
