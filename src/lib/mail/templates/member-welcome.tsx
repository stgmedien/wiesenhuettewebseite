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
  firstName: string | null;
  tierName: string;
  annualFeeCents: number;
  bookUrl: string;
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
  fontSize: "28px",
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
const buttonGhost = {
  ...button,
  backgroundColor: "#ffffff",
  color: "#2F4A35",
  border: "1px solid #C8CEC4",
};

export default function MemberWelcomeEmail({
  firstName,
  tierName,
  annualFeeCents,
  bookUrl,
  loginUrl,
}: Props) {
  const fee = (annualFeeCents / 100).toLocaleString("de-DE", {
    minimumFractionDigits: annualFeeCents % 100 === 0 ? 0 : 2,
  });
  return (
    <Html lang="de">
      <Head />
      <Preview>Willkommen bei den Skifreunden Gütersloh — Deine Mitgliedschaft ist aktiv!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Skifreunde Gütersloh e.V.</Text>
          <Heading style={heading}>
            Willkommen im Verein{firstName ? `, ${firstName}` : ""}! 🎿
          </Heading>
          <Text style={text}>
            Deine Mitgliedschaft ist ab sofort <strong>aktiv</strong> — schön, dass Du dabei
            bist. Du gehörst jetzt zu einer Gemeinschaft, die die Wiesenhütte in Langewiese
            seit 1956 in Eigenleistung baut, pflegt und mit Leben füllt.
          </Text>
          <Section style={box}>
            <Text style={{ ...muted, margin: "0 0 6px 0", fontWeight: 600 }}>
              Deine Mitgliedschaft
            </Text>
            <Text style={{ ...text, margin: 0 }}>
              {tierName} — {fee} € pro Jahr
              <br />
              <span style={{ color: "#5b5b56", fontSize: "13px" }}>
                verlängert sich automatisch · jederzeit zum Jahresende kündbar
              </span>
            </Text>
          </Section>
          <Text style={text}>Das gehört ab sofort Dir:</Text>
          <Text style={{ ...text, margin: "0 0 4px 0" }}>
            ✓ <strong>50 % auf Übernachtungen</strong> an der Wiesenhütte — gilt automatisch,
            wenn Du mit dieser E-Mail-Adresse buchst
          </Text>
          <Text style={{ ...text, margin: "0 0 4px 0" }}>
            ✓ <strong>Skigymnastik inklusive</strong> — dienstags 18:30 & donnerstags 20:00
          </Text>
          <Text style={{ ...text, margin: "0 0 12px 0" }}>
            ✓ <strong>Vereinsfahrten & Veranstaltungen</strong> — von der Grünkohlwanderung
            bis zum Adventskaffee
          </Text>
          <Text style={text}>
            Und das Beste: Dein Beitrag wirkt. Er hält die Hütte in Schuss, trägt das
            Schulprojekt mit dem ESG mit und ermöglicht Projekte wie das neue
            Zeltpodest.
          </Text>
          <Section style={{ margin: "24px 0 8px 0" }}>
            <EmailButton href={bookUrl} style={button}>
              Jetzt mit Mitgliederpreisen buchen
            </EmailButton>
          </Section>
          <Section style={{ margin: "0 0 16px 0" }}>
            <EmailButton href={loginUrl} style={buttonGhost}>
              Dein Konto — Login-Link anfordern
            </EmailButton>
          </Section>
          <Text style={muted}>
            Fragen zur Mitgliedschaft? Antworte einfach auf diese Mail.
            <br />
            Skifreunde Gütersloh e.V. · wiesenhuette.de
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
