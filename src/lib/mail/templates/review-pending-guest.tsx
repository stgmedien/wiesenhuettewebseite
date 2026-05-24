import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

type Props = {
  firstName: string;
  bookingNumber: string;
  arrival: string;
  departure: string;
  partyType: string; // gelabelter Subtyp ("JGA", "runder Geburtstag", …)
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

export default function ReviewPendingGuestEmail({
  firstName,
  bookingNumber,
  arrival,
  departure,
  partyType,
  reason,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Wir prüfen Eure Anfrage zur privaten Feier</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Skifreunde Gütersloh e.V.</Text>
          <Heading style={heading}>Eure Anfrage liegt vor — wir prüfen sie.</Heading>

          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            danke für Eure Buchungsanfrage! Da es sich um eine <strong>private Feier</strong>
            handelt, schaut der Vorstand der Skifreunde Gütersloh e.V. nochmal kurz drauf,
            bevor die Buchung verbindlich wird. Wir melden uns in der Regel innerhalb
            <strong> 48 Stunden</strong> mit der Rückmeldung.
          </Text>

          <Section style={{ backgroundColor: "#EFE6D8", padding: "16px 20px", borderRadius: "12px", margin: "16px 0" }}>
            <Text style={{ ...muted, margin: 0 }}>Buchung</Text>
            <Text style={{ ...text, fontWeight: 600, margin: "4px 0 12px" }}>{bookingNumber}</Text>
            <Text style={{ ...muted, margin: 0 }}>Zeitraum</Text>
            <Text style={{ ...text, fontWeight: 600, margin: "4px 0 12px" }}>
              {arrival} bis {departure}
            </Text>
            <Text style={{ ...muted, margin: 0 }}>Anlass</Text>
            <Text style={{ ...text, fontWeight: 600, margin: "4px 0 12px" }}>
              Private Feier — {partyType}
            </Text>
            <Text style={{ ...muted, margin: 0 }}>Eure Beschreibung</Text>
            <Text style={{ ...text, margin: "4px 0 0", fontStyle: "italic" }}>„{reason}"</Text>
          </Section>

          <Text style={text}>
            Wichtig: Es wurde noch <strong>nichts gezahlt</strong>. Sobald wir freigegeben haben,
            bekommst Du eine Mail mit dem Zahlungslink für die Anzahlung. Falls wir absagen
            müssen, erklären wir kurz warum.
          </Text>

          <Text style={muted}>
            Bei Rückfragen einfach auf diese Mail antworten — oder direkt an
            hello@wiesenhütte.com.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
