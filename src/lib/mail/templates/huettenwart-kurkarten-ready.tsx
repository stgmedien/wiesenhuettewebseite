import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

type Props = {
  bookingNumber: string;
  guestName: string;
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

export default function HuettenwartKurkartenReadyEmail({
  bookingNumber,
  guestName,
  arrival,
  departure,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Kurkarten + Feuerwehr-Meldeliste für {guestName} sind da</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Hüttenwart</Text>
          <Heading style={heading}>Kurkarten sind da.</Heading>
          <Text style={text}>Hallo Toni,</Text>
          <Text style={text}>
            im Anhang findest Du die Kurkarten und die Feuerwehr-Meldeliste für die Buchung{" "}
            {bookingNumber} — {guestName}, {arrival} bis {departure}.
          </Text>
          <Text style={muted}>Fragen? Einfach auf diese Mail antworten.</Text>
        </Container>
      </Body>
    </Html>
  );
}
