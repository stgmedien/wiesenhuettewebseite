import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import { CLUB_BANK_DETAILS } from "@/lib/bank-details";
import type { Locale } from "@/lib/i18n-shared";

/**
 * Gast-Mail direkt nach einer Buchung per klassischer Überweisung
 * (paymentMode "manual_transfer"): Kontodaten + Anzahlung + Restzahlungs-
 * Frist. Vorher sah der Gast die Kontodaten nur auf dem Bildschirm
 * (Dana 11/2026, Buchung Leonie Neuhaus). Text von Johannes freigegeben.
 * Kann im Manager auch nachträglich verschickt werden.
 */
type Props = {
  locale?: Locale;
  firstName: string;
  bookingNumber: string;
  arrival: string;
  departure: string;
  anzahlungCents: number;
  restzahlungCents: number;
  restDeadline: string;
};

const T = {
  de: {
    preview: (nr: string) => `Eure Buchung ${nr} – Anzahlung per Überweisung`,
    eyebrow: "Wiesenhütte · Buchung eingegangen",
    heading: "Danke für Eure Buchung!",
    hello: (n: string) => `Hallo ${n},`,
    thanks: (a: string, d: string) => `vielen Dank für Eure Buchung der Wiesenhütte vom ${a} bis ${d}!`,
    pleasePay: "Damit wir die Buchung verbindlich bestätigen können, überweist bitte die Anzahlung von",
    toAccount: "auf folgendes Konto:",
    holder: "Kontoinhaber",
    reference: "Verwendungszweck",
    afterPayment:
      "Sobald die Anzahlung bei uns eingegangen ist, bekommt Ihr die Buchungsbestätigung mit dem Mietvertrag per Mail.",
    rest: (amount: string, deadline: string) =>
      `Die Restzahlung inklusive Kaution und Kurtaxe (${amount}) ist bis ${deadline} fällig. Eine Woche vorher schicken wir Euch automatisch eine Erinnerung mit allen Daten.`,
    bye: "Wir freuen uns auf Euch!",
    team: "Euer Wiesenhütten-Team",
  },
  en: {
    preview: (nr: string) => `Your booking ${nr} – deposit by bank transfer`,
    eyebrow: "Wiesenhütte · Booking received",
    heading: "Thank you for your booking!",
    hello: (n: string) => `Hi ${n},`,
    thanks: (a: string, d: string) => `thank you for booking the Wiesenhütte from ${a} to ${d}!`,
    pleasePay: "To confirm your booking, please transfer the deposit of",
    toAccount: "to the following account:",
    holder: "Account holder",
    reference: "Reference",
    afterPayment:
      "As soon as your deposit has arrived, you will receive the booking confirmation with the rental agreement by email.",
    rest: (amount: string, deadline: string) =>
      `The remaining payment including deposit and tourist tax (${amount}) is due by ${deadline}. One week before, we will automatically send you a reminder with all details.`,
    bye: "We look forward to having you!",
    team: "Your Wiesenhütte team",
  },
  nl: {
    preview: (nr: string) => `Jullie boeking ${nr} – aanbetaling per overschrijving`,
    eyebrow: "Wiesenhütte · Boeking ontvangen",
    heading: "Bedankt voor jullie boeking!",
    hello: (n: string) => `Hallo ${n},`,
    thanks: (a: string, d: string) => `hartelijk dank voor jullie boeking van de Wiesenhütte van ${a} tot ${d}!`,
    pleasePay: "Om de boeking definitief te bevestigen, vragen we jullie de aanbetaling van",
    toAccount: "over te maken op de volgende rekening:",
    holder: "Rekeninghouder",
    reference: "Omschrijving",
    afterPayment:
      "Zodra de aanbetaling bij ons binnen is, ontvangen jullie de boekingsbevestiging met het huurcontract per e-mail.",
    rest: (amount: string, deadline: string) =>
      `De restbetaling inclusief borg en toeristenbelasting (${amount}) moet uiterlijk ${deadline} betaald zijn. Een week van tevoren sturen we jullie automatisch een herinnering met alle gegevens.`,
    bye: "We kijken ernaar uit jullie te ontvangen!",
    team: "Het Wiesenhütte-team",
  },
} as const;

const main = { backgroundColor: "#F7F7F2", padding: "40px 0" };
const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "32px",
  maxWidth: "600px",
  borderRadius: "20px",
};
const heading = {
  fontFamily: "Bricolage Grotesque, system-ui, sans-serif",
  color: "#2F4A35",
  fontSize: "26px",
  fontWeight: 700,
  margin: "0 0 16px 0",
};
const eyebrow = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  color: "#2F4A35",
  margin: 0,
};
const text = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "16px",
  lineHeight: 1.55,
  color: "#111111",
  margin: "0 0 12px 0",
};

const eur = (c: number) => (c / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export const transferRequestSubject = (locale: Locale, bookingNumber: string) =>
  locale === "en"
    ? `Your booking Wiesenhütte ${bookingNumber} – deposit by bank transfer`
    : locale === "nl"
      ? `Jullie boeking Wiesenhütte ${bookingNumber} – aanbetaling per overschrijving`
      : `Eure Buchung Wiesenhütte ${bookingNumber} – Anzahlung per Überweisung`;

export default function BookingTransferRequestEmail({
  locale = "de",
  firstName,
  bookingNumber,
  arrival,
  departure,
  anzahlungCents,
  restzahlungCents,
  restDeadline,
}: Props) {
  const t = T[locale] ?? T.de;
  return (
    <Html>
      <Head />
      <Preview>{t.preview(bookingNumber)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>{t.eyebrow}</Text>
          <Heading style={heading}>{t.heading}</Heading>
          <Text style={text}>{t.hello(firstName)}</Text>
          <Text style={text}>{t.thanks(arrival, departure)}</Text>
          <Text style={text}>
            {t.pleasePay} <strong>{eur(anzahlungCents)}</strong> {t.toAccount}
          </Text>
          <Section
            style={{
              backgroundColor: "#EFE6D8",
              borderLeft: "4px solid #2F4A35",
              padding: "16px 20px",
              borderRadius: "12px",
              margin: "8px 0 20px 0",
            }}
          >
            <Text style={{ ...text, margin: 0 }}>
              {CLUB_BANK_DETAILS.kontoinhaber}
              <br />
              {CLUB_BANK_DETAILS.bank}
              <br />
              IBAN: {CLUB_BANK_DETAILS.iban}
              <br />
              {t.reference}: <strong>{bookingNumber}</strong>
            </Text>
          </Section>
          <Text style={text}>{t.afterPayment}</Text>
          <Text style={text}>{t.rest(eur(restzahlungCents), restDeadline)}</Text>
          <Text style={text}>{t.bye}</Text>
          <Text style={{ ...text, margin: 0 }}>{t.team}</Text>
        </Container>
      </Body>
    </Html>
  );
}
