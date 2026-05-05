import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button as EmailButton,
} from "@react-email/components";

type Props = {
  guestName: string;
  bookingNumber: string;
  arrival: string;
  departure: string;
  adultsForKurtaxe: number;
  kurtaxePortalUrl: string;
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

export default function KurtaxeInfoEmail({
  guestName,
  bookingNumber,
  arrival,
  departure,
  adultsForKurtaxe,
  kurtaxePortalUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Bitte Kurtaxe Hochsauerland separat anmelden</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Skifreunde Gütersloh e.V.</Text>
          <Heading style={heading}>Noch ein wichtiger Schritt: Kurtaxe</Heading>

          <Text style={text}>Hallo {guestName},</Text>
          <Text style={text}>
            die Kurtaxe Hochsauerland wird seit Mai 2026 nicht mehr über uns abgerechnet, sondern
            direkt über das offizielle Kurtaxen-Portal Hochsauerland. Bitte registriere Eure
            Gruppe vor Anreise dort — andernfalls fällt vor Ort eine erhöhte Pauschale an.
          </Text>

          <Section style={{ backgroundColor: "#EFE6D8", padding: "16px 20px", borderRadius: "12px", margin: "16px 0" }}>
            <Text style={{ ...muted, margin: 0 }}>Buchung</Text>
            <Text style={{ ...text, fontWeight: 600, margin: "4px 0 12px" }}>{bookingNumber}</Text>
            <Text style={{ ...muted, margin: 0 }}>Zeitraum</Text>
            <Text style={{ ...text, fontWeight: 600, margin: "4px 0 12px" }}>
              {arrival} bis {departure}
            </Text>
            <Text style={{ ...muted, margin: 0 }}>Anzumeldende Personen ab 16 Jahren</Text>
            <Text style={{ ...text, fontWeight: 600, margin: "4px 0 0" }}>{adultsForKurtaxe}</Text>
          </Section>

          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <EmailButton href={kurtaxePortalUrl} style={button}>
              Zum Kurtaxen-Portal Hochsauerland
            </EmailButton>
          </Section>

          <Text style={muted}>
            Falls der Button nicht funktioniert, hier der direkte Link:
            <br />
            <a href={kurtaxePortalUrl}>{kurtaxePortalUrl}</a>
          </Text>

          <Text style={muted}>
            Bei Fragen einfach auf diese Mail antworten — wir helfen weiter.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
