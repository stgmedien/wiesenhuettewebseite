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
  departure: string;
  persons: number;
  nights: number;
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

export default function ArrivalInfoEmail({
  firstName,
  bookingNumber,
  arrival,
  departure,
  persons,
  nights,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Eure Anreise zur Wiesenhütte in 7 Tagen</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Anreise-Info</Text>
          <Heading style={heading}>Bald geht's los.</Heading>
          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            in einer Woche fahrt Ihr zur Wiesenhütte. Hier alles Wichtige für die Anreise auf einen
            Blick.
          </Text>

          <Section
            style={{
              backgroundColor: "#EFE6D8",
              borderRadius: "12px",
              padding: "16px 20px",
              margin: "20px 0",
            }}
          >
            <Text style={{ ...text, margin: 0 }}>
              <strong>Buchung:</strong> {bookingNumber}
              <br />
              <strong>Anreise:</strong> {arrival}
              <br />
              <strong>Abreise:</strong> {departure}
              <br />
              <strong>Belegung:</strong> {persons} Personen · {nights} Nächte
            </Text>
          </Section>

          <Heading
            style={{ ...heading, fontSize: "20px", marginTop: 28, marginBottom: 8 }}
          >
            Adresse
          </Heading>
          <Text style={text}>
            Wiesenhütte, Wiesenhütte 1, 59955 Winterberg-Langewiese
          </Text>

          <Heading
            style={{ ...heading, fontSize: "20px", marginTop: 28, marginBottom: 8 }}
          >
            Anfahrt
          </Heading>
          <Text style={text}>
            <strong>Mit dem Auto:</strong> A46 → Abfahrt Bestwig → B480 nach Winterberg →
            Langewiese. Parkplätze vor der Hütte. Im Winter ggf. Schneeketten erforderlich. Bei
            unsicheren Bedingungen oben an der Bundesstraße parken und zu Fuß runter.
          </Text>
          <Text style={text}>
            <strong>Mit dem ÖPNV:</strong> ZOB Winterberg, von dort Bus R28 nach Langewiese,
            Haltestelle „Wiesenhütte".
          </Text>

          <Heading
            style={{ ...heading, fontSize: "20px", marginTop: 28, marginBottom: 8 }}
          >
            Was Ihr mitbringen solltet
          </Heading>
          <Text style={text}>
            Bettwäsche oder Schlafsack, Handtücher, Hausschuhe, Lebensmittel für die Selbstversorgung,
            Spülmittel, Geschirrtücher, Müllsäcke. Brennholz ist vor Ort.
          </Text>

          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>
            Schlüsselübergabe regeln wir persönlich mit dem Hüttenwart Toni Klauke — er nimmt
            Euch an der Hütte in Empfang. Notfall-Telefon Toni Klauke: 01516 7448273. Bei
            Fragen: hello@wiesenhütte.com.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
