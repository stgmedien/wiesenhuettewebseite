import {
  Body,
  Button,
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
  firstName: string;
  email: string;
  membershipPending: boolean;
  loginUrl: string;
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
  color: "#ffffff",
  padding: "14px 24px",
  borderRadius: "999px",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-block",
};

export default function WelcomeEmail({ firstName, email, membershipPending, loginUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Willkommen bei der Wiesenhütte</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Willkommen</Text>
          <Heading style={heading}>Hallo {firstName}!</Heading>
          <Text style={text}>
            Schön, dass Du jetzt einen Wiesenhütten-Account hast. Mit Deinem Konto siehst Du in
            Zukunft alle Buchungen, Rechnungen und Anfragen auf einen Blick.
          </Text>
          <Text style={text}>
            Dein Login-Konto ist mit der E-Mail-Adresse <strong>{email}</strong> verknüpft.
          </Text>

          {membershipPending && (
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
                <strong>Deine Mitgliedschaft prüfen wir manuell.</strong> Sobald wir Deinen Status
                im Vereinsverzeichnis bestätigt haben, gelten für Dich automatisch die
                Mitglieds-Tarife (−50 %: 11,00 € statt 22,00 € pro Erwachsenem & Nacht). Wir geben Bescheid.
              </Text>
            </Section>
          )}

          <Section style={{ margin: "28px 0" }}>
            <Button style={button} href={loginUrl}>
              Zum Konto
            </Button>
          </Section>

          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>
            <strong>Du hast Dich nicht selbst angemeldet?</strong> Dann ignorier diese Mail — das
            Konto wird nach 30 Tagen automatisch deaktiviert, wenn Du Dich nie einloggst.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
