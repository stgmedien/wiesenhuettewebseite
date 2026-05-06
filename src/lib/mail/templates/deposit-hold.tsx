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
} from "@react-email/components";
import { formatEuro } from "@/lib/pricing";

type Props = {
  guestName: string;
  bookingNumber: string;
  arrival: string;
  departure: string;
  depositCents: number;
  reason: string;
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
const reasonBox = {
  backgroundColor: "#EFE6D8",
  borderLeft: "4px solid #B85C38",
  padding: "16px 20px",
  borderRadius: "12px",
  margin: "20px 0",
};

export default function DepositHoldEmail({
  guestName,
  bookingNumber,
  arrival,
  departure,
  depositCents,
  reason,
  baseUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Eure Kaution wird vorerst nicht zurückgebucht — bitte kurz lesen</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Skifreunde Gütersloh e.V.</Text>
          <Heading style={heading}>Wir behalten Eure Kaution vorerst ein.</Heading>

          <Text style={text}>Hallo {guestName},</Text>
          <Text style={text}>
            normalerweise buchen wir die Kaution von {formatEuro(depositCents)} 14 Tage nach Eurer
            Abreise automatisch zurück. Bei Eurer Buchung <strong>{bookingNumber}</strong> haben wir
            das aber pausiert.
          </Text>

          <Section style={reasonBox}>
            <Text style={eyebrow}>Grund</Text>
            <Text style={{ ...text, margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{reason}</Text>
          </Section>

          <Text style={text}>
            Wir melden uns bei Dir, sobald wir das geklärt haben. Falls Du selbst noch Informationen
            beisteuern oder eine Frage hast: einfach auf diese Mail antworten — wir sind erreichbar.
          </Text>

          <Text style={muted}>
            Buchung {bookingNumber} · {arrival} → {departure}
          </Text>

          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
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
