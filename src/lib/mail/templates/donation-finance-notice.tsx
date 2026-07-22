import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Props = {
  donorName: string;
  donorEmail: string;
  amountFormatted: string;
  dateFormatted: string;
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

export default function DonationFinanceNoticeEmail({
  donorName,
  donorEmail,
  amountFormatted,
  dateFormatted,
}: Props) {
  return (
    <Html lang="de">
      <Head />
      <Preview>{`Spende über ${amountFormatted} braucht eine förmliche Zuwendungsbestätigung`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Intern · Spende über 300 €</Text>
          <Heading style={heading}>Förmliche Zuwendungsbestätigung nötig.</Heading>
          <Text style={text}>
            Diese Spende übersteigt 300 € — der/die Spendende hat per Mail schon die Info
            bekommen, dass die förmliche Zuwendungsbestätigung separat von dir kommt.
          </Text>
          <Section style={box}>
            <Text style={{ ...text, margin: "0 0 4px 0" }}>
              <strong>{donorName}</strong> · {donorEmail}
            </Text>
            <Text style={{ ...text, margin: 0 }}>
              {amountFormatted} · {dateFormatted}
            </Text>
          </Section>
          <Text style={muted}>Automatische Systemnachricht · wiesenhuette.de</Text>
        </Container>
      </Body>
    </Html>
  );
}
