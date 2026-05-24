import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

type Props = {
  firstName: string;
  bookingNumber: string;
  arrival: string;
  departure: string;
  rejectionReason?: string | null;
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

export default function ReviewRejectedEmail({
  firstName,
  bookingNumber,
  arrival,
  departure,
  rejectionReason,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Eure Anfrage zur privaten Feier — Rückmeldung</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Skifreunde Gütersloh e.V.</Text>
          <Heading style={heading}>Wir können Eure Anfrage leider nicht annehmen.</Heading>

          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            danke für Eure Buchungsanfrage für den Zeitraum <strong>{arrival}</strong> bis{" "}
            <strong>{departure}</strong> (Buchung {bookingNumber}). Nach Rücksprache im Vorstand
            können wir Eure Anfrage diesmal <strong>nicht annehmen</strong>.
          </Text>

          {rejectionReason && rejectionReason.trim() ? (
            <Section style={{ backgroundColor: "#EFE6D8", padding: "16px 20px", borderRadius: "12px", margin: "16px 0" }}>
              <Text style={{ ...muted, margin: 0 }}>Grund</Text>
              <Text style={{ ...text, margin: "4px 0 0", fontStyle: "italic" }}>„{rejectionReason}"</Text>
            </Section>
          ) : null}

          <Text style={text}>
            Es wurde <strong>nichts gezahlt</strong> — Ihr müsst nichts weiter veranlassen. Die
            Tage werden wieder freigegeben.
          </Text>

          <Text style={muted}>
            Bei Rückfragen gerne direkt an den Vorstand: hello@wiesenhütte.com. Wir wünschen Euch
            trotzdem eine schöne Zeit.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
