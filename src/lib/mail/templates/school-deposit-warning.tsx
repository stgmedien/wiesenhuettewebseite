import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button as EmailButton } from "@react-email/components";

type Props = {
  firstName: string;
  bookingNumber: string;
  institution: string;
  arrival: string;
  prepaymentEuroLabel: string; // 50 % Anzahlung, bereits formatiert
  checkoutUrl: string;
  deadlineLabel: string; // Zahlungsfrist (A-16, formatiert)
  stornoFeeLabel: string; // drohende Stornogebuehr, bereits formatiert
  isFinal: boolean; // true = letzte Warnung (T-18)
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
  color: "#A8442A",
  fontSize: "28px",
  fontWeight: 700,
  lineHeight: 1.05,
  margin: "0 0 16px 0",
};
const eyebrow = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  color: "#A8442A",
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
  backgroundColor: "#A8442A",
  color: "#F7F7F2",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "16px",
  fontWeight: 600,
  padding: "14px 24px",
  borderRadius: "14px",
  textDecoration: "none",
  display: "inline-block",
};
const warnBox = {
  backgroundColor: "#F6E5DF",
  borderLeft: "4px solid #A8442A",
  padding: "14px 18px",
  borderRadius: "10px",
  margin: "16px 0",
};

export default function SchoolDepositWarningEmail({
  firstName,
  bookingNumber,
  institution,
  arrival,
  prepaymentEuroLabel,
  checkoutUrl,
  deadlineLabel,
  stornoFeeLabel,
  isFinal,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>
        {isFinal ? "Letzte Erinnerung" : "Erinnerung"}: Anzahlung für Eure Hüttenfahrt noch offen
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>
            Wiesenhütte · {isFinal ? "Letzte Erinnerung" : "Erinnerung"}
          </Text>
          <Heading style={heading}>
            {isFinal ? "Letzte Erinnerung: Anzahlung offen." : "Anzahlung noch offen."}
          </Heading>

          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            für Eure Hüttenfahrt für <strong>{institution}</strong> (Anreise {arrival}) ist die
            Anzahlung von <strong>{prepaymentEuroLabel}</strong> bei uns noch nicht eingegangen.
          </Text>

          <Section style={warnBox}>
            <Text style={{ ...text, margin: 0, fontWeight: 600 }}>
              Bitte bis spätestens {deadlineLabel} zahlen.
            </Text>
            <Text style={{ ...muted, margin: "6px 0 0" }}>
              Geht die Anzahlung nicht fristgerecht ein, wird die Buchung storniert und es fällt
              eine Stornogebühr von {stornoFeeLabel} an.
            </Text>
          </Section>

          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <EmailButton href={checkoutUrl} style={button}>
              Jetzt Anzahlung leisten
            </EmailButton>
          </Section>

          <Text style={muted}>
            Falls der Button nicht funktioniert, hier der direkte Link:
            <br />
            <a href={checkoutUrl}>{checkoutUrl}</a>
          </Text>

          <Text style={muted}>
            Buchungsnummer: <strong>{bookingNumber}</strong>. Habt Ihr schon gezahlt? Dann ist diese
            Mail gegenstandslos. Bei Fragen einfach auf diese Mail antworten.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
