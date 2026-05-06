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

type Props = {
  name: string;
  email: string;
  role: "manager" | "admin";
  initialPassword: string;
  loginUrl: string;
  invitedBy: string;
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
const credBox = {
  backgroundColor: "#EFE6D8",
  padding: "20px",
  borderRadius: "12px",
  margin: "20px 0",
};
const code = {
  fontFamily: "Menlo, Consolas, monospace",
  fontSize: "16px",
  fontWeight: 600,
  background: "#F7F7F2",
  padding: "4px 8px",
  borderRadius: "4px",
  display: "inline-block",
};

export default function UserWelcomeEmail({
  name,
  email,
  role,
  initialPassword,
  loginUrl,
  invitedBy,
}: Props) {
  const roleLabel = role === "admin" ? "Administrator" : "Manager";
  return (
    <Html>
      <Head />
      <Preview>Dein Zugang zum Wiesenhütten-Backend</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Skifreunde Gütersloh</Text>
          <Heading style={heading}>Willkommen im Manager-Backend.</Heading>

          <Text style={text}>Hallo {name},</Text>
          <Text style={text}>
            {invitedBy} hat Dich gerade als <strong>{roleLabel}</strong> für die Wiesenhütten-
            Verwaltung angelegt. Du kannst Dich ab sofort einloggen und Buchungen, Kalender,
            Sperrzeiten und (als Admin) auch andere Nutzer verwalten.
          </Text>

          <Section style={credBox}>
            <Text style={eyebrow}>Deine Zugangsdaten</Text>
            <Text style={{ ...muted, margin: "8px 0 4px" }}>E-Mail</Text>
            <Text style={{ ...text, margin: 0 }}>
              <span style={code}>{email}</span>
            </Text>
            <Text style={{ ...muted, margin: "12px 0 4px" }}>Initial-Passwort</Text>
            <Text style={{ ...text, margin: 0 }}>
              <span style={code}>{initialPassword}</span>
            </Text>
          </Section>

          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <a
              href={loginUrl}
              style={{
                backgroundColor: "#2F4A35",
                color: "#F7F7F2",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "16px",
                fontWeight: 600,
                padding: "14px 24px",
                borderRadius: "14px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Jetzt einloggen
            </a>
          </Section>

          <Text style={muted}>
            <strong>Bitte ändere das Passwort beim ersten Login</strong> über &bdquo;Mein Profil&ldquo;.
            Bewahre die Zugangsdaten sicher auf — wir können sie nicht wiederherstellen, wir können
            sie nur durch ein neues Passwort ersetzen.
          </Text>

          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>
            Login-URL: <a href={loginUrl}>{loginUrl}</a>
            <br />
            Frage zum Zugang? Antworte einfach auf diese Mail — sie geht direkt an {invitedBy}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
