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
  amountCents: number;
  dateFormatted: string;
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
const box = {
  backgroundColor: "#EFE6D8",
  padding: "20px",
  borderRadius: "12px",
  margin: "16px 0",
};
const label = { ...muted, fontSize: "13px", margin: "0 0 4px 0" };
const value = { ...text, fontWeight: 600, margin: 0 };

export default function RestzahlungConfirmedEmail({
  guestName,
  bookingNumber,
  amountCents,
  dateFormatted,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Eure Restzahlung ist bei uns eingegangen</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Skifreunde Gütersloh e.V.</Text>
          <Heading style={heading}>Zahlung bestätigt.</Heading>
          <Text style={text}>Hallo {guestName},</Text>
          <Text style={text}>
            Eure Restzahlung für die Buchung {bookingNumber} ist bei uns eingegangen.
          </Text>

          <Section style={box}>
            <Text style={label}>Betrag</Text>
            <Text style={value}>{formatEuro(amountCents)}</Text>
            <Hr style={{ borderColor: "#C8CEC4", margin: "12px 0" }} />
            <Text style={label}>Datum</Text>
            <Text style={value}>{dateFormatted}</Text>
          </Section>

          <Hr style={{ borderColor: "#C8CEC4", margin: "28px 0 16px" }} />
          <Text style={muted}>
            Fragen? Einfach auf diese E-Mail antworten — Skifreunde Gütersloh e.V.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
