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
} from "@react-email/components";

type Props = {
  firstName: string;
  discountCode: string;
  discountPercent: number;
  validUntilFormatted: string; // "12. März 2026"
  bookingUrl: string;
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
  margin: "0 0 14px 0",
};
const codeBox = {
  backgroundColor: "#EFE6D8",
  border: "2px dashed #2F4A35",
  borderRadius: "12px",
  padding: "18px",
  textAlign: "center" as const,
  margin: "20px 0",
};
const codeText = {
  fontFamily: "Courier, monospace",
  fontSize: "28px",
  fontWeight: 700,
  color: "#2F4A35",
  letterSpacing: "3px",
  margin: 0,
};
const small = {
  ...text,
  fontSize: "13px",
  color: "#5b5b56",
};
const button = {
  backgroundColor: "#2F4A35",
  borderRadius: "999px",
  color: "#ffffff",
  fontFamily: "Inter, system-ui, sans-serif",
  fontWeight: 600,
  fontSize: "15px",
  padding: "12px 24px",
  textDecoration: "none",
  display: "inline-block",
};

export default function BirthdayEmail({
  firstName,
  discountCode,
  discountPercent,
  validUntilFormatted,
  bookingUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>🎉 Alles Gute zum Geburtstag — kleines Geschenk von der Wiesenhütte für Dich.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Glückwunsch</Text>
          <Heading style={heading}>Alles Gute, {firstName}!</Heading>
          <Text style={text}>
            Wir wünschen Dir einen wundervollen Geburtstag — und damit Dein nächster Aufenthalt
            auf der Hütte gleich etwas leichter wird, haben wir ein kleines Geschenk
            mitgebracht.
          </Text>

          <Section style={codeBox}>
            <Text style={{ ...small, margin: "0 0 6px 0" }}>Dein Geburtstags-Code</Text>
            <Text style={codeText}>{discountCode}</Text>
            <Text style={{ ...small, margin: "8px 0 0 0" }}>
              {discountPercent}% Rabatt auf den Buchungsbetrag · gültig bis {validUntilFormatted}
            </Text>
          </Section>

          <Section style={{ textAlign: "center", margin: "20px 0 24px 0" }}>
            <Button style={button} href={bookingUrl}>
              Aufenthalt planen
            </Button>
          </Section>

          <Text style={small}>
            Einfach beim nächsten Buchen im Code-Feld eintragen. Der Code ist einmal einlösbar
            und 60 Tage gültig.
          </Text>
          <Text style={small}>
            Hütten-Grüße aus dem Sauerland,<br />
            Dein Vorstand der Skifreunde Gütersloh e.V.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
