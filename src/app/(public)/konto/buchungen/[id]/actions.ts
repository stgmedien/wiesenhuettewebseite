"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { bookings, customers, activityLog, payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { cancellationFeeForBooking, formatEuro, calculatePrice, PRICES, RULES, type Persons } from "@/lib/pricing";
import { resolveBookingTariffs, resolveTariffs } from "@/lib/pricing-tariffs";
import { isRangeAvailable, BOOKING_BLOCKS_TAG } from "@/lib/availability";
import { notifyWaitlistForRange } from "@/lib/waitlist";
import { formatDateLong } from "@/lib/utils";
import { sendMail } from "@/lib/mail/send";
import BookingCancelledEmail from "@/lib/mail/templates/booking-cancelled";
import PersonsIncreasedEmail from "@/lib/mail/templates/persons-increased";
import BookingExtendedEmail from "@/lib/mail/templates/booking-extended";
import BookingExtendedInternalEmail from "@/lib/mail/templates/booking-extended-internal";
import BookingExtendedKurkartenReminderEmail from "@/lib/mail/templates/booking-extended-kurkarten-reminder";
import HuettenwartCancellationEmail from "@/lib/mail/templates/huettenwart-cancellation";
import { HUETTENWART_EMAIL, HUETTENWART_CC } from "@/lib/huettenwart";
import { buildIcalCancel } from "@/lib/mail/ical";

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

  const fee = cancellationFeeForBooking(booking);

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

  // Warteliste: freigewordenen Zeitraum prüfen, ggf. Interessenten
  // benachrichtigen (best-effort, crasht den Storno nie).
  await notifyWaitlistForRange(booking.arrival, booking.departure);

  // Bestätigungs-Mail an Kunde + Intern an Manager
  try {
    await sendMail({
      to: customer.email,
      subject: `Stornierung bestätigt — Buchung ${booking.bookingNumber}`,
      template: "booking-cancelled",
      bookingId: booking.id,
      react: BookingCancelledEmail({
        firstName: customer.firstName,
        bookingNumber: booking.bookingNumber,
        feePercent: fee.percent,
        feeCents: fee.feeCents,
        baseCents: fee.baseCents,
        baseLabel: fee.isLegacy ? "Buchungssumme (ohne Kaution)" : "Übernachtungspreis",
      }),
      bcc: process.env.MAIL_INTERNAL_TO ?? undefined,
    });
  } catch (err) {
    console.error("[cancel-mail] failed:", err);
  }

  // Hüttenwart informieren (Issue #68) — nur wenn Zahlung eingegangen ist.
  if (booking.paidCents > 0) try {
    await sendMail({
      to: HUETTENWART_EMAIL,
      bcc: HUETTENWART_CC,
      subject: `Stornierung — ${booking.bookingNumber} (${formatDateLong(booking.arrival)})`,
      template: "huettenwart-cancellation",
      bookingId: booking.id,
      attachments: [buildIcalCancel({
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        guestName: `${customer.firstName} ${customer.lastName}`.trim(),
        arrival: booking.arrival,
        departure: booking.departure,
        persons: booking.persons,
      })],
      react: HuettenwartCancellationEmail({
        bookingNumber: booking.bookingNumber,
        guestName: `${customer.firstName} ${customer.lastName}`.trim(),
        arrival: formatDateLong(booking.arrival),
        departure: formatDateLong(booking.departure),
        persons: booking.persons,
      }),
    });
  } catch (err) {
    console.error("[cancel-mail] Hüttenservice-Mail fehlgeschlagen:", err);
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
      kurtaxeDeltaCents: number;
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

  // Mitglieder-Tarif (Erwachsene UND Kinder/Schüler · Mitglied) nur für
  // verifizierte Vereinsmitglieder erweiterbar.
  const memberAllowed = customer.membershipStatus === "verified";
  if (
    (newPersons.members > booking.members || newPersons.pupils > booking.pupils) &&
    !memberAllowed
  ) {
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

  const tariffs = await resolveBookingTariffs(booking);
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
  // Kurtaxe ist NICHT Teil von subtotalCents (eigene Spalte) — trotzdem muss
  // sie bei mehr kurtaxenpflichtigen Personen (ab 16 J.) mit steigen, sonst
  // wird sie fuer die neu gemeldeten Gaeste nie erhoben und der Verein zahlt
  // die Differenz an Winterberg aus eigener Tasche.
  const kurtaxeDeltaCents = nb.kurtaxeCents - booking.kurtaxeCents;
  if (deltaCents < 0) {
    // Bei reiner Erhöhung nie zu erwarten — defensive Schranke.
    return { ok: false, error: "Unerwartete Preisberechnung — bitte kontaktiert uns direkt." };
  }

  return {
    ok: true,
    deltaCents,
    kurtaxeDeltaCents,
    newSubtotalCents: booking.subtotalCents + deltaCents,
    totalPersons,
    newPersons,
    calc: nb,
  };
}

export type IncreasePreview =
  | { ok: true; deltaCents: number; kurtaxeDeltaCents: number; newSubtotalCents: number; totalPersons: number }
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
  return {
    ok: true,
    deltaCents: res.deltaCents,
    kurtaxeDeltaCents: res.kurtaxeDeltaCents,
    newSubtotalCents: res.newSubtotalCents,
    totalPersons: res.totalPersons,
  };
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
  const { deltaCents, kurtaxeDeltaCents, newSubtotalCents, totalPersons, newPersons, calc: nb } = res;

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
      kurtaxeCents: nb.kurtaxeCents,
      subtotalCents: newSubtotalCents,
      totalCents: newSubtotalCents,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, booking.id));

  await db.insert(activityLog).values({
    who: customer.email,
    what: `Teilnehmer nachgemeldet (Gast): ${booking.persons} → ${totalPersons} Personen (Erw ${newPersons.adults} · Mitgl ${newPersons.members} · Kind ${newPersons.children} · Schü ${newPersons.pupils} · Lehr ${newPersons.teachers}) — Zwischensumme ${formatEuro(newSubtotalCents)} (+${formatEuro(deltaCents)}), Kurtaxe +${formatEuro(kurtaxeDeltaCents)}, Mehrbetrag fließt in die Restzahlung.`,
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
        kurtaxeDeltaCents,
        newSubtotalCents,
      }),
      bcc: process.env.MAIL_INTERNAL_TO ?? undefined,
    });
  } catch (err) {
    console.error("[persons-increase-mail] failed:", err);
  }

  revalidatePath(`/konto/buchungen/${booking.id}`);
  revalidatePath("/konto");
  return { ok: true, deltaCents, kurtaxeDeltaCents, newSubtotalCents, totalPersons };
}

