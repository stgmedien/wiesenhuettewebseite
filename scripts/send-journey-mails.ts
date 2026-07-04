/**
 * EINMAL-TEST: löst alle Mails aus, die ein Kunde auf seinem Buchungsweg
 * erhält, und schickt sie mit Beispieldaten an das Support-Postfach.
 *
 * Lauf:  npx tsx --env-file=.env.local scripts/send-journey-mails.ts
 *
 * Reihenfolge = chronologischer Buchungsweg eines Gastes:
 *   1. welcome            – Buchungseingang + Konto-Zugang
 *   2. magic-link         – Login-Link fürs Kundenkonto
 *   3. booking-confirmed  – Buchungsbestätigung nach Zahlung
 *   4. mietvertrag        – Mietvertrag (PDF-Ersatz im Body)
 *   5. kurtaxe-info       – Kurtaxe-Hinweis (wir melden uns separat)
 *   6. payment-reminder   – Erinnerung Restzahlung
 *   7. arrival-info       – Anreise-Infos
 *   8. feedback-request   – Feedback nach dem Aufenthalt
 *   9. booking-cancelled  – Stornierung
 *  10. deposit-hold       – Kaution einbehalten
 *  11. deposit-refunded   – Kaution zurückerstattet
 */

import { sendMail } from "@/lib/mail/send";
import WelcomeEmail from "@/lib/mail/templates/welcome";
import MagicLinkEmail from "@/lib/mail/templates/magic-link";
import BookingConfirmedEmail from "@/lib/mail/templates/booking-confirmed";
import MietvertragEmail from "@/lib/mail/templates/mietvertrag";
import KurtaxeInfoEmail from "@/lib/mail/templates/kurtaxe-info";
import PaymentReminderEmail from "@/lib/mail/templates/payment-reminder";
import ArrivalInfoEmail from "@/lib/mail/templates/arrival-info";
import FeedbackRequestEmail from "@/lib/mail/templates/feedback-request";
import BookingCancelledEmail from "@/lib/mail/templates/booking-cancelled";
import DepositHoldEmail from "@/lib/mail/templates/deposit-hold";
import DepositRefundedEmail from "@/lib/mail/templates/deposit-refunded";

// Punycode-Domain für SMTP-Zustellung (IONOS, IDN-sicher)
const TO = "support@xn--wiesenhtte-geb.com";
const BASE = "https://xn--wiesenhtte-geb.com";
const P = "[TEST – Buchungsweg]";

const customer = {
  salutation: "Herr",
  firstName: "Max",
  lastName: "Mustermann",
  company: null,
  email: "max.mustermann@example.com",
  phone: "+49 170 1234567",
  street: "Musterstraße 1",
  zip: "33330",
  city: "Gütersloh",
};

