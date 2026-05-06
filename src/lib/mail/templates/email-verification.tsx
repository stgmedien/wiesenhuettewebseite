import {
  Body,
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
  name: string;
  oldEmail: string;
  newEmail: string;
  verifyUrl: string;
  expiresInHours: number;
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
  padding: "14px 24px",
  borderRadius: "14px",
  textDecoration: "none",
  display: "inline-block",
};

export default function EmailVerificationEmail({
  name,
  oldEmail,
  newEmail,
  verifyUrl,
  expiresInHours,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Bestätige Deine neue E-Mail-Adresse</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Manager-Backend</Text>
          <Heading style={heading}>Bestätige Deine neue E-Mail-Adresse</Heading>

          <Text style={text}>Hallo {name},</Text>
          <Text style={text}>
            Du hast Deine E-Mail-Adresse von <strong>{oldEmail}</strong> auf{" "}
            <strong>{newEmail}</strong> ändern wollen. Bitte bestätige den Wechsel innerhalb der
            nächsten {expiresInHours} Stunden.
          </Text>

          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            <a href={verifyUrl} style={button}>
              E-Mail-Wechsel bestätigen
            </a>
          </Section>

          <Text style={muted}>
            Falls der Button nicht funktioniert, hier der direkte Link:
            <br />
            <a href={verifyUrl}>{verifyUrl}</a>
          </Text>

          <Hr style={{ borderColor: "#C8CEC4", margin: "28px 0 16px" }} />
          <Text style={muted}>
            Du hast diesen Wechsel nicht angefordert? Dann ignoriere diese Mail einfach — Dein
            Account bleibt unter <strong>{oldEmail}</strong> erreichbar. Wir empfehlen, Dein Passwort
            zu ändern, falls Du den Verdacht hast, dass jemand Zugang zu Deinem Konto hat.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
