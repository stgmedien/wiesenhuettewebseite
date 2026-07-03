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
  guestName: string;
  bookingNumber: string;
  bodyText: string;
  paymentLinkUrl?: string;
  paymentAmountFormatted?: string;
  paymentReason?: string;
};

const main = { backgroundColor: "#F7F7F2", padding: "40px 0" };
const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "32px",
  width: "100%",
  maxWidth: "600px",
  borderRadius: "20px",
  boxSizing: "border-box" as const,
};
const heading = {
  fontFamily: "Bricolage Grotesque, system-ui, sans-serif",
  color: "#2F4A35",
  fontSize: "26px",
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
  whiteSpace: "pre-wrap" as const,
  overflowWrap: "anywhere" as const,
  wordBreak: "break-word" as const,
};
const muted = { ...text, color: "#5b5b56", fontSize: "14px" };
const urlText = {
  ...muted,
  fontSize: "12px",
  margin: "12px 0 0",
  overflowWrap: "anywhere" as const,
  wordBreak: "break-all" as const,
};
const button = {
  backgroundColor: "#2F4A35",
  color: "#F7F7F2",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "16px",
  fontWeight: 600,
  padding: "14px 24px",
  borderRadius: "14px",
  textDecoration: "none",
  display: "inline-block",
};

export default function ManagerMessageEmail({
  guestName,
  bookingNumber,
  bodyText,
  paymentLinkUrl,
  paymentAmountFormatted,
  paymentReason,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Nachricht zu Buchung {bookingNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Buchung {bookingNumber}</Text>
          <Heading style={heading}>Hallo {guestName},</Heading>
          <Text style={text}>{bodyText}</Text>

          {paymentLinkUrl ? (
            <Section
              style={{
                backgroundColor: "#EFE6D8",
                padding: "20px",
                borderRadius: "12px",
                margin: "20px 0",
              }}
            >
              <Text style={{ ...muted, margin: 0 }}>Zahlungsaufforderung</Text>
              <Text style={{ ...text, fontWeight: 600, fontSize: "20px", margin: "4px 0 8px" }}>
                {paymentAmountFormatted}
              </Text>
              {paymentReason ? <Text style={muted}>{paymentReason}</Text> : null}
              <Section style={{ textAlign: "center", marginTop: "16px" }}>
                <a href={paymentLinkUrl} style={button}>
                  Jetzt sicher bezahlen
                </a>
              </Section>
              <Text style={urlText}>Falls der Button nicht funktioniert:</Text>
              <Text style={urlText}>
                <a
                  href={paymentLinkUrl}
                  style={{
                    color: "#2F4A35",
                    overflowWrap: "anywhere",
                    wordBreak: "break-all",
                  }}
                >
                  {paymentLinkUrl}
                </a>
              </Text>
            </Section>
          ) : null}

          <Text style={muted}>Viele Grüße — Dein Wiesenhütten Team</Text>
        </Container>
      </Body>
    </Html>
  );
}
