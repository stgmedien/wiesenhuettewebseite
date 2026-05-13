import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Props = {
  purchaserName: string;
  recipientName: string | null;
  recipientEmail: string | null;
  deliveryMode: "email" | "print";
  code: string;
  valueEuros: string; // formatted "100,00"
  expiresAtFormatted: string;
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
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  color: "#2F4A35",
  margin: 0,
};
const text = { fontSize: "16px", lineHeight: 1.55, color: "#111111", margin: "0 0 14px 0" };
const small = { ...text, fontSize: "13px", color: "#5b5b56" };
const codeBox = {
  backgroundColor: "#EFE6D8",
  border: "2px dashed #2F4A35",
  borderRadius: "12px",
  padding: "18px",
  textAlign: "center" as const,
  margin: "20px 0",
};
const codeText = {
  fontFamily: "Courier, monospace",
  fontSize: "22px",
  fontWeight: 700,
  color: "#2F4A35",
  letterSpacing: "2px",
  margin: 0,
};

export default function VoucherPurchaseEmail({
  purchaserName,
  recipientName,
  recipientEmail,
  deliveryMode,
  code,
  valueEuros,
  expiresAtFormatted,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Vielen Dank — Dein Wiesenhütte-Gutschein wurde ausgestellt.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Bestätigung</Text>
          <Heading style={heading}>Hi {purchaserName}, danke für Deinen Gutschein-Kauf!</Heading>
          <Text style={text}>
            Du hast einen Wiesenhütte-Gutschein im Wert von <strong>{valueEuros} €</strong> erworben.
          </Text>
          <Section style={codeBox}>
            <Text style={small}>Gutschein-Code</Text>
            <Text style={codeText}>{code}</Text>
            <Text style={small}>Gültig bis {expiresAtFormatted}</Text>
          </Section>
          {deliveryMode === "email" && recipientName && recipientEmail ? (
            <Text style={text}>
              Wir haben den Gutschein parallel an {recipientName} ({recipientEmail}) gemailt — mit
              Deiner persönlichen Nachricht. Du musst nichts weiter tun.
            </Text>
          ) : (
            <Text style={text}>
              Lade Dir den Gutschein als PDF herunter und überreich ihn persönlich. Mit dem Code
              kann der Aufenthalt online unter <a href="https://www.xn--wiesenhtte-geb.com/buchen">/buchen</a> gebucht werden.
            </Text>
          )}
          <Text style={small}>
            Partielle Einlösung ist möglich — der Restwert bleibt auf dem Code, bis er aufgebraucht
            ist. Bitte den Code sicher aufbewahren; bei Verlust gibt es keinen Ersatz.
          </Text>
          <Text style={small}>
            Hüttengrüße,<br />Vorstand der Skifreunde Gütersloh e.V.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
