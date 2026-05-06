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
  refundCents: number;
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
  fontSize: "30px",
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
const amountBox = {
  backgroundColor: "#e3ecdc",
  borderLeft: "4px solid #6FA05F",
  padding: "20px",
  borderRadius: "12px",
  margin: "20px 0",
};
const amount = {
  ...heading,
  fontSize: "36px",
  margin: 0,
};

export default function DepositRefundedEmail({
  guestName,
  bookingNumber,
  arrival,
  departure,
  refundCents,
  baseUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Eure Kaution wurde zurückgebucht — {formatEuro(refundCents)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Skifreunde Gütersloh e.V.</Text>
          <Heading style={heading}>Eure Kaution ist wieder bei Euch.</Heading>

          <Text style={text}>Hallo {guestName},</Text>
          <Text style={text}>
            wir hoffen, Ihr seid gut wieder zuhause angekommen — und Euer Aufenthalt auf der
            Wiesenhütte hat sich gelohnt.
          </Text>
          <Text style={text}>
            Wie versprochen haben wir Eure Kaution heute über Stripe zurückgebucht. Je nach Bank
            dauert es 2–10 Werktage, bis das Geld wieder auf Eurer Zahlungsmethode auftaucht.
          </Text>

          <Section style={amountBox}>
            <Text style={eyebrow}>Erstattet</Text>
            <Text style={amount}>{formatEuro(refundCents)}</Text>
            <Text style={{ ...muted, margin: "4px 0 0" }}>
              Buchung {bookingNumber} · {arrival} → {departure}
            </Text>
          </Section>

          <Text style={text}>
            Falls Du Fragen hast oder die Erstattung nicht ankommt, melde Dich einfach bei uns —
            wir kümmern uns sofort darum.
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