const jobs: { name: string; subject: string; react: React.ReactElement }[] = [
  {
    name: "welcome",
    subject: `${P} Willkommen – Eure Buchung WH-TEST-0001`,
    react: WelcomeEmail({
      firstName: "Max",
      email: customer.email,
      membershipPending: false,
      loginUrl: `${BASE}/login`,
    }),
  },
  {
    name: "magic-link",
    subject: `${P} Euer Login-Link`,
    react: MagicLinkEmail({ url: `${BASE}/auth/magic?token=TESTTOKEN`, expiresMinutes: 30 }),
  },
  {
    name: "booking-confirmed",
    subject: `${P} Buchungsbestätigung WH-TEST-0001`,
    react: BookingConfirmedEmail({
      bookingNumber: "WH-TEST-0001",
      guestName: "Max Mustermann",
      arrival: "20.02.2026",
      departure: "23.02.2026",
      nights: 3,
      persons: 18,
      totalCents: 115000,
      depositCents: 30000,
      paidCents: 57500,
      baseUrl: BASE,
    }),
  },
  {
    name: "mietvertrag",
    subject: `${P} Euer Mietvertrag WH-TEST-0001`,
    react: MietvertragEmail({
      bookingNumber: "WH-TEST-0001",
      arrival: "20.02.2026",
      departure: "23.02.2026",
      nights: 3,
      customer,
      persons: { adults: 12, members: 2, children: 0, pupils: 18, teachers: 2, total: 18 },
      pricing: {
        accommodationCents: 90000,
        energyFlatCents: 15000,
        cleaningCents: 8000,
        soloSurchargeCents: 0,
        minOccupancySurchargeCents: 0,
        subtotalCents: 115000,
        depositCents: 30000,
        prepaymentCents: 57500,
        remainderCents: 57500,
      },
      signedAt: new Date().toISOString(),
      contractDate: "16. Mai 2026",
    }),
  },
  {
    name: "kurtaxe-info",
    subject: `${P} Kurtaxe-Hinweis WH-TEST-0001`,
    react: KurtaxeInfoEmail({
      guestName: "Max Mustermann",
      bookingNumber: "WH-TEST-0001",
      arrival: "20.02.2026",
      departure: "23.02.2026",
    }),
  },
  {
    name: "payment-reminder",
    subject: `${P} Erinnerung: Restzahlung WH-TEST-0001`,
    react: PaymentReminderEmail({
      firstName: "Max",
      bookingNumber: "WH-TEST-0001",
      arrival: "20.02.2026",
      remainderCents: 57500,
      daysUntilArrival: 14,
      paymentLink: `${BASE}/konto/buchungen`,
      autoChargePlanned: false,
    }),
  },
  {
    name: "arrival-info",
    subject: `${P} Anreise-Infos WH-TEST-0001`,
    react: ArrivalInfoEmail({
      firstName: "Max",
      bookingNumber: "WH-TEST-0001",
      arrival: "20.02.2026",
      departure: "23.02.2026",
      persons: 18,
      nights: 3,
    }),
  },
  {
    name: "feedback-request",
    subject: `${P} Wie war euer Aufenthalt?`,
    react: FeedbackRequestEmail({
      firstName: "Max",
      bookingNumber: "WH-TEST-0001",
      feedbackUrl: `${BASE}/feedback/TESTTOKEN`,
    }),
  },
  {
    name: "booking-cancelled",
    subject: `${P} Stornierung WH-TEST-0001`,
    react: BookingCancelledEmail({
      firstName: "Max",
      bookingNumber: "WH-TEST-0001",
      feePercent: 50,
      feeCents: 57500,
      baseCents: 115000,
      baseLabel: "Übernachtungspreis",
    }),
  },
  {
    name: "deposit-hold",
    subject: `${P} Kaution einbehalten WH-TEST-0001`,
    react: DepositHoldEmail({
      guestName: "Max Mustermann",
      bookingNumber: "WH-TEST-0001",
      arrival: "20.02.2026",
      departure: "23.02.2026",
      depositCents: 30000,
      reason: "Beispiel-Grund (Testlauf): Reinigung über das übliche Maß hinaus.",
      baseUrl: BASE,
    }),
  },
  {
    name: "deposit-refunded",
    subject: `${P} Kaution zurückerstattet WH-TEST-0001`,
    react: DepositRefundedEmail({
      guestName: "Max Mustermann",
      bookingNumber: "WH-TEST-0001",
      arrival: "20.02.2026",
      departure: "23.02.2026",
      refundCents: 30000,
      baseUrl: BASE,
    }),
  },
];

async function main() {
  console.log(`Sende ${jobs.length} Buchungsweg-Mails an ${TO}\n`);
  let ok = 0;
  const failed: string[] = [];
  for (const [i, job] of jobs.entries()) {
    try {
      await sendMail({
        to: TO,
        subject: job.subject,
        template: `journeytest-${job.name}`,
        react: job.react,
      });
      ok++;
      console.log(`  ✓ ${String(i + 1).padStart(2, "0")}/${jobs.length}  ${job.name}`);
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      failed.push(`${job.name}: ${m}`);
      console.error(`  ✗ ${String(i + 1).padStart(2, "0")}/${jobs.length}  ${job.name} — ${m}`);
    }
    await new Promise((r) => setTimeout(r, 1200)); // SMTP nicht überfahren
  }
  console.log(`\nFertig: ${ok}/${jobs.length} gesendet.`);
  if (failed.length) {
    console.log("Fehlgeschlagen:\n  " + failed.join("\n  "));
    process.exit(1);
  }
  process.exit(0);
}

main();
