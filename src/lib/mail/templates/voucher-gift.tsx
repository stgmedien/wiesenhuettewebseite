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
  recipientName: string;
  purchaserName: string;
  personalMessage: string | null;
  code: string;
  valueEuros: string;
  expiresAtFormatted: string;
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
  fontSize: "30px",
  fontWeight: 700,
  margin: "0 0 16px 0",
};
const eyebrow = {
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  color: "#2F4A35",
  margin: 0,
};
const text = { fontSize: "16px", lineHeight: 1.55, color: "#111111", margin: "0 0 14px 0" };
const small = { ...text, fontSize: "13px", color: "#5b5b56" };
const codeBox = {
  backgroundColor: "#EFE6D8",
  border: "2px dashed #2F4A35",
  borderRadius: "12px",
  padding: "22px",
  textAlign: "center" as const,
  margin: "24px 0",
};
const codeText = {
  fontFamily: "Courier, monospace",
  fontSize: "26px",
  fontWeight: 700,
  color: "#2F4A35",
  letterSpacing: "3px",
  margin: 0,
};
const messageBox = {
  borderLeft: "3px solid #2F4A35",
  paddingLeft: "16px",
  margin: "20px 0",
  fontStyle: "italic" as const,
  color: "#2F4A35",
};
const button = {
  backgroundColor: "#2F4A35",
  borderRadius: "999px",
  color: "#ffffff",
  fontWeight: 600,
  fontSize: "15px",
  padding: "12px 24px",
  textDecoration: "none",
  display: "inline-block",
};

export default function VoucherGiftEmail({
  recipientName,
  purchaserName,
  personalMessage,
  code,
  valueEuros,
  expiresAtFormatted,
  bookingUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{`Du hast einen Wiesenhütte-Gutschein über ${valueEuros} € von ${purchaserName} bekommen.`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Geschenk · Wiesenhütte</Text>
          <Heading style={heading}>Hi {recipientName} — ein Geschenk für Dich.</Heading>
          <Text style={text}>
            <strong>{purchaserName}</strong> hat Dir einen Aufenthalt in der Wiesenhütte
            geschenkt.
          </Text>
          {personalMessage && (
            <Section style={messageBox}>
              <Text style={{ ...text, fontSize: "15px", margin: 0 }}>„{personalMessage}"</Text>
            </Section>
          )}
          <Section style={codeBox}>
            <Text style={small}>Dein Gutschein-Code</Text>
            <Text style={codeText}>{code}</Text>
            <Text style={small}>
              Wert: <strong>{valueEuros} €</strong> · gültig bis {expiresAtFormatted}
            </Text>
          </Section>
          <Section style={{ textAlign: "center", margin: "20px 0 24px 0" }}>
            <Button style={button} href={bookingUrl}>
              Aufenthalt jetzt buchen
            </Button>
          </Section>
          <Text style={small}>
            So funktioniert&apos;s: Buchung wie gewohnt starten, im Rabatt-Code-Feld den Gutschein-Code
            eintragen. Falls der Gutschein-Wert größer als die Buchungssumme ist, bleibt der Restbetrag
            auf dem Code, bis er aufgebraucht ist.
          </Text>
          <Text style={small}>
            Hüttengrüße,<br />Vorstand der Skifreunde Gütersloh e.V.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
