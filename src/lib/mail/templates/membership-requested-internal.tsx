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
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  memberId: string | null;
  note: string | null;
  reviewUrl: string;
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
  margin: "0 0 12px 0",
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
  fontSize: "15px",
  lineHeight: 1.55,
  color: "#111111",
  margin: "0 0 10px 0",
};
const muted = { ...text, color: "#5b5b56", fontSize: "13px" };
const button = {
  backgroundColor: "#2F4A35",
  color: "#ffffff",
  padding: "12px 22px",
  borderRadius: "999px",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "14px",
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-block",
};
const labelStyle = {
  ...muted,
  fontSize: "11px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  margin: "0 0 2px 0",
};
const valueStyle = { ...text, margin: "0 0 10px 0" };

export default function MembershipRequestedInternalEmail({
  customerName,
  customerEmail,
  customerPhone,
  memberId,
  note,
  reviewUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Neuer Mitgliedschafts-Antrag — {customerName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Manager-Benachrichtigung</Text>
          <Heading style={heading}>Neuer Mitgliedschafts-Antrag.</Heading>
          <Text style={text}>
            Ein Kunde hat über das Konto-Profil die Verifizierung als Vereinsmitglied beantragt.
          </Text>

          <Section
            style={{
              backgroundColor: "#EFE6D8",
              borderRadius: "12px",
              padding: "16px 20px",
              margin: "20px 0",
            }}
          >
            <Text style={labelStyle}>Antragsteller</Text>
            <Text style={valueStyle}>{customerName}</Text>

            <Text style={labelStyle}>E-Mail</Text>
            <Text style={valueStyle}>
              <a href={`mailto:${customerEmail}`} style={{ color: "#2F4A35" }}>
                {customerEmail}
              </a>
            </Text>

            {customerPhone && (
              <>
                <Text style={labelStyle}>Telefon</Text>
                <Text style={valueStyle}>{customerPhone}</Text>
              </>
            )}

            {memberId && (
              <>
                <Text style={labelStyle}>Angegebene Mitgliedsnummer</Text>
                <Text style={{ ...valueStyle, fontFamily: "monospace" }}>{memberId}</Text>
              </>
            )}

            {note && (
              <>
                <Text style={labelStyle}>Notiz vom Antragsteller</Text>
                <Text style={{ ...valueStyle, fontStyle: "italic" }}>„{note}"</Text>
              </>
            )}
          </Section>

          <Section style={{ margin: "24px 0" }}>
            <Button style={button} href={reviewUrl}>
              Im Manager-Backend prüfen →
            </Button>
          </Section>

          <Hr style={{ borderColor: "#C8CEC4", margin: "24px 0 12px" }} />
          <Text style={muted}>
            Diese Benachrichtigung wurde automatisch erstellt, weil ein Mitgliedschafts-Antrag
            eingegangen ist. Du erreichst das Manager-Backend unter
            wiesenhütte.com/m/mitgliedschaften.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
