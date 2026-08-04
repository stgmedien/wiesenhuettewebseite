import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";

type Props = {
  firstName: string;
  bookingNumber: string;
  arrival: string;
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

export default function KurkartenReadyEmail({ firstName, bookingNumber, arrival }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Eure Kurkarten für die Wiesenhütte sind da</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Skifreunde Gütersloh e.V.</Text>
          <Heading style={heading}>Eure Kurkarten sind da.</Heading>
          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            im Anhang findet Ihr Eure Kurkarten für die Buchung {bookingNumber} (Anreise am{" "}
            {arrival}) — bitte zur Anreise mitbringen, digital oder ausgedruckt. Falls Euch kein
            Drucker zur Verfügung steht, bringt Toni Klauke sie Euch auf Rückfrage auch gerne
            ausgedruckt mit.
          </Text>

          <Hr style={{ borderColor: "#C8CEC4", margin: "28px 0 16px" }} />
          <Text style={muted}>
            Fragen? Einfach auf diese E-Mail antworten — Skifreunde Gütersloh e.V.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
