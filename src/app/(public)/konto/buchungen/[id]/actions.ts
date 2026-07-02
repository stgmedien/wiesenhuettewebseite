"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { bookings, customers, activityLog, payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cancellationFee, formatEuro, calculatePrice, RULES, type Persons } from "@/lib/pricing";
import { resolveTariffs } from "@/lib/pricing-tariffs";
import { formatDateLong } from "@/lib/utils";
import { sendMail } from "@/lib/mail/send";
import BookingCancelledEmail from "@/lib/mail/templates/booking-cancelled";
import PersonsIncreasedEmail from "@/lib/mail/templates/persons-increased";
import HuettenwartCancellationEmail from "@/lib/mail/templates/huettenwart-cancellation";
import { HUETTENWART_EMAIL, HUETTENWART_CC } from "@/lib/huettenwart";

const idSchema = z.string().uuid();

async function loadOwnedBooking(bookingId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht eingeloggt");
  const userId = (session.user as { id?: string }).id;
  if (!userId) throw new Error("Session ohne User-ID");

  const linked = await db
    .select()
    .from(customers)
    .where(eq(customers.userId, userId))
    .limit(1);
  const customer = linked[0];
  if (!customer) throw new Error("Kein Customer-Record");

  const found = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  const booking = found[0];
  if (!booking) throw new Error("Buchung nicht gefunden");
  if (booking.customerId !== customer.id) {
    throw new Error("Diese Buchung gehört nicht zu Deinem Konto");
  }

  return { booking, customer, session };
}

