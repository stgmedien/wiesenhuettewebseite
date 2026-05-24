import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button as EmailButton } from "@react-email/components";

type Props = {
  bookingNumber: string;
  managerUrl: string; // /m/buchungen/[id]
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  arrival: string;
  departure: string;
  persons: number;
  partyType: string;
  reason: string;
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
  fontSize: "24px",
  fontWeight: 700,
  lineHeight: 1.1,
  margin: "0 0 12px 0",
};
const eyebrow = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  color: "#B85C38",
  margin: 0,
};
const text = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "15px",
  lineHeight: 1.55,
  color: "#111111",
  margin: "0 0 8px 0",
};
const muted = { ...text, color: "#5b5b56", fontSize: "13px" };
const button = {
  backgroundColor: "#2F4A35",
  color: "#F7F7F2",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 20px",
  borderRadius: "12px",
  textDecoration: "none",
  display: "inline-block",
};

export default function ReviewPendingInternalEmail(p: Props) {
  return (
    <Html>
      <Head />
      <Preview>Private-Feier-Anfrage zur Prüfung: {p.bookingNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>⚠ Prüfung erforderlich</Text>
          <Heading style={heading}>Private-Feier-Anfrage: {p.bookingNumber}</Heading>

          <Section style={{ backgroundColor: "#EFE6D8", padding: "16px 20px", borderRadius: "12px", margin: "12px 0" }}>
            <Text style={{ ...muted, margin: 0 }}>Anlass</Text>
            <Text style={{ ...text, fontWeight: 600, margin: "2px 0 10px" }}>Private Feier — {p.partyType}</Text>
            <Text style={{ ...muted, margin: 0 }}>Beschreibung</Text>
            <Text style={{ ...text, margin: "2px 0 10px", fontStyle: "italic" }}>„{p.reason}"</Text>
            <Text style={{ ...muted, margin: 0 }}>Zeitraum</Text>
            <Text style={{ ...text, fontWeight: 600, margin: "2px 0 10px" }}>{p.arrival} bis {p.departure}</Text>
            <Text style={{ ...muted, margin: 0 }}>Personen</Text>
            <Text style={{ ...text, fontWeight: 600, margin: "2px 0 10px" }}>{p.persons}</Text>
            <Text style={{ ...muted, margin: 0 }}>Gast</Text>
            <Text style={{ ...text, fontWeight: 600, margin: "2px 0 0" }}>
              {p.guestName} · {p.guestEmail}{p.guestPhone ? ` · ${p.guestPhone}` : ""}
            </Text>
          </Section>

          <Section style={{ textAlign: "center", margin: "20px 0" }}>
            <EmailButton href={p.managerUrl} style={button}>
              Im Manager öffnen + entscheiden
            </EmailButton>
          </Section>

          <Text style={muted}>
            Es wurde noch <strong>keine</strong> Zahlung ausgelöst. Erst nach Deiner Freigabe
            bekommt der Gast den Zahlungslink. Bei Ablehnung erhält er eine Absage und die
            Tage werden wieder freigegeben.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
