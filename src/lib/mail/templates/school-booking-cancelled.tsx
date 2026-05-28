import { Body, Container, Head, Heading, Html, Preview, Section, Text, Hr } from "@react-email/components";

type Props = {
  firstName: string;
  bookingNumber: string;
  institution: string;
  arrival: string;
  departure: string;
  feePercent: number;
  feeCents: number;
};

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
  color: "#A8442A",
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
  color: "#A8442A",
  margin: 0,
};
const text = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "16px",
  lineHeight: 1.55,
  color: "#111111",
  margin: "0 0 12px 0",
};
const muted = { ...text, color: "#5b5b56", fontSize: "14px" };

const eur = (c: number) =>
  (c / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export default function SchoolBookingCancelledEmail({
  firstName,
  bookingNumber,
  institution,
  arrival,
  departure,
  feePercent,
  feeCents,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Buchung {bookingNumber} storniert — Anzahlung nicht eingegangen</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Stornierung</Text>
          <Heading style={heading}>Buchung storniert.</Heading>
          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            für die Buchung <strong>{bookingNumber}</strong> ({institution}, {arrival} bis{" "}
            {departure}) ist die Anzahlung trotz mehrerer Erinnerungen nicht fristgerecht
            eingegangen. Wir mussten die Buchung daher leider stornieren — der Zeitraum ist wieder
            freigegeben.
          </Text>

          <Section
            style={{
              backgroundColor: "#F6E5DF",
              borderLeft: "4px solid #A8442A",
              padding: "16px 20px",
              borderRadius: "12px",
              margin: "20px 0",
            }}
          >
            <Text style={{ ...text, margin: 0 }}>
              Fällige Stornogebühr ({feePercent}%): <strong>{eur(feeCents)}</strong>
            </Text>
            <Text style={{ ...muted, margin: "6px 0 0" }}>
              Gemäß unseren Stornobedingungen wird diese Gebühr fällig. Wir melden uns dazu separat
              bei Euch.
            </Text>
          </Section>

          <Text style={text}>
            War das ein Versehen oder möchtet Ihr neu buchen? Schreibt uns einfach — wir finden
            gemeinsam eine Lösung.
          </Text>
          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>
            Fragen? Antwortet einfach auf diese Mail oder schreibt an hello@wiesenhütte.com.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
