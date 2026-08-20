/**
 * Einziger Ort, der beschreibt, was passiert, wenn die Anzahlung einer
 * Buchung als eingegangen gilt — egal ob ausgeloest durch den Stripe-Webhook
 * (Gast zahlt online) oder eine manuelle Bestaetigung im Manager (Gast hat
 * per Ueberweisung direkt an den Verein gezahlt, z. B. weil er selbst keine
 * Stripe-faehige Zahlungsmethode hat).
 *
 * Beide Aufrufer teilen sich diese Funktion, damit eine manuell bestaetigte
 * Zahlung exakt dieselbe Automatik ausloest wie eine online bezahlte:
 * Buchung auf "bezahlt", Rechnung, Gast-Bestaetigung + Mietvertrag,
 * Huettenwart-Info mit iCal-Einladung.
 */

import { db } from "@/lib/db";
import { bookings, customers, payments, activityLog } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { sendMail } from "@/lib/mail/send";
import { wasMailSent } from "@/lib/mail-log";
import { createMagicLinkToken } from "@/lib/magic-link";
import BookingConfirmedEmail from "@/lib/mail/templates/booking-confirmed";
import BookingInternalEmail from "@/lib/mail/templates/booking-internal";
import HuettenwartNewBookingEmail from "@/lib/mail/templates/huettenwart-booking-new";
import WelcomeEmail from "@/lib/mail/templates/welcome";
import { HUETTENWART_EMAIL, HUETTENWART_CC } from "@/lib/huettenwart";
import { buildIcalInvite } from "@/lib/mail/ical";
import { formatDateLong } from "@/lib/utils";
import { createInvoiceForBooking } from "@/lib/invoice";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.wiesenhuette.de";

type BookingRow = typeof bookings.$inferSelect;
type CustomerRow = typeof customers.$inferSelect;
type PmtRow = { kind: string; amountCents: number };

/**
 * Baut die vollstaendigen Props fuer BookingConfirmedEmail — dieselbe Mail
 * dient zugleich als Mietvertrag (§1–§9 im unteren Teil), statt zwei
 * getrennte Mails zu verschicken. Geteilt zwischen der Zahlungsbestaetigung
 * und dem manuellen Statuswechsel-Pfad im Manager, damit beide exakt
 * denselben Vertragsinhalt verschicken.
 */
export function buildBookingConfirmedEmailProps(params: {
  booking: BookingRow;
  customer: CustomerRow;
  paidCents: number;
  pmtRows: PmtRow[];
  kautionDueNow: boolean;
}): Parameters<typeof BookingConfirmedEmail>[0] {
  const { booking, customer, paidCents, pmtRows, kautionDueNow } = params;
  const subtotal = booking.subtotalCents;
  const firstPayment = pmtRows.find((p) => p.kind === "anzahlung" || p.kind === "vollzahlung");
  const restRow = pmtRows.find((p) => p.kind === "restzahlung");
  const prepayment = firstPayment?.amountCents ?? Math.round(subtotal * 0.5);
  const remainder = restRow?.amountCents ?? subtotal - prepayment;
  return {
    bookingNumber: booking.bookingNumber,
    guestName: `${customer.firstName} ${customer.lastName}`.trim(),
    arrival: formatDateLong(booking.arrival),
    departure: formatDateLong(booking.departure),
    nights: booking.nights,
    persons: booking.persons,
    totalCents: booking.subtotalCents,
    depositCents: booking.depositCents,
    kurtaxeCents: booking.kurtaxeCents,
    paidCents,
    kautionDueNow,
    baseUrl,
    customer: {
      firstName: customer.firstName,
      lastName: customer.lastName,
      company: customer.company,
      email: customer.email,
      phone: customer.phone,
      street: customer.street,
      zip: customer.zip,
      city: customer.city,
    },
    personsBreakdown: {
      adults: booking.adults,
      members: booking.members,
      children: booking.children,
      pupils: booking.pupils,
      teachers: booking.teachers,
      total: booking.persons,
    },
    pricing: {
      accommodationCents: booking.accommodationCents,
      energyFlatCents: booking.energyFlatCents,
      cleaningCents: booking.cleaningCents,
      soloSurchargeCents: booking.soloSurchargeCents,
      minOccupancySurchargeCents: booking.minOccupancySurchargeCents,
      subtotalCents: subtotal,
      depositCents: booking.depositCents,
      kurtaxePersons: booking.adults + booking.members + booking.teachers,
      kurtaxeCents: booking.kurtaxeCents,
      prepaymentCents: prepayment,
      remainderCents: remainder,
    },
    signedAt: new Date().toISOString(),
    contractDate: new Date().toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
  };
}

