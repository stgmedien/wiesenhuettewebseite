import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Props = {
  guestName: string;
  bookingNumber: string;
  arrival: string;
  departure: string;
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

export default function KurtaxeInfoEmail({
  guestName,
  bookingNumber,
  arrival,
  departure,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Zur Kurtaxe melden wir uns separat bei euch</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Skifreunde Gütersloh e.V.</Text>
          <Heading style={heading}>Kurtaxe Hochsauerland</Heading>

          <Text style={text}>Hallo {guestName},</Text>
          <Text style={text}>
            für Euren Aufenthalt fällt die Kurtaxe (Kurbeitrag) des Hochsauerlandkreises an.
            Die Abrechnung läuft bei uns aktuell noch nicht automatisiert — deshalb melden wir
            uns dazu in den nächsten Tagen separat persönlich bei Euch und sagen Euch genau,
            was zu tun ist.
          </Text>

          <Section style={{ backgroundColor: "#EFE6D8", padding: "16px 20px", borderRadius: "12px", margin: "16px 0" }}>
            <Text style={{ ...muted, margin: 0 }}>Buchung</Text>
            <Text style={{ ...text, fontWeight: 600, margin: "4px 0 12px" }}>{bookingNumber}</Text>
            <Text style={{ ...muted, margin: 0 }}>Zeitraum</Text>
            <Text style={{ ...text, fontWeight: 600, margin: "4px 0 12px" }}>
              {arrival} bis {departure}
            </Text>
            <Text style={{ ...muted, margin: 0 }}>Aktueller Tarif Langewiese</Text>
            <Text style={{ ...text, fontWeight: 600, margin: "4px 0 0" }}>
              2,20 € pro Person und Nacht
            </Text>
          </Section>

          <Text style={text}>
            Ihr müsst jetzt nichts weiter veranlassen — wir kommen aktiv auf Euch zu.
          </Text>

          <Text style={muted}>
            Bei Fragen einfach auf diese Mail antworten — wir helfen weiter.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
