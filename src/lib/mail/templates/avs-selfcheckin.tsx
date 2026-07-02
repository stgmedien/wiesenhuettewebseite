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
  guestName: string;
  bookingNumber: string;
  arrival: string;
  departure: string;
  /** Individueller AVS-SelfCheck-in-Link (im Manager eingetragen). */
  checkinUrl: string;
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
  color: "#F7F7F2",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "16px",
  fontWeight: 600,
  textDecoration: "none",
  padding: "14px 28px",
  borderRadius: "10px",
  display: "inline-block",
};

export default function AvsSelfCheckinEmail({
  guestName,
  bookingNumber,
  arrival,
  departure,
  checkinUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Euer digitaler Check-in für die Wiesenhütte — bitte vor der Anreise ausfüllen</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Digitaler Check-in</Text>
          <Heading style={heading}>Bitte vor der Anreise ausfüllen.</Heading>
          <Text style={text}>Hallo {guestName},</Text>
          <Text style={text}>
            vielen Dank für Eure Buchung <strong>{bookingNumber}</strong> ({arrival} bis{" "}
            {departure})! Vor der Anreise füllt bitte <strong>unbedingt</strong> den digitalen
            Meldeschein aus. Das Ausfüllen ist <strong>gesetzlich vorgeschrieben</strong>{" "}
            (Meldepflicht und Kurbeitrag) und damit für jede Buchung verpflichtend — es dauert nur
            wenige Minuten:
          </Text>
          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            <Button href={checkinUrl} style={button}>
              Digitalen Meldeschein ausfüllen
            </Button>
          </Section>
          <Text style={muted}>Falls der Button nicht funktioniert: {checkinUrl}</Text>
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
              <strong>Gut zu wissen:</strong>
              <br />– Es genügt, wenn Du als Buchende:r die Daten ausfüllst — Mitreisende werden
              nur in Anzahl erfasst.
              <br />– Eure <strong>Kurkarten</strong> bekommt Ihr anschließend automatisch per
              E-Mail von AVS zugesendet — bitte zur Anreise mitbringen (digital oder ausgedruckt).
            </Text>
          </Section>
          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>
            Fragen? Einfach auf diese E-Mail antworten — Skifreunde Gütersloh e.V.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
