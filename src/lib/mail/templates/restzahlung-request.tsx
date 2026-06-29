import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";

type Props = {
  firstName: string;
  bookingNumber: string;
  institution?: string | null;
  arrival: string;
  departure: string;
  remainderCents: number;
  depositCents: number;
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
const muted = { ...text, color: "#5b5b56", fontSize: "14px" };
const button = {
  backgroundColor: "#2F4A35",
  color: "#F7F7F2",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "16px",
  fontWeight: 600,
  textDecoration: "none",
  padding: "14px 28px",
  borderRadius: "10px",
  display: "inline-block",
};

const eur = (c: number) =>
  (c / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export default function RestzahlungRequestEmail({
  firstName,
  bookingNumber,
  institution,
  arrival,
  departure,
  remainderCents,
  depositCents,
  checkoutUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Restzahlung Eurer Buchung {bookingNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Restzahlung</Text>
          <Heading style={heading}>Bitte um Restzahlung.</Heading>
          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            Eure Anreise zur Wiesenhütte rückt näher{institution ? ` (${institution})` : ""} — Zeit
            für die Restzahlung Eurer Buchung <strong>{bookingNumber}</strong> (
            {arrival} bis {departure}).
          </Text>
          <Section
            style={{
              backgroundColor: "#EFE6D8",
              borderLeft: "4px solid #2F4A35",
              padding: "16px 20px",
              borderRadius: "12px",
              margin: "20px 0",
            }}
          >
            <Text style={{ ...text, margin: 0 }}>
              Offener Betrag: <strong>{eur(remainderCents)}</strong>
              <br />
              <span style={{ fontSize: "13px", color: "#5b5b56" }}>
                inkl. {eur(depositCents)} Kaution · Eure Anzahlung von 100,00 € ist bereits
                verrechnet.
              </span>
            </Text>
          </Section>
          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            <Button href={checkoutUrl} style={button}>
              Restbetrag jetzt zahlen
            </Button>
          </Section>
          <Text style={muted}>
            Die Kaution wird innerhalb von 14 Tagen nach mangelfreier Abreise vollständig
            zurückerstattet. Falls der Button nicht funktioniert, nutzt diesen Link:
            <br />
            {checkoutUrl}
          </Text>
          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>
            Fragen? Einfach auf diese E-Mail antworten — Skifreunde Gütersloh e.V.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
