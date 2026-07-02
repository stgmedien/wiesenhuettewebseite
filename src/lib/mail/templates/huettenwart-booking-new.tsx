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
  bookingNumber: string;
  guestName: string;
  arrival: string;
  departure: string;
  nights: number;
  persons: number;
  purpose?: string | null;
  managerUrl: string;
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
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
  padding: "12px 24px",
  borderRadius: "10px",
  display: "inline-block",
};

export default function HuettenwartNewBookingEmail({
  bookingNumber,
  guestName,
  arrival,
  departure,
  nights,
  persons,
  purpose,
  managerUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Neue Buchung {bookingNumber} — {arrival}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Hüttenservice</Text>
          <Heading style={heading}>Neue Buchung eingegangen.</Heading>
          <Text style={text}>Hallo Herr Klauke, liebe Fam. Brandenburg,</Text>
          <Text style={text}>
            die Anzahlung ist da — diese Buchung ist damit fest und kann eingeplant werden:
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
              Buchung: <strong>{bookingNumber}</strong>
              <br />
              Gast: <strong>{guestName}</strong>
              <br />
              Zeitraum: <strong>{arrival} – {departure}</strong> ({nights} {nights === 1 ? "Nacht" : "Nächte"})
              <br />
              Personen: <strong>{persons}</strong>
              {purpose ? (
                <>
                  <br />
                  Anlass: <strong>{purpose}</strong>
                </>
              ) : null}
            </Text>
          </Section>
          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <Button href={managerUrl} style={button}>
              Buchung im Portal ansehen
            </Button>
          </Section>
          <Text style={muted}>
            7 Tage vor der Anreise kommt wie gewohnt die Erinnerung für Übergabe/Abnahme.
          </Text>
          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>Skifreunde Gütersloh e.V. · automatische Benachrichtigung</Text>
        </Container>
      </Body>
    </Html>
  );
}
