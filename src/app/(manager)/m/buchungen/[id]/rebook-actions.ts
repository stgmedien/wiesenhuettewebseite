"use server";

/**
 * Umbuchen — Buchung auf einen anderen Zeitraum verschieben, statt sie nur
 * zu stornieren. Entstanden aus zwei Faellen (Bambana, Soeldenwagner), bei
 * denen "stornieren + manuell neu anlegen" die urspruenglichen Konditionen
 * verloren hat und per Hand (SQL) nachgezogen werden musste. Dieses Tool
 * macht denselben Vorgang sicher und in einem Schritt:
 *
 *  - "Altvertrag": die neue Buchung uebernimmt die urspruenglichen
 *    Personenpreise (entweder die schon vorhandenen legacy*Cents-Spalten,
 *    oder — falls keine gesetzt sind — die Tarife, die zum urspruenglichen
 *    Anreisedatum galten) UND das urspruengliche createdAt, damit auch die
 *    Storno-Staffel (CANCELLATION_POLICY_CUTOFF) unveraendert weitergilt.
 *  - "Neuvertrag": komplett frische Konditionen zum neuen Zeitraum, wie eine
 *    neue manuelle Buchung.
 *
 * Kaution/Kurtaxe/Endreinigung sind in beiden Modi immer aktuell (dafuer
 * gibt es keinen Alt-Mechanismus, siehe legacy*Cents-Spalten-Kommentar in
 * schema.ts) -- nur die Uebernachtungs-Personenpreise werden bei
 * "Altvertrag" fest fortgeschrieben.
 */

import { z } from "zod";
import { db } from "@/lib/db";
import { bookings, payments, activityLog, invoices } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { MANUAL_REST_MARKER } from "@/lib/payment-markers";
import { auth } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { BOOKING_BLOCKS_TAG, isRangeAvailable } from "@/lib/availability";
import { calculatePrice, validateBookingInput, type Persons } from "@/lib/pricing";
import { resolveTariffs } from "@/lib/pricing-tariffs";
import { createInvoiceForBooking } from "@/lib/invoice";
import { generateBookingNumber, formatDateLong } from "@/lib/utils";

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") throw new Error("Nicht autorisiert");
  return session!;
}

const schema = z.object({
  bookingId: z.string().uuid(),
  newArrival: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newDeparture: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mode: z.enum(["altvertrag", "neuvertrag"]),
});

export type RebookResult =
  | { ok: true; newBookingId: string; newBookingNumber: string }
  | { ok: false; error: string };

const NOT_REBOOKABLE = new Set(["storniert", "abgereist", "angereist"]);

