import {
  Body,
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
  arrival: string;
  keySafeCode: string;
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

export default function KeyHandoverEmail({
  firstName,
  bookingNumber,
  arrival,
  keySafeCode,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Schlüssel-Code für Eure Wiesenhütte-Anreise</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Schlüsselübergabe</Text>
          <Heading style={heading}>Morgen geht's los.</Heading>
          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            Eure Anreise ist morgen, am <strong>{arrival}</strong>. Hier der Code für den
            Schlüsselsafe an der Hütte:
          </Text>

          <Section
            style={{
              backgroundColor: "#2F4A35",
              padding: "28px 20px",
              borderRadius: "12px",
              margin: "24px 0",
              textAlign: "center" as const,
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: "38px",
                fontWeight: 700,
                fontFamily: "monospace",
                letterSpacing: "0.15em",
                margin: 0,
              }}
            >
              {keySafeCode}
            </Text>
            <Text
              style={{
                color: "#F7F7F2",
                fontSize: "12px",
                margin: "10px 0 0 0",
                opacity: 0.8,
              }}
            >
              Buchung {bookingNumber}
            </Text>
          </Section>

          <Heading
            style={{ ...heading, fontSize: "18px", marginTop: 24, marginBottom: 8 }}
          >
            Wo ist der Schlüsselsafe?
          </Heading>
          <Text style={text}>
            Rechts neben der Eingangstür, unter dem Carport-Vordach. Code eingeben, Klappe öffnet
            sich, Schlüssel rausnehmen. Bitte den Schlüssel beim Verlassen wieder zurücklegen.
          </Text>

          <Heading
            style={{ ...heading, fontSize: "18px", marginTop: 24, marginBottom: 8 }}
          >
            Beim Ankommen
          </Heading>
          <Text style={text}>
            Strom-Hauptschalter im Flur ist normalerweise an. Heizung über das Bedienpanel im
            Aufenthaltsraum hochfahren — wir haben sie auf Frostschutz gestellt. Wasserhaupthahn im
            Keller. Eine ausführliche Hausordnung hängt im Eingangsbereich.
          </Text>

          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>
            <strong>Notfall-Nummern:</strong> Hüttenwart Werner Klauke 01516 7448273 · Polizei 110
            · Notarzt 112 · Ärztlicher Bereitschaftsdienst 116117 · St. Franziskus Hospital
            Winterberg 02981/8020.
          </Text>
          <Text style={muted}>
            Schöne Tage Euch — und kommt heil an!
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
