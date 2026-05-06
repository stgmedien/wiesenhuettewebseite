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
  url: string;
  expiresMinutes: number;
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

export default function MagicLinkEmail({ url, expiresMinutes }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Dein Login-Link für die Wiesenhütte</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Login</Text>
          <Heading style={heading}>Klick zum Anmelden.</Heading>
          <Text style={text}>
            Du hast Dich gerade auf wiesenhütte.com eingeloggt. Klick auf den Button, um die Anmeldung
            abzuschließen — kein Passwort nötig.
          </Text>
          <Section style={{ margin: "28px 0" }}>
            <Button style={button} href={url}>
              Jetzt einloggen
            </Button>
          </Section>
          <Text style={muted}>
            Dieser Link ist <strong>{expiresMinutes} Minuten</strong> gültig und kann nur einmal
            verwendet werden.
          </Text>
          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>
            <strong>Du hast keinen Login angefragt?</strong> Dann ignoriere diese E-Mail — niemand
            kommt ohne diesen Link in Dein Konto.
          </Text>
          <Text style={{ ...muted, fontSize: "12px", marginTop: 12 }}>
            Funktioniert der Button nicht? Kopier diesen Link in den Browser:
            <br />
            <span style={{ wordBreak: "break-all", color: "#2F4A35" }}>{url}</span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
