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
  slotLabel: string;
  participantCount: number;
  participantEmails: string[];
  lunchCount: number;
  managerUrl: string;
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
  fontSize: "24px",
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

export default function RadMatchInternalEmail({
  slotLabel,
  participantCount,
  participantEmails,
  lunchCount,
  managerUrl,
}: Props) {
  return (
    <Html lang="de">
      <Head />
      <Preview>Interner Hinweis: Radtouren-Match {slotLabel}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Intern · Radtouren-Matching</Text>
          <Heading style={heading}>Match: {slotLabel}</Heading>
          <Text style={text}>
            Für dieses Wochenende ist ein Rad-Match zustande gekommen
            (<strong>{participantCount}</strong> bestätigte Personen). Die Teilnehmenden
            wurden soeben automatisch per Mail verbunden.
          </Text>
          <Text style={text}>
            <strong>Lunchpaket-Bedarf:</strong> {lunchCount} von {participantCount} Personen
            haben Interesse am Gerke-Lunchpaket bekundet.
            {lunchCount > 0
              ? " Bitte ggf. die Bäckerei Gerke (Tel. 02758 280) vorab informieren."
              : ""}
          </Text>
          <Section style={box}>
            <Text style={{ ...muted, margin: "0 0 6px 0", fontWeight: 600 }}>
              Teilnehmer:innen
            </Text>
            {participantEmails.map((e) => (
              <Text key={e} style={{ ...muted, margin: "0 0 2px 0" }}>
                • {e}
              </Text>
            ))}
          </Section>
          <Section style={{ margin: "20px 0" }}>
            <EmailButton href={managerUrl} style={button}>
              Im Manager öffnen
            </EmailButton>
          </Section>
          <Text style={muted}>Automatische Systemnachricht · wiesenhuette.de</Text>
        </Container>
      </Body>
    </Html>
  );
}
