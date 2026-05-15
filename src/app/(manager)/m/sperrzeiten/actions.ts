"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { bookings, customers, activityLog } from "@/lib/db/schema";
import { isRangeAvailable } from "@/lib/availability";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { generateBookingNumber } from "@/lib/utils";
import { revalidatePath, revalidateTag } from "next/cache";
import { BOOKING_BLOCKS_TAG } from "@/lib/availability";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
  return session!;
}

const schema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  purpose: z.string().min(1).max(255),
});

export async function createSperrzeit(formData: FormData) {
  const session = await requireManager();

  const parsed = schema.safeParse({
    from: formData.get("from"),
    to: formData.get("to"),
    purpose: formData.get("purpose"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const { from, to, purpose } = parsed.data;
  if (new Date(to) <= new Date(from)) {
    return { ok: false, error: "Bis-Datum muss nach Von-Datum liegen." };
  }

  const free = await isRangeAvailable({ arrival: from, departure: to });
  if (!free) {
    return { ok: false, error: "Zeitraum überschneidet sich mit bestehender Buchung." };
  }

  // Use a placeholder "internal" customer (or none — booking has nullable customerId)
  const internalEmail = "intern@wiesenhuette.de";
  let internalId: string;
  const found = await db
    .select()
    .from(customers)
    .where(eq(customers.email, internalEmail))
    .limit(1);
  if (found[0]) {
    internalId = found[0].id;
  } else {
    const ins = await db
      .insert(customers)
      .values({
        type: "verein",
        firstName: "Skifreunde",
        lastName: "Gütersloh e.V.",
        email: internalEmail,
        company: "Skifreunde Gütersloh e.V. (Intern)",
      })
      .returning({ id: customers.id });
    internalId = ins[0].id;
  }

  const nights =
    Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24));

  const inserted = await db
    .insert(bookings)
    .values({
      bookingNumber: generateBookingNumber(),
      customerId: internalId,
      status: "wartung",
      arrival: from,
      departure: to,
      nights,
      adults: 0,
      members: 0,
      children: 0,
      pupils: 0,
      teachers: 0,
      persons: 0,
      purpose: `WARTUNG: ${purpose}`,
      accommodationCents: 0,
      kurtaxeCents: 0,
      energyFlatCents: 0,
      cleaningCents: 0,
      soloSurchargeCents: 0,
      extrasCents: 0,
      subtotalCents: 0,
      depositCents: 0,
      totalCents: 0,
      paidCents: 0,
      cleaningOptedIn: false,
      soloUse: false,
      source: "Intern",
    })
    .returning({ id: bookings.id });

  await db.insert(activityLog).values({
    who: session.user?.name ?? session.user?.email ?? "Manager",
    what: `Sperrzeit angelegt: ${from} → ${to} (${purpose})`,
    bookingId: inserted[0].id,
  });

  revalidatePath("/m/sperrzeiten");
  revalidatePath("/m/kalender");
  revalidatePath("/m/dashboard");
  // Neue Wartung/Sperrzeit blockt Kalendertage → Verfügbarkeits-Cache leeren.
  revalidateTag(BOOKING_BLOCKS_TAG, "max");

  return { ok: true };
}
