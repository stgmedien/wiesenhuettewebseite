import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button as EmailButton,
} from "@react-email/components";

type Props = {
  name?: string | null;
  slotLabel: string;
  participantCount: number;
  participantEmails: string[];
  lunchCount: number;
  bookUrl: string;
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
  lineHeight: 1.1,
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
  borderRadius: "12px",
  padding: "16px 20px",
  margin: "16px 0",
};
const button = {
  backgroundColor: "#2F4A35",
  color: "#F7F7F2",
  borderRadius: "999px",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 24px",
  textDecoration: "none",
};

export default function RadMatchEmail({
  name,
  slotLabel,
  participantCount,
  participantEmails,
  lunchCount,
  bookUrl,
}: Props) {
  return (
    <Html lang="de">
      <Head />
      <Preview>Euer Rad-Wochenende an der Wiesenhütte steht!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Radtouren-Match</Text>
          <Heading style={heading}>Ihr seid {participantCount} — es kann losgehen! 🚴</Heading>
          <Text style={text}>Hallo{name ? ` ${name}` : ""},</Text>
          <Text style={text}>
            für das Wochenende <strong>{slotLabel}</strong> haben sich genug
            Radbegeisterte gefunden, um die Wiesenhütte in Langewiese gemeinsam
            zu übernehmen. Hier ist Eure Gruppe:
          </Text>
          <Section style={box}>
            {participantEmails.map((e) => (
              <Text key={e} style={{ ...text, margin: "0 0 4px 0", fontSize: "14px" }}>
                • {e}
              </Text>
            ))}
          </Section>
          <Text style={text}>
            <strong>So geht es weiter:</strong>
          </Text>
          <Text style={{ ...text, margin: "0 0 6px 0" }}>
            1. Stimmt Euch kurz per Mail ab (einfach allen antworten).
          </Text>
          <Text style={{ ...text, margin: "0 0 6px 0" }}>
            2. Eine Person bucht das Wochenende für die Gruppe — Anlass „Gruppenfahrt".
          </Text>
          <Text style={{ ...text, margin: "0 0 12px 0" }}>
            3. Lunchpaket: {lunchCount > 0
              ? `${lunchCount} von Euch möchten die Gerke-Brotzeit (z. B. mit Frikadellen) — die Bäckerei gegenüber nimmt Vorbestellungen unter 02758 280 entgegen.`
              : "Die Bäckerei Gerke gegenüber nimmt Vorbestellungen für eine Touren-Brotzeit unter 02758 280 entgegen."}
          </Text>
          <Section style={{ margin: "24px 0" }}>
            <EmailButton href={bookUrl} style={button}>
              Jetzt Wochenende buchen
            </EmailButton>
          </Section>
          <Text style={muted}>
            Eure E-Mail-Adressen wurden — wie beim Eintragen bestätigt — nur
            innerhalb dieser Gruppe geteilt. Skifreunde Gütersloh e.V. ·
            wiesenhuette.de
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
