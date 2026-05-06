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
  email: string;
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

export default function TwoFactorEnabledEmail({ name, email }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Zwei-Faktor-Authentifizierung aktiviert</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Sicherheit</Text>
          <Heading style={heading}>Zwei-Faktor-Authentifizierung aktiviert.</Heading>
          <Text style={text}>Hallo {name},</Text>
          <Text style={text}>
            für Dein Konto <strong>{email}</strong> ist gerade die Zwei-Faktor-Authentifizierung
            (2FA) aktiviert worden. Ab dem nächsten Login brauchst Du zusätzlich zum Passwort einen
            6-stelligen Code aus Deiner Authenticator-App.
          </Text>
          <Section
            style={{
              backgroundColor: "#EFE6D8",
              borderLeft: "4px solid #2F4A35",
              padding: "16px 20px",
              borderRadius: "12px",
              margin: "20px 0",
            }}
          >
            <Text style={text}>
              <strong>Wichtig:</strong> Du hast beim Aktivieren 10 Backup-Codes erhalten. Bewahre
              sie sicher auf (z. B. Passwortmanager oder ausgedruckt im Schrank). Mit jedem
              Backup-Code kannst Du Dich einmal einloggen, falls Du Dein Telefon verlierst.
            </Text>
          </Section>
          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>
            <strong>Du hast 2FA NICHT selbst aktiviert?</strong> Dann ändere sofort Dein Passwort
            und kontaktiere uns — vermutlich hat jemand anderes Zugang zu Deinem Konto.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
