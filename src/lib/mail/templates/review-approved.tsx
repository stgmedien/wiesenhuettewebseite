import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button as EmailButton } from "@react-email/components";

type Props = {
  firstName: string;
  bookingNumber: string;
  arrival: string;
  departure: string;
  prepaymentEuroLabel: string; // bereits formatiert (z. B. "575,00 €")
  checkoutUrl: string;
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

export default function ReviewApprovedEmail({
  firstName,
  bookingNumber,
  arrival,
  departure,
  prepaymentEuroLabel,
  checkoutUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Eure Anfrage wurde freigegeben — bitte Anzahlung leisten</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Freigegeben</Text>
          <Heading style={heading}>Wir freuen uns auf Euch!</Heading>

          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            wir haben Eure Anfrage geprüft und können Euch die Hütte vom{" "}
            <strong>{arrival}</strong> bis <strong>{departure}</strong> zur Verfügung stellen.
          </Text>

          <Text style={text}>
            Damit die Buchung verbindlich wird, bitte jetzt die Anzahlung in Höhe von{" "}
            <strong>{prepaymentEuroLabel}</strong> leisten:
          </Text>

          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <EmailButton href={checkoutUrl} style={button}>
              Jetzt Anzahlung leisten
            </EmailButton>
          </Section>

          <Text style={muted}>
            Falls der Button nicht funktioniert, hier der direkte Link:
            <br />
            <a href={checkoutUrl}>{checkoutUrl}</a>
          </Text>

          <Text style={muted}>
            Buchungsnummer: <strong>{bookingNumber}</strong>. Bei Rückfragen einfach auf diese
            Mail antworten oder an hello@wiesenhütte.com.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