async function sendBookingConfirmedMail(params: {
  booking: BookingRow;
  customer: CustomerRow;
  paidCents: number;
  pmtRows: PmtRow[];
  kautionDueNow: boolean;
}): Promise<void> {
  const { booking, customer } = params;
  await sendMail({
    to: customer.email,
    subject: `Eure Buchung ${booking.bookingNumber} ist bestätigt`,
    template: "booking-confirmed",
    bookingId: booking.id,
    react: BookingConfirmedEmail(buildBookingConfirmedEmailProps(params)),
  });
}

/**
 * Sendet Buchungsbestaetigung + Mietvertrag erneut, mit den AKTUELLEN
 * Kunden-/Buchungsdaten (z. B. nach Korrektur eines Tippfehlers in der
 * E-Mail-Adresse) — unabhaengig davon, ob sie schon (ggf. fehlgeschlagen)
 * verschickt wurden. Fuer den "Erneut senden"-Button im Manager.
 */
export async function resendBookingConfirmationMails(
  bookingId: string
): Promise<{ sent: string[]; errors: string[] }> {
  const booking = (await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1))[0];
  if (!booking) return { sent: [], errors: ["Buchung nicht gefunden"] };
  const customer = booking.customerId
    ? (await db.select().from(customers).where(eq(customers.id, booking.customerId)).limit(1))[0]
    : null;
  if (!customer) return { sent: [], errors: ["Kein Kundendatensatz"] };

  const pmtRows = await db
    .select({ kind: payments.kind, amountCents: payments.amountCents })
    .from(payments)
    .where(eq(payments.bookingId, bookingId));
  const kautionDueNow = pmtRows.some((p) => p.kind === "kaution");

  const sent: string[] = [];
  const errors: string[] = [];

  try {
    await sendBookingConfirmedMail({
      booking,
      customer,
      paidCents: booking.paidCents,
      pmtRows,
      kautionDueNow,
    });
    sent.push("Buchungsbestätigung + Mietvertrag");
  } catch (err) {
    errors.push(`Buchungsbestätigung + Mietvertrag: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { sent, errors };
}

/**
 * Sendet die Willkommens-Mail (Konto + Magic-Link-Login) erneut, mit der
 * AKTUELLEN Kunden-E-Mail (z. B. nach Korrektur eines Tippfehlers) und einem
 * frischen Magic-Link-Token — der urspruengliche ist nach 15 Minuten
 * abgelaufen. Nur sinnvoll, wenn beim Buchen ein Kundenkonto angelegt wurde
 * (customer.userId gesetzt); ohne Konto gab es nie eine Willkommens-Mail zu
 * dieser Buchung.
 */
export async function resendWelcomeMail(bookingId: string): Promise<{ sent: boolean; error?: string }> {
  const booking = (await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1))[0];
  if (!booking) return { sent: false, error: "Buchung nicht gefunden" };
  const customer = booking.customerId
    ? (await db.select().from(customers).where(eq(customers.id, booking.customerId)).limit(1))[0]
    : null;
  if (!customer) return { sent: false, error: "Kein Kundendatensatz" };
  if (!customer.userId) return { sent: false, error: "Zu dieser Buchung wurde kein Kundenkonto angelegt" };

  try {
    const tokenRes = await createMagicLinkToken(customer.email);
    const loginUrl =
      "rateLimited" in tokenRes
        ? `${baseUrl}/konto`
        : `${baseUrl}/auth/magic?token=${encodeURIComponent(tokenRes.token)}`;
    await sendMail({
      to: customer.email,
      subject: "Dein Wiesenhütten-Konto + Buchung",
      template: "welcome_with_booking",
      bookingId,
      react: WelcomeEmail({
        firstName: customer.firstName,
        email: customer.email,
        membershipPending: false,
        loginUrl,
      }),
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export type ConfirmDepositParams = {
  bookingId: string;
  amountCents: number;
  /** Wer/was die Zahlung ausgeloest hat — landet im activityLog. */
  source: "Stripe" | string;
  stripePaymentIntentId?: string | null;
  /** Interne Neue-Buchung-Mail an MAIL_INTERNAL_TO mitsenden? Bei manueller
   * Bestaetigung durch die Person, die MAIL_INTERNAL_TO selbst ist (Dana),
   * i.d.R. nicht noetig — sie weiss es ja bereits. */
  sendInternalNotice?: boolean;
  /** Nur relevant, wenn KEINE offene anzahlung/vollzahlung/kaution-Zeile
   * existiert (z. B. manuell angelegte Buchung ohne Stripe-Checkout) — dann
   * legt die Funktion selbst eine neue "erhalten"-Zeile an, damit jeder Euro
   * einen Zahlungs-Eintrag hat. */
  fallbackPaymentMethod?: string;
  /** Art dieser Fallback-Zeile — "anzahlung" (Standard) oder "vollzahlung"
   * (z. B. kurzfristige Buchung < 14 Tage vor Anreise). Nur relevant im
   * Fallback-Insert-Fall, siehe fallbackPaymentMethod. */
  fallbackPaymentKind?: "anzahlung" | "vollzahlung";
};

/**
 * Markiert die Anzahlung einer Buchung als eingegangen und stoesst die
 * volle Folge-Automatik an: Buchung → "bezahlt", offene Anzahlung/Kaution-
 * Zeilen → "erhalten", Rechnung erstellen, Gast- und Huettenwart-Mails.
 *
 * Rueht bewusst NUR Zahlungszeilen der Kategorien anzahlung/vollzahlung/
 * kaution an (nicht restzahlung) — eine spaeter faellige Restzahlung darf
 * dadurch nie versehentlich als bezahlt gelten.
 */
export async function confirmDepositPayment(params: ConfirmDepositParams): Promise<void> {
  const {
    bookingId,
    amountCents,
    source,
    stripePaymentIntentId = null,
    sendInternalNotice = true,
    fallbackPaymentMethod = "Manuell bestätigt",
    fallbackPaymentKind = "anzahlung",
  } = params;

  const booking = (await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1))[0];
  if (!booking) throw new Error("Buchung nicht gefunden");

  await db
    .update(bookings)
    .set({
      status: "bezahlt",
      paidCents: amountCents,
      stripePaymentIntentId,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId));

  const openDepositRows = await db
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.bookingId, bookingId),
        eq(payments.status, "offen"),
        inArray(payments.kind, ["anzahlung", "vollzahlung", "kaution"])
      )
    );
  if (openDepositRows.length > 0) {
    await db
      .update(payments)
      .set({ status: "erhalten", receivedAt: new Date(), stripePaymentIntentId })
      .where(
        inArray(
          payments.id,
          openDepositRows.map((r) => r.id)
        )
      );
  } else {
    // Keine vorbereitete Zahlungszeile (z. B. manuell angelegte Buchung ohne
    // Stripe-Checkout) — trotzdem einen Zahlungs-Eintrag anlegen, damit jeder
    // Euro im System einen nachvollziehbaren Ursprung hat.
    await db.insert(payments).values({
      bookingId,
      kind: fallbackPaymentKind,
      status: "erhalten",
      amountCents,
      method: fallbackPaymentMethod,
      stripePaymentIntentId,
      receivedAt: new Date(),
    });
  }

  await db.insert(activityLog).values({
    who: source,
    what: `Anzahlung erhalten — Buchung ${booking.bookingNumber} bestätigt (${(amountCents / 100).toFixed(2)} €)`,
    bookingId,
  });

  if (booking.voucherId && booking.voucherDiscountCents > 0) {
    try {
      const { markVoucherRedeemed } = await import("@/lib/voucher-redeem");
      await markVoucherRedeemed(booking.voucherId, booking.id, booking.voucherDiscountCents);
      await db.insert(activityLog).values({
        who: source,
        what: `Gutschein eingelöst — ${(booking.voucherDiscountCents / 100).toFixed(2)} € für Buchung ${booking.bookingNumber}`,
        bookingId,
      });
    } catch (err) {
      console.error("[confirmDepositPayment] voucher redemption tracking failed (non-blocking):", err);
    }
  }

  try {
    const inv = await createInvoiceForBooking(bookingId);
    if (inv.isNew) {
      await db.insert(activityLog).values({
        who: "System",
        what: `Rechnung ${inv.invoiceNumber} ausgestellt`,
        bookingId,
      });
    }
  } catch (err) {
    console.error("[confirmDepositPayment] invoice creation failed (non-blocking):", err);
  }

  const customer = booking.customerId
    ? (await db.select().from(customers).where(eq(customers.id, booking.customerId)).limit(1))[0]
    : null;

  if (!customer) return;
  const guestName = `${customer.firstName} ${customer.lastName}`.trim();

  const pmtRows = await db
    .select({ kind: payments.kind, amountCents: payments.amountCents })
    .from(payments)
    .where(eq(payments.bookingId, bookingId));
  const kautionDueNow = pmtRows.some((p) => p.kind === "kaution");

  if (!(await wasMailSent(bookingId, "booking-confirmed"))) {
    try {
      await sendBookingConfirmedMail({
        booking,
        customer,
        paidCents: amountCents,
        pmtRows,
        kautionDueNow,
      });
    } catch (err) {
      console.error("[confirmDepositPayment] customer mail failed", err);
    }
  }

  if (sendInternalNotice) {
    const internalTo = process.env.MAIL_INTERNAL_TO;
    if (internalTo && !(await wasMailSent(bookingId, "booking-internal"))) {
      try {
        await sendMail({
          to: internalTo,
          subject: `📌 Neue Buchung ${booking.bookingNumber} — ${guestName}`,
          template: "booking-internal",
          bookingId,
          react: BookingInternalEmail({
            bookingNumber: booking.bookingNumber,
            guestName,
            guestEmail: customer.email,
            guestPhone: customer.phone,
            arrival: formatDateLong(booking.arrival),
            departure: formatDateLong(booking.departure),
            nights: booking.nights,
            persons: booking.persons,
            customerType: customer.type,
            totalCents: booking.subtotalCents,
            paidCents: amountCents,
            managerUrl: `${baseUrl}/m/buchungen/${bookingId}`,
            notes: booking.customerMessage ?? undefined,
          }),
        });
      } catch (err) {
        console.error("[confirmDepositPayment] internal mail failed", err);
      }
    }
  }

  if (!(await wasMailSent(bookingId, "huettenwart-booking-new"))) {
    try {
      await sendMail({
        to: HUETTENWART_EMAIL,
        bcc: HUETTENWART_CC,
        subject: `Neue Buchung eingegangen — ${booking.bookingNumber} (${formatDateLong(booking.arrival)})`,
        template: "huettenwart-booking-new",
        bookingId,
        attachments: [
          buildIcalInvite({
            bookingId,
            bookingNumber: booking.bookingNumber,
            guestName,
            arrival: booking.arrival,
            departure: booking.departure,
            persons: booking.persons,
          }),
        ],
        react: HuettenwartNewBookingEmail({
          bookingNumber: booking.bookingNumber,
          guestName,
          arrival: formatDateLong(booking.arrival),
          departure: formatDateLong(booking.departure),
          nights: booking.nights,
          persons: booking.persons,
          purpose: booking.purpose,
          managerUrl: `${baseUrl}/m/buchungen/${bookingId}`,
        }),
      });
    } catch (err) {
      console.error("[confirmDepositPayment] huettenwart mail failed", err);
    }
  }
}
