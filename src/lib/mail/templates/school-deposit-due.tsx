import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button as EmailButton } from "@react-email/components";

type Props = {
  firstName: string;
  bookingNumber: string;
  institution: string;
  arrival: string;
  departure: string;
  prepaymentEuroLabel: string; // 50 % Anzahlung, bereits formatiert
  checkoutUrl: string;
  deadlineLabel: string; // Zahlungsfrist (A-16, formatiert)
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
  color: "#2F4A35",
  fontSize: "28px",
  fontWeight: 700,
  lineHeight: 1.05,
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
const muted = { ...text, color: "#5b5b56", fontSize: "14px" };
const button = {
  backgroundColor: "#2F4A35",
  color: "#F7F7F2",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "16px",
  fontWeight: 600,
  padding: "14px 24px",
  borderRadius: "14px",
  textDecoration: "none",
  display: "inline-block",
};

export default function SchoolDepositDueEmail({
  firstName,
  bookingNumber,
  institution,
  arrival,
  departure,
  prepaymentEuroLabel,
  checkoutUrl,
  deadlineLabel,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Anzahlung für Eure Hüttenfahrt jetzt fällig</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Anzahlung fällig</Text>
          <Heading style={heading}>Jetzt die Anzahlung leisten.</Heading>

          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            Eure Hüttenfahrt für <strong>{institution}</strong> ({arrival} bis {departure}) rückt
            näher. Damit die Buchung verbindlich bleibt, ist jetzt die Anzahlung in Höhe von{" "}
            <strong>{prepaymentEuroLabel}</strong> fällig.
          </Text>

          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <EmailButton href={checkoutUrl} style={button}>
              Jetzt Anzahlung leisten
            </EmailButton>
          </Section>

          <Text style={text}>
            Bitte zahlt <strong>bis spätestens {deadlineLabel}</strong>. Wird die Anzahlung nicht
            fristgerecht beglichen, fällt eine Stornogebühr an und die Buchung wird storniert.
          </Text>

          <Text style={muted}>
            Falls der Button nicht funktioniert, hier der direkte Link:
            <br />
            <a href={checkoutUrl}>{checkoutUrl}</a>
          </Text>

          <Text style={muted}>
            Buchungsnummer: <strong>{bookingNumber}</strong>. Die Restzahlung wird 14 Tage vor
            Anreise automatisch eingezogen. Bei Fragen einfach auf diese Mail antworten.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