// =============================================================
// GAST-SELBSTVERLÄNGERUNG (bis T-16): Gast kann online zusätzliche Nächte
// anhängen (Abreise nach hinten verschieben). Der Mehrbetrag fließt in die
// Restzahlung (T-14) — keine Sofortzahlung, keine neue Kaution/Endreinigung
// (beide sind pauschal pro Aufenthalt). Zusätzliche Nächte werden IMMER zum
// aktuellen Tarif berechnet — auch bei Alt-Verträgen mit Preis-Sperre gilt
// die nur für die ursprünglich gebuchten Nächte, nicht für die Verlängerung.
// =============================================================

const EXTENSION_CUTOFF_DAYS = 16; // letzter erlaubter Tag: Anreise minus 16 Tage
const EXTENSION_MAX_NIGHTS = 14; // grobe Plausibilitäts-Schranke gegen Fehleingaben

const extendSchema = z.object({
  bookingId: z.string().uuid(),
  extraNights: z.coerce.number().int().min(1).max(EXTENSION_MAX_NIGHTS),
});

function addDaysToIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Prüft, ob die Buchung für eine Gast-Selbstverlängerung offen ist. */
function extensionBlockedReason(booking: BookingRow): string | null {
  if (booking.status !== "bezahlt" && booking.status !== "bestaetigt") {
    return "Eine Verlängerung ist nur bei bestätigten Buchungen möglich.";
  }
  if (daysUntilArrival(booking.arrival) < EXTENSION_CUTOFF_DAYS) {
    return "Die Frist ist abgelaufen — ab 16 Tage vor Anreise ist eine Online-Verlängerung nicht mehr möglich. Bitte kontaktiert uns direkt (einfach auf eine unserer Mails antworten).";
  }
  return null;
}