export async function rebookBooking(raw: z.infer<typeof schema>): Promise<RebookResult> {
  const session = await requireManager();
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const { bookingId, newArrival, newDeparture, mode } = parsed.data;

  const found = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  const old = found[0];
  if (!old) return { ok: false, error: "Buchung nicht gefunden." };
  if (NOT_REBOOKABLE.has(old.status)) {
    return { ok: false, error: `Buchung im Status „${old.status}" kann nicht umgebucht werden.` };
  }

  const persons: Persons = {
    adults: old.adults,
    members: old.members,
    children: old.children,
    pupils: old.pupils,
    teachers: old.teachers,
  };

  const issues = validateBookingInput({
    arrival: newArrival,
    departure: newDeparture,
    persons,
    soloUse: old.soloUse,
  });
  if (issues.length > 0) {
    return { ok: false, error: issues.map((i) => i.message).join(" ") };
  }

  const free = await isRangeAvailable(
    { arrival: newArrival, departure: newDeparture },
    old.id
  );
  if (!free) return { ok: false, error: "Neuer Zeitraum ist bereits belegt." };

  const hasExistingLegacy =
    old.legacyNichtmitgliedCents !== null ||
    old.legacyMitgliedCents !== null ||
    old.legacyKindCents !== null ||
    old.legacySchuelerCents !== null;

  let legacyCols: {
    legacyNichtmitgliedCents: number | null;
    legacyMitgliedCents: number | null;
    legacyKindCents: number | null;
    legacySchuelerCents: number | null;
  };
  let tariffsOverride: Awaited<ReturnType<typeof resolveTariffs>> | undefined;
  let newCreatedAt: Date;

  if (mode === "altvertrag") {
    if (hasExistingLegacy) {
      // Buchung war schon ein Alt-Vertrag (z.B. Papier-Mietvertrag-Uebernahme)
      // -- die fest vereinbarten Preise 1:1 uebernehmen.
      legacyCols = {
        legacyNichtmitgliedCents: old.legacyNichtmitgliedCents,
        legacyMitgliedCents: old.legacyMitgliedCents,
        legacyKindCents: old.legacyKindCents,
        legacySchuelerCents: old.legacySchuelerCents,
      };
      tariffsOverride = {
        nichtmitglied: old.legacyNichtmitgliedCents ?? 0,
        mitglied: old.legacyMitgliedCents ?? 0,
        kind: old.legacyKindCents ?? 0,
        schueler: old.legacySchuelerCents ?? 0,
        lehrer: old.legacyNichtmitgliedCents ?? 0,
        seasonName: null,
      };
    } else {
      // Normale Portal-Buchung: die Tarife, die zum URSPRUENGLICHEN
      // Anreisedatum galten, jetzt als Alt-Vertrag festschreiben.
      const original = await resolveTariffs(old.arrival);
      tariffsOverride = original;
      legacyCols = {
        legacyNichtmitgliedCents: original.nichtmitglied,
        legacyMitgliedCents: original.mitglied,
        legacyKindCents: original.kind,
        legacySchuelerCents: original.schueler,
      };
    }
    // Urspruengliches Buchungsdatum bleibt erhalten, damit
    // cancellationFeeForBooking() weiter die zum damaligen Zeitpunkt
    // vereinbarte Storno-Staffel anwendet.
    newCreatedAt = old.createdAt;
  } else {
    legacyCols = {
      legacyNichtmitgliedCents: null,
      legacyMitgliedCents: null,
      legacyKindCents: null,
      legacySchuelerCents: null,
    };
    tariffsOverride = undefined;
    newCreatedAt = new Date();
  }

  const breakdown = calculatePrice({
    arrival: newArrival,
    departure: newDeparture,
    persons,
    soloUse: old.soloUse,
    tariffs: tariffsOverride,
  });

  const newBookingNumber = generateBookingNumber();
  const who = session.user?.name ?? session.user?.email ?? "Manager";

  const result = await db.transaction(async (tx) => {
    // Alte, noch aktive Rechnung stornieren (bleibt als Beleg erhalten).
    const activeInvoices = await tx
      .select({ id: invoices.id, invoiceNumber: invoices.invoiceNumber, notes: invoices.notes })
      .from(invoices)
      .where(and(eq(invoices.bookingId, old.id), ne(invoices.status, "storniert")));
    for (const inv of activeInvoices) {
      await tx
        .update(invoices)
        .set({
          status: "storniert",
          updatedAt: new Date(),
          notes: `${inv.notes ? inv.notes + "\n\n" : ""}STORNIERT — Buchung umgebucht auf ${newBookingNumber}.`,
        })
        .where(eq(invoices.id, inv.id));
    }

    await tx
      .update(bookings)
      .set({
        status: "storniert",
        internalNotes: [
          old.internalNotes,
          `Umgebucht auf ${newBookingNumber} (${formatDateLong(newArrival)} – ${formatDateLong(newDeparture)}), Modus: ${mode === "altvertrag" ? "Alt-Vertrag (Konditionen übernommen)" : "Neu-Vertrag (aktuelle Konditionen)"}.`,
        ]
          .filter(Boolean)
          .join("\n\n"),
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, old.id));

    const inserted = await tx
      .insert(bookings)
      .values({
        bookingNumber: newBookingNumber,
        customerId: old.customerId,
        status: "bestaetigt",
        arrival: newArrival,
        departure: newDeparture,
        nights: breakdown.nights,
        adults: old.adults,
        members: old.members,
        children: old.children,
        pupils: old.pupils,
        teachers: old.teachers,
        persons: old.persons,
        purpose: old.purpose,
        institution: old.institution,
        accommodationCents: breakdown.accommodationCents,
        kurtaxeCents: breakdown.kurtaxeCents,
        energyFlatCents: breakdown.energyFlatCents,
        cleaningCents: breakdown.cleaningCents,
        soloSurchargeCents: breakdown.soloSurchargeCents,
        minOccupancySurchargeCents: breakdown.minOccupancySurchargeCents,
        extrasCents: breakdown.extrasCents,
        subtotalCents: breakdown.subtotalCents,
        depositCents: breakdown.depositCents,
        totalCents: breakdown.subtotalCents,
        paidCents: old.paidCents,
        cleaningOptedIn: old.cleaningOptedIn,
        soloUse: old.soloUse,
        source: "Manuell",
        // Self-Check-in-Link ist an den Gast gebunden, nicht an Datum/
        // Personenzahl -- kann unveraendert weiterverwendet werden (siehe
        // Kommentar an avsCheckinLink in schema.ts). Kurkarten-PDF und
        // Feuerwehr-Meldeliste dagegen NICHT uebernehmen: die haengen an
        // den konkreten (jetzt geaenderten) Anreise-/Personendaten und
        // muessen fuer den neuen Zeitraum frisch erzeugt werden.
        avsCheckinLink: old.avsCheckinLink,
        ...legacyCols,
        createdAt: newCreatedAt,
        internalNotes: `Umgebucht von ${old.bookingNumber} (ursprünglich ${formatDateLong(old.arrival)} – ${formatDateLong(old.departure)}), Modus: ${mode === "altvertrag" ? "Alt-Vertrag (Konditionen übernommen)" : "Neu-Vertrag (aktuelle Konditionen)"}.`,
      })
      .returning({ id: bookings.id });
    const newBookingId = inserted[0].id;

    // Bereits erhaltene Zahlungen gehoeren zur neuen Buchung, nicht zur
    // stornierten alten -- Zahlungshistorie umhaengen statt verwaist zu
    // lassen.
    await tx
      .update(payments)
      .set({ bookingId: newBookingId })
      .where(eq(payments.bookingId, old.id));

    // Eine noch offene Altsystem-Restzahlung (siehe payment-markers.ts) traegt
    // den ALTEN Betrag -- ohne Anpassung wuerde die T-21-Erinnerungsmail
    // (daily-mail-jobs) spaeter den falschen (zu hohen/niedrigen) Betrag
    // fuers neue Datum/Personenzahl verschicken. Neu berechnen: neue Summe
    // (inkl. Kaution/Kurtaxe) minus bereits Bezahltes.
    const newRemainderCents = Math.max(
      0,
      breakdown.subtotalCents + breakdown.depositCents + breakdown.kurtaxeCents - old.paidCents
    );
    await tx
      .update(payments)
      .set({ amountCents: newRemainderCents })
      .where(
        and(
          eq(payments.bookingId, newBookingId),
          eq(payments.method, MANUAL_REST_MARKER),
          eq(payments.status, "offen")
        )
      );

    await tx.insert(activityLog).values([
      {
        who,
        what: `Buchung ${old.bookingNumber} umgebucht auf ${newBookingNumber} (${mode})`,
        bookingId: old.id,
      },
      {
        who,
        what: `Umgebucht von ${old.bookingNumber} — ${formatDateLong(newArrival)} bis ${formatDateLong(newDeparture)}, Modus: ${mode}`,
        bookingId: newBookingId,
      },
    ]);

    await createInvoiceForBooking(newBookingId, tx);

    return { newBookingId };
  });

  revalidatePath(`/m/buchungen/${old.id}`);
  revalidatePath(`/m/buchungen/${result.newBookingId}`);
  revalidatePath("/m/buchungen");
  revalidatePath("/m/dashboard");
  revalidatePath("/m/kalender");
  revalidateTag(BOOKING_BLOCKS_TAG, "max");

  return { ok: true, newBookingId: result.newBookingId, newBookingNumber };
}