export async function cancelOwnBooking(formData: FormData) {
  const id = idSchema.parse(formData.get("id"));
  const reason = (formData.get("reason") ?? "").toString().trim() || null;

  const { booking, customer } = await loadOwnedBooking(id);

  if (
    booking.status === "storniert" ||
    booking.status === "abgereist" ||
    booking.status === "angereist"
  ) {
    return { ok: false, error: "Diese Buchung kann nicht mehr storniert werden." };
  }

  const fee = cancellationFee(booking.subtotalCents, booking.arrival);

  await db
    .update(bookings)
    .set({
      status: "storniert",
      internalNotes: [
        booking.internalNotes,
        `Storniert vom Kunden am ${new Date().toLocaleString("de-DE")}${
          reason ? ` — Grund: ${reason}` : ""
        }. Storno-Gebühr ${fee.percent}% = ${formatEuro(fee.feeCents)}.`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, booking.id));

  // Offene Zahlungen als 'fehlgeschlagen' markieren (nicht mehr fällig)
  await db
    .update(payments)
    .set({ status: "fehlgeschlagen" })
    .where(eq(payments.bookingId, booking.id));

  await db.insert(activityLog).values({
    who: customer.email,
    what: `Buchung ${booking.bookingNumber} storniert vom Kunden — Storno-Gebühr ${fee.percent}% (${formatEuro(fee.feeCents)})${
      reason ? `, Grund: ${reason}` : ""
    }`,
    bookingId: booking.id,
  });

  // Bestätigungs-Mail an Kunde + Intern an Manager
  try {
    await sendMail({
      to: customer.email,
      subject: `Stornierung bestätigt — Buchung ${booking.bookingNumber}`,
      template: "booking_cancelled",
      bookingId: booking.id,
      react: BookingCancelledEmail({
        firstName: customer.firstName,
        bookingNumber: booking.bookingNumber,
        feePercent: fee.percent,
        feeCents: fee.feeCents,
        subtotalCents: booking.subtotalCents,
      }),
      bcc: process.env.MAIL_INTERNAL_TO ?? undefined,
    });
  } catch (err) {
    console.error("[cancel-mail] failed:", err);
  }

  // Hüttenwart informieren (Issue #68) — Buchung aus dem Kalender streichen.
  try {
    await sendMail({
      to: HUETTENWART_EMAIL,
      bcc: HUETTENWART_CC,
      subject: `Stornierung — ${booking.bookingNumber} (${formatDateLong(booking.arrival)})`,
      template: "huettenwart-cancellation",
      bookingId: booking.id,
      react: HuettenwartCancellationEmail({
        bookingNumber: booking.bookingNumber,
        guestName: `${customer.firstName} ${customer.lastName}`.trim(),
        arrival: formatDateLong(booking.arrival),
        departure: formatDateLong(booking.departure),
        persons: booking.persons,
      }),
    });
  } catch (err) {
    console.error("[cancel-mail] Hüttenwart-Mail fehlgeschlagen:", err);
  }

  revalidatePath(`/konto/buchungen/${booking.id}`);
  revalidatePath("/konto");
  return { ok: true };
}

// =============================================================
// Teilnehmerzahl nachmelden (Issue #60) — Gäste können die Personenzahl
// selbst ERHÖHEN (nie verringern), solange die Restzahlung noch nicht
// läuft: ab T-14 zieht der Off-Session-Einzug bzw. geht der Stripe-Link
// raus, daher ist T-15 der letzte Änderungstag. Der Mehrbetrag fließt
// automatisch in die Restzahlung (subtotal ↑ → remainder ↑), es ist
// KEINE separate Zahlung nötig.
// Preis-Delta identisch zum Manager-Editor (editBookingPersons, PR #53):
// personenabhängige Posten frisch rechnen, Extras/Rabatte/Kaution bleiben.
// =============================================================

const INCREASE_CUTOFF_DAYS = 15; // letzter erlaubter Tag: Anreise minus 15 Tage

const increaseSchema = z.object({
  bookingId: z.string().uuid(),
  adults: z.coerce.number().int().min(0).max(60),
  members: z.coerce.number().int().min(0).max(60),
  children: z.coerce.number().int().min(0).max(60),
  pupils: z.coerce.number().int().min(0).max(60),
  teachers: z.coerce.number().int().min(0).max(60),
});

type BookingRow = typeof bookings.$inferSelect;
type CustomerRow = typeof customers.$inferSelect;

function daysUntilArrival(arrivalIso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const arrival = new Date(`${arrivalIso}T00:00:00`);
  return Math.round((arrival.getTime() - today.getTime()) / 86_400_000);
}

/** Prüft, ob die Buchung für eine Gast-Nachmeldung offen ist. */
function increaseBlockedReason(booking: BookingRow): string | null {
  if (booking.status !== "bezahlt" && booking.status !== "bestaetigt") {
    return "Nachmeldungen sind nur bei bestätigten Buchungen möglich.";
  }
  if (daysUntilArrival(booking.arrival) < INCREASE_CUTOFF_DAYS) {
    return "Die Frist ist abgelaufen — ab 14 Tage vor Anreise läuft die Restzahlung. Bitte kontaktiert uns direkt (einfach auf eine unserer Mails antworten).";
  }
  if (booking.paidCents >= booking.subtotalCents) {
    return "Diese Buchung ist bereits vollständig bezahlt. Für zusätzliche Personen kontaktiert uns bitte direkt.";
  }
  return null;
}

async function computeIncrease(
  booking: BookingRow,
  customer: CustomerRow,
  raw: z.infer<typeof increaseSchema>
): Promise<
  | {
      ok: true;
      deltaCents: number;
      newSubtotalCents: number;
      totalPersons: number;
      newPersons: Persons;
      calc: ReturnType<typeof calculatePrice>;
    }
  | { ok: false; error: string }
> {
  const blocked = increaseBlockedReason(booking);
  if (blocked) return { ok: false, error: blocked };

  const newPersons: Persons = {
    adults: raw.adults,
    members: raw.members,
    children: raw.children,
    pupils: raw.pupils,
    teachers: raw.teachers,
  };

  // Nur nach oben — keine Kategorie darf unter den gebuchten Stand fallen.
  if (
    newPersons.adults < booking.adults ||
    newPersons.members < booking.members ||
    newPersons.children < booking.children ||
    newPersons.pupils < booking.pupils ||
    newPersons.teachers < booking.teachers
  ) {
    return { ok: false, error: "Die Teilnehmerzahl kann online nur erhöht werden. Zum Verringern kontaktiert uns bitte direkt." };
  }

  // Mitglieder-Tarif nur für verifizierte Vereinsmitglieder erweiterbar.
  const memberAllowed = customer.membershipStatus === "verified";
  if (newPersons.members > booking.members && !memberAllowed) {
    return { ok: false, error: "Zusätzliche Personen zum Mitgliedstarif können nur verifizierte Vereinsmitglieder anmelden." };
  }

  const totalPersons =
    newPersons.adults + newPersons.members + newPersons.children + newPersons.pupils + newPersons.teachers;
  if (totalPersons <= booking.persons) {
    return { ok: false, error: "Bitte mindestens eine Person hinzufügen." };
  }
  if (totalPersons > RULES.maxPersons) {
    return { ok: false, error: `Die Hütte hat ${RULES.maxPersons} Schlafplätze — mehr Personen sind nicht möglich.` };
  }

  const tariffs = await resolveTariffs(booking.arrival);
  const nb = calculatePrice({
    arrival: booking.arrival,
    departure: booking.departure,
    persons: newPersons,
    soloUse: booking.soloUse,
    tariffs,
  });

  const deltaCents =
    nb.accommodationCents -
    booking.accommodationCents +
    (nb.minOccupancySurchargeCents - booking.minOccupancySurchargeCents) +
    (nb.soloSurchargeCents - booking.soloSurchargeCents);
  if (deltaCents < 0) {
    // Bei reiner Erhöhung nie zu erwarten — defensive Schranke.
    return { ok: false, error: "Unerwartete Preisberechnung — bitte kontaktiert uns direkt." };
  }

  return {
    ok: true,
    deltaCents,
    newSubtotalCents: booking.subtotalCents + deltaCents,
    totalPersons,
    newPersons,
    calc: nb,
  };
}

export type IncreasePreview =
  | { ok: true; deltaCents: number; newSubtotalCents: number; totalPersons: number }
  | { ok: false; error: string };

export async function previewPersonsIncrease(
  raw: z.infer<typeof increaseSchema>
): Promise<IncreasePreview> {
  const parsed = increaseSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe." };
  let owned: Awaited<ReturnType<typeof loadOwnedBooking>>;
  try {
    owned = await loadOwnedBooking(parsed.data.bookingId);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nicht erlaubt." };
  }
  const res = await computeIncrease(owned.booking, owned.customer, parsed.data);
  if (!res.ok) return res;
  return { ok: true, deltaCents: res.deltaCents, newSubtotalCents: res.newSubtotalCents, totalPersons: res.totalPersons };
}

export async function submitPersonsIncrease(
  raw: z.infer<typeof increaseSchema>
): Promise<IncreasePreview> {
  const parsed = increaseSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe." };
  let owned: Awaited<ReturnType<typeof loadOwnedBooking>>;
  try {
    owned = await loadOwnedBooking(parsed.data.bookingId);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nicht erlaubt." };
  }
  const { booking, customer } = owned;
  const res = await computeIncrease(booking, customer, parsed.data);
  if (!res.ok) return res;
  const { deltaCents, newSubtotalCents, totalPersons, newPersons, calc: nb } = res;

  await db
    .update(bookings)
    .set({
      adults: newPersons.adults,
      members: newPersons.members,
      children: newPersons.children,
      pupils: newPersons.pupils,
      teachers: newPersons.teachers,
      persons: totalPersons,
      accommodationCents: nb.accommodationCents,
      minOccupancySurchargeCents: nb.minOccupancySurchargeCents,
      soloSurchargeCents: nb.soloSurchargeCents,
      subtotalCents: newSubtotalCents,
      totalCents: newSubtotalCents,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, booking.id));

  await db.insert(activityLog).values({
    who: customer.email,
    what: `Teilnehmer nachgemeldet (Gast): ${booking.persons} → ${totalPersons} Personen (Erw ${newPersons.adults} · Mitgl ${newPersons.members} · Kind ${newPersons.children} · Schü ${newPersons.pupils} · Lehr ${newPersons.teachers}) — Zwischensumme ${formatEuro(newSubtotalCents)} (+${formatEuro(deltaCents)}), Mehrbetrag fließt in die Restzahlung.`,
    bookingId: booking.id,
  });

  try {
    await sendMail({
      to: customer.email,
      subject: `Teilnehmerzahl aktualisiert — Buchung ${booking.bookingNumber}`,
      template: "persons-increased",
      bookingId: booking.id,
      react: PersonsIncreasedEmail({
        firstName: customer.firstName,
        bookingNumber: booking.bookingNumber,
        arrival: formatDateLong(booking.arrival),
        oldPersons: booking.persons,
        newPersons: totalPersons,
        deltaCents,
        newSubtotalCents,
      }),
      bcc: process.env.MAIL_INTERNAL_TO ?? undefined,
    });
  } catch (err) {
    console.error("[persons-increase-mail] failed:", err);
  }

  revalidatePath(`/konto/buchungen/${booking.id}`);
  revalidatePath("/konto");
  return { ok: true, deltaCents, newSubtotalCents, totalPersons };
}