type ExtensionCalc = {
  newDeparture: string;
  newNights: number;
  accommodationDeltaCents: number;
  minOccupancySurchargeDeltaCents: number;
  kurtaxeDeltaCents: number;
  deltaCents: number;
  newSubtotalCents: number;
  kurtaxePersons: number;
};

async function computeExtension(
  booking: BookingRow,
  raw: z.infer<typeof extendSchema>
): Promise<{ ok: true; calc: ExtensionCalc } | { ok: false; error: string }> {
  const blocked = extensionBlockedReason(booking);
  if (blocked) return { ok: false, error: blocked };

  const newDeparture = addDaysToIso(booking.departure, raw.extraNights);
  const available = await isRangeAvailable(
    { arrival: booking.arrival, departure: newDeparture },
    booking.id
  );
  if (!available) {
    return {
      ok: false,
      error:
        "Für den verlängerten Zeitraum ist die Hütte leider schon belegt. Bitte kontaktiert uns direkt.",
    };
  }

  // Bewusst IMMER aktuelle Tarife (nicht resolveBookingTariffs) — zusätzliche
  // Nächte sind neues Geschäft, auch bei Alt-Verträgen mit Preis-Sperre.
  const tariffs = await resolveTariffs(booking.arrival);
  const currentPersons: Persons = {
    adults: booking.adults,
    members: booking.members,
    children: booking.children,
    pupils: booking.pupils,
    teachers: booking.teachers,
  };
  // Alt/Neu über calculatePrice statt Handrechnung, damit der
  // Mindestbelegungs-Aufschlag (< 15 Personen) für die zusätzlichen Nächte
  // korrekt mitskaliert wird (sonst würden kleine Gruppen bei einer
  // Verlängerung zu wenig zahlen — cleaningCents/soloSurchargeCents sind
  // pauschal und heben sich in der Differenz von selbst auf).
  const oldCalc = calculatePrice({
    arrival: booking.arrival,
    departure: booking.departure,
    persons: currentPersons,
    soloUse: booking.soloUse,
    tariffs,
  });
  const newCalc = calculatePrice({
    arrival: booking.arrival,
    departure: newDeparture,
    persons: currentPersons,
    soloUse: booking.soloUse,
    tariffs,
  });
  const accommodationDeltaCents = newCalc.accommodationCents - oldCalc.accommodationCents;
  const minOccupancySurchargeDeltaCents =
    newCalc.minOccupancySurchargeCents - oldCalc.minOccupancySurchargeCents;

  const kurtaxePersons = booking.adults + booking.members + booking.teachers;
  const kurtaxeDeltaCents = kurtaxePersons * raw.extraNights * PRICES.kurtaxeRateCents;

  return {
    ok: true,
    calc: {
      newDeparture,
      newNights: booking.nights + raw.extraNights,
      accommodationDeltaCents,
      minOccupancySurchargeDeltaCents,
      kurtaxeDeltaCents,
      deltaCents: accommodationDeltaCents + minOccupancySurchargeDeltaCents + kurtaxeDeltaCents,
      newSubtotalCents:
        booking.subtotalCents + accommodationDeltaCents + minOccupancySurchargeDeltaCents,
      kurtaxePersons,
    },
  };
}

export type ExtensionPreview =
  | { ok: true; calc: ExtensionCalc }
  | { ok: false; error: string };

export async function previewBookingExtension(
  raw: z.infer<typeof extendSchema>
): Promise<ExtensionPreview> {
  const parsed = extendSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe." };
  let owned: Awaited<ReturnType<typeof loadOwnedBooking>>;
  try {
    owned = await loadOwnedBooking(parsed.data.bookingId);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nicht erlaubt." };
  }
  return computeExtension(owned.booking, parsed.data);
}

