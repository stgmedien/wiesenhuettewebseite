import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from "@react-email/components";
import { formatEuro } from "@/lib/pricing";

type Props = {
  bookingNumber: string;
  guestName: string;
  arrival: string;
  departure: string;
  nights: number;
  persons: number;
  totalCents: number;
  depositCents: number;
  paidCents: number;
  baseUrl: string;
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
  fontSize: "32px",
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
const muted = { ...text, color: "#5b5b56" };
const cardWarm = {
  backgroundColor: "#EFE6D8",
  padding: "20px",
  borderRadius: "12px",
  margin: "16px 0",
};
const label = { ...muted, fontSize: "13px", margin: "0 0 4px 0" };
const value = { ...text, fontWeight: 600, margin: 0 };

export default function BookingConfirmedEmail({
  bookingNumber,
  guestName,
  arrival,
  departure,
  nights,
  persons,
  totalCents,
  depositCents,
  paidCents,
  baseUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Eure Buchung in der Wiesenhütte ist bestätigt</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Skifreunde Gütersloh e.V.</Text>
          <Heading style={heading}>Eure Buchung ist bestätigt.</Heading>
          <Text style={text}>Hallo {guestName},</Text>
          <Text style={text}>
            wir freuen uns, dass ihr in die Wiesenhütte kommt. Hier die Übersicht eurer Buchung:
          </Text>

          <Section style={cardWarm}>
            <Row>
              <Column>
                <Text style={label}>Buchungsnummer</Text>
                <Text style={value}>{bookingNumber}</Text>
              </Column>
              <Column>
                <Text style={label}>Personen</Text>
                <Text style={value}>{persons}</Text>
              </Column>
            </Row>
            <Hr style={{ borderColor: "#C8CEC4", margin: "12px 0" }} />
            <Row>
              <Column>
                <Text style={label}>Anreise</Text>
                <Text style={value}>{arrival}</Text>
              </Column>
              <Column>
                <Text style={label}>Abreise</Text>
                <Text style={value}>{departure}</Text>
              </Column>
              <Column>
                <Text style={label}>Nächte</Text>
                <Text style={value}>{nights}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={cardWarm}>
            <Row>
              <Column>
                <Text style={label}>Übernachtung & Pauschalen</Text>
                <Text style={value}>{formatEuro(totalCents)}</Text>
              </Column>
              <Column>
                <Text style={label}>Kaution</Text>
                <Text style={value}>{formatEuro(depositCents)}</Text>
              </Column>
              <Column>
                <Text style={label}>Bereits bezahlt</Text>
                <Text style={value}>{formatEuro(paidCents)}</Text>
              </Column>
            </Row>
          </Section>

          <Heading as="h3" style={{ ...heading, fontSize: "20px", margin: "24px 0 8px 0" }}>
            Was als Nächstes passiert
          </Heading>
          <Text style={text}>
            Eine Woche vor eurer Anreise schicken wir euch alle Anfahrtsdetails, die Hausordnung
            und Infos zur Schlüsselübergabe. Falls ihr vorher Fragen habt, antwortet einfach auf
            diese Mail.
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
            <Text style={{ ...text, fontWeight: 700, margin: "0 0 8px 0" }}>
              Wichtig: Die Personenzahl kann nur noch erhöht, nicht verringert werden.
            </Text>
            <Text style={{ ...text, margin: 0 }}>
              Auch wenn einzelne Teilnehmer kurzfristig ausfallen, bleibt der volle
              Übernachtungspreis fällig. Unser Tipp: Kalkuliert lieber knapp — zusätzliche
              Personen könnt ihr bis 15 Tage vor Anreise jederzeit bequem selbst über euer
              Konto nachbuchen und direkt bezahlen:{" "}
              <a href={`${baseUrl}/konto`} style={{ color: "#2F4A35" }}>
                {baseUrl}/konto
              </a>
            </Text>
          </Section>

          <Heading as="h3" style={{ ...heading, fontSize: "20px", margin: "24px 0 8px 0" }}>
            Falls ihr stornieren müsst
          </Heading>
          <Text style={text}>
            Wir verstehen, dass sich Pläne ändern. Die Storno-Staffel gilt für den reinen
            Übernachtungspreis (vom Anreisetag rückwärts gerechnet) — Endreinigung und Kaution
            werden im Stornofall nicht fällig:
          </Text>
          <Text style={{ ...text, margin: "0 0 4px 0" }}>
            • <strong>Mehr als 30 Tage vorher:</strong> kostenlos
          </Text>
          <Text style={{ ...text, margin: "0 0 4px 0" }}>
            • <strong>30 bis 14 Tage vorher:</strong> 50 % Stornogebühr
          </Text>
          <Text style={{ ...text, margin: "0 0 12px 0" }}>
            • <strong>Weniger als 14 Tage vorher:</strong> 100 % Stornogebühr
          </Text>

          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px 0" }} />
          <Text style={muted}>
            Wiesenhütte · Skifreunde Gütersloh e.V. · Langewiese, Hochsauerland
            <br />
            <a href={baseUrl}>{baseUrl}</a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
