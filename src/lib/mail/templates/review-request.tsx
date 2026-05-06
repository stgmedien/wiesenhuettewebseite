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
  reviewUrl: string;
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
  color: "#ffffff",
  padding: "14px 24px",
  borderRadius: "999px",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-block",
};

export default function ReviewRequestEmail({
  firstName,
  bookingNumber,
  reviewUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Wie war's an der Wiesenhütte?</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Feedback</Text>
          <Heading style={heading}>Wie war's bei Euch?</Heading>
          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            wir hoffen, Ihr seid gut zurück und hattet eine schöne Zeit an der Wiesenhütte.
          </Text>
          <Text style={text}>
            Eine kurze Rückmeldung ist Gold wert — sowohl für andere Gäste, die noch überlegen, als
            auch für uns: Was hat geklappt? Was sollte besser werden? Hast Du einen Schaden
            entdeckt? Drei Minuten reichen.
          </Text>
          <Section style={{ margin: "28px 0" }}>
            <Button style={button} href={reviewUrl}>
              Feedback geben
            </Button>
          </Section>
          <Text style={muted}>
            Buchung {bookingNumber} · Die Kaution ist innerhalb von 14 Tagen nach Abreise wieder
            auf Deinem Konto, falls noch nicht da.
          </Text>
          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>
            Danke, dass Ihr bei uns wart. Wir freuen uns aufs nächste Mal.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
