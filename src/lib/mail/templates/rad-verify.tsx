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
  slotLabels: string[];
  verifyUrl: string;
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

export default function RadVerifyEmail({ name, slotLabels, verifyUrl }: Props) {
  return (
    <Html lang="de">
      <Head />
      <Preview>Bitte bestätige Dein Radtouren-Interesse an der Wiesenhütte</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Radtouren</Text>
          <Heading style={heading}>Einmal kurz bestätigen, bitte.</Heading>
          <Text style={text}>Hallo{name ? ` ${name}` : ""},</Text>
          <Text style={text}>
            Du hast Dich für gemeinsame Rad-Wochenenden an der Wiesenhütte in
            Langewiese eingetragen — für diese Zeiträume:
          </Text>
          {slotLabels.map((s) => (
            <Text key={s} style={{ ...text, margin: "0 0 4px 0" }}>
              • {s}
            </Text>
          ))}
          <Section style={{ margin: "24px 0" }}>
            <EmailButton href={verifyUrl} style={button}>
              Interesse bestätigen
            </EmailButton>
          </Section>
          <Text style={muted}>
            Sobald sich 8 oder mehr Radbegeisterte für denselben Zeitraum
            gefunden haben, bekommst Du automatisch eine Mail mit der Gruppe
            und den nächsten Schritten. Falls Du Dich nicht eingetragen hast,
            ignoriere diese Mail einfach — ohne Bestätigung passiert nichts.
          </Text>
          <Text style={muted}>Skifreunde Gütersloh e.V. · wiesenhuette.de</Text>
        </Container>
      </Body>
    </Html>
  );
}
