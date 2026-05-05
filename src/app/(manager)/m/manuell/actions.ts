"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { bookings, customers, activityLog } from "@/lib/db/schema";
import { calculatePrice, validateBookingInput } from "@/lib/pricing";
import { isRangeAvailable } from "@/lib/availability";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { generateBookingNumber } from "@/lib/utils";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const schema = z.object({
  arrival: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departure: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.coerce.number().int().min(0).default(0),
  members: z.coerce.number().int().min(0).default(0),
  children: z.coerce.number().int().min(0).default(0),
  pupils: z.coerce.number().int().min(0).default(0),
  teachers: z.coerce.number().int().min(0).default(0),
  cleaningOptedIn: z.coerce.boolean().default(true),
  soloUse: z.coerce.boolean().default(false),
  customerType: z.enum(["privat", "mitglied", "verein", "firma"]).default("privat"),
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  purpose: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
});

export async function createManualBooking(formData: FormData): Promise<{ ok: boolean; error?: string; redirectTo?: string }> {
  const session = await auth();
  if (!session) return { ok: false, error: "Unauthorized" };

  const raw: Record<string, unknown> = {};
  formData.forEach((v, k) => {
    if (k === "cleaningOptedIn" || k === "soloUse") {
      raw[k] = v === "on" || v === "true";
    } else {
      raw[k] = v;
    }
  });

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const d = parsed.data;
  const persons = {
    adults: d.adults,
    members: d.members,
    children: d.children,
    pupils: d.pupils,
    teachers: d.teachers,
  };

  const issues = validateBookingInput({
    arrival: d.arrival,
    departure: d.departure,
    persons,
    cleaningOptedIn: d.cleaningOptedIn,
    soloUse: d.soloUse,
  });
  if (issues.length > 0) {
    return { ok: false, error: issues.map((i) => i.message).join(" ") };
  }

  const free = await isRangeAvailable({ arrival: d.arrival, departure: d.departure });
  if (!free) return { ok: false, error: "Zeitraum ist bereits belegt." };

  const breakdown = calculatePrice({
    arrival: d.arrival,
    departure: d.departure,
    persons,
    cleaningOptedIn: d.cleaningOptedIn,
    soloUse: d.soloUse,
  });

  // Upsert customer
  let customerId: string;
  const found = await db
    .select()
    .from(customers)
    .where(eq(customers.email, d.email.toLowerCase()))
    .limit(1);
  if (found[0]) {
    customerId = found[0].id;
  } else {
    const ins = await db
      .insert(customers)
      .values({
        type: d.customerType,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email.toLowerCase(),
        phone: d.phone ?? null,
        company: d.company ?? null,
      })
      .returning({ id: customers.id });
    customerId = ins[0].id;
  }

  const bookingNumber = generateBookingNumber();
  const totalPersons =
    persons.adults + persons.members + persons.children + persons.pupils + persons.teachers;

  const inserted = await db
    .insert(bookings)
    .values({
      bookingNumber,
      customerId,
      status: "bestaetigt",
      arrival: d.arrival,
      departure: d.departure,
      nights: breakdown.nights,
      adults: persons.adults,
      members: persons.members,
      children: persons.children,
      pupils: persons.pupils,
      teachers: persons.teachers,
      persons: totalPersons,
      purpose: d.purpose ?? null,
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
      cleaningOptedIn: d.cleaningOptedIn,
      soloUse: d.soloUse,
      source: "Manuell",
      internalNotes: d.internalNotes ?? null,
    })
    .returning({ id: bookings.id });

  await db.insert(activityLog).values({
    who: session.user?.name ?? session.user?.email ?? "Manager",
    what: `Manuelle Buchung ${bookingNumber} angelegt (${totalPersons} P · ${breakdown.nights} N)`,
    bookingId: inserted[0].id,
  });

  revalidatePath("/m/buchungen");
  revalidatePath("/m/dashboard");
  revalidatePath("/m/kalender");

  return { ok: true, redirectTo: `/m/buchungen/${inserted[0].id}` };
}