export async function submitBookingExtension(
  raw: z.infer<typeof extendSchema>
): Promise<ExtensionPreview> {
  const parsed = extendSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe." };
  let owned: Awaited<ReturnType<typeof loadOwnedBooking>>;
  try {
    owned = await loadOwnedBooking(parsed.data.bookingId);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nicht erlaubt." };
  }
  const { booking, customer } = owned;
  const res = await computeExtension(booking, parsed.data);
  if (!res.ok) return res;
  const {
    newDeparture,
    newNights,
    accommodationDeltaCents,
    minOccupancySurchargeDeltaCents,
    kurtaxeDeltaCents,
    deltaCents,
    newSubtotalCents,
    kurtaxePersons,
  } = res.calc;

  await db
    .update(bookings)
    .set({
      departure: newDeparture,
      nights: newNights,
      accommodationCents: booking.accommodationCents + accommodationDeltaCents,
      minOccupancySurchargeCents:
        booking.minOccupancySurchargeCents + minOccupancySurchargeDeltaCents,
      kurtaxeCents: booking.kurtaxeCents + kurtaxeDeltaCents,
      subtotalCents: newSubtotalCents,
      totalCents: newSubtotalCents,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, booking.id));

  await db.insert(activityLog).values({
    who: customer.email,
    what: `Aufenthalt verlängert (Gast): Abreise ${booking.departure} → ${newDeparture} (+${raw.extraNights} Nächte) — Zwischensumme ${formatEuro(newSubtotalCents)} (+${formatEuro(accommodationDeltaCents + minOccupancySurchargeDeltaCents)}), Kurtaxe +${formatEuro(kurtaxeDeltaCents)}. Mehrbetrag fließt in die Restzahlung. Kurkarten müssen manuell bei Winterberg nachgemeldet werden.`,
    bookingId: booking.id,
  });

  revalidateTag(BOOKING_BLOCKS_TAG, "max");

  try {
    await sendMail({
      to: customer.email,
      subject: `Aufenthalt verlängert — Buchung ${booking.bookingNumber}`,
      template: "booking-extended",
      bookingId: booking.id,
      react: BookingExtendedEmail({
        firstName: customer.firstName,
        bookingNumber: booking.bookingNumber,
        oldDeparture: formatDateLong(booking.departure),
        newDeparture: formatDateLong(newDeparture),
        extraNights: raw.extraNights,
        deltaCents,
        newSubtotalCents,
      }),
    });
  } catch (err) {
    console.error("[booking-extended-mail] failed:", err);
  }

  try {
    await sendMail({
      to: process.env.MAIL_INTERNAL_TO ?? HUETTENWART_EMAIL,
      bcc: [HUETTENWART_EMAIL, HUETTENWART_CC].filter(Boolean).join(",") || undefined,
      subject: `Aufenthalt verlängert — Buchung ${booking.bookingNumber}`,
      template: "booking-extended-internal",
      bookingId: booking.id,
      react: BookingExtendedInternalEmail({
        bookingNumber: booking.bookingNumber,
        guestName: `${customer.firstName} ${customer.lastName}`.trim(),
        oldDeparture: formatDateLong(booking.departure),
        newDeparture: formatDateLong(newDeparture),
        extraNights: raw.extraNights,
        deltaCents,
      }),
    });
  } catch (err) {
    console.error("[booking-extended-internal-mail] failed:", err);
  }

  try {
    await sendMail({
      to: process.env.MAIL_KURKARTEN_TO ?? "johannesleiskau@gmail.com",
      subject: `Kurkarten nachmelden — Buchung ${booking.bookingNumber} verlängert`,
      template: "booking-extended-kurkarten-reminder",
      bookingId: booking.id,
      react: BookingExtendedKurkartenReminderEmail({
        bookingNumber: booking.bookingNumber,
        guestName: `${customer.firstName} ${customer.lastName}`.trim(),
        oldDeparture: formatDateLong(booking.departure),
        newDeparture: formatDateLong(newDeparture),
        extraNights: raw.extraNights,
        kurtaxePersons,
      }),
    });
  } catch (err) {
    console.error("[booking-extended-kurkarten-mail] failed:", err);
  }

  revalidatePath(`/konto/buchungen/${booking.id}`);
  revalidatePath("/konto");
  revalidatePath("/m/dashboard");
  return { ok: true, calc: res.calc };
}
