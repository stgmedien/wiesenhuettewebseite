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
  name: string;
  email: string;
  phone: string | null;
  tierName: string;
  annualFeeCents: number;
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

export default function MemberJoinedInternalEmail({
  name,
  email,
  phone,
  tierName,
  annualFeeCents,
  managerUrl,
}: Props) {
  const fee = (annualFeeCents / 100).toLocaleString("de-DE", {
    minimumFractionDigits: annualFeeCents % 100 === 0 ? 0 : 2,
  });
  return (
    <Html lang="de">
      <Head />
      <Preview>Neues Mitglied online beigetreten: {name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Intern · Online-Beitritt</Text>
          <Heading style={heading}>Neues Mitglied: {name}</Heading>
          <Text style={text}>
            Soeben ist über wiesenhuette.de ein neues Mitglied beigetreten. Die Zahlung
            (Stripe-Jahresabo) ist bestätigt, die Mitgliedschaft wurde automatisch
            freigeschaltet — Mitgliederpreise gelten ab sofort.
          </Text>
          <Section style={box}>
            <Text style={{ ...muted, margin: "0 0 6px 0", fontWeight: 600 }}>Details</Text>
            <Text style={{ ...text, margin: 0 }}>
              {name}
              <br />
              {email}
              {phone ? (
                <>
                  <br />
                  {phone}
                </>
              ) : null}
              <br />
              {tierName} — {fee} €/Jahr
            </Text>
          </Section>
          <Text style={muted}>
            Bitte ins Mitgliederverzeichnis übernehmen und ggf. eine Mitgliedsnummer
            vergeben.
          </Text>
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
