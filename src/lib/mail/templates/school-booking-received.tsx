import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

type Props = {
  firstName: string;
  bookingNumber: string;
  institution: string;
  arrival: string;
  departure: string;
  persons: number;
  nights: number;
  prepaymentEuroLabel: string; // 50 % Anzahlung, bereits formatiert
  depositDueDateLabel: string; // wann die Anzahlung faellig wird (A-30, formatiert)
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
  lineHeight: 1.05,
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

export default function SchoolBookingReceivedEmail({
  firstName,
  bookingNumber,
  institution,
  arrival,
  departure,
  persons,
  nights,
  prepaymentEuroLabel,
  depositDueDateLabel,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Eure Hüttenfahrt ist reserviert — Anzahlung erst später fällig</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Schulgruppe</Text>
          <Heading style={heading}>Eure Hüttenfahrt ist reserviert.</Heading>

          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            vielen Dank für Eure Buchung für <strong>{institution}</strong>. Wir haben den Zeitraum
            für Euch reserviert — Ihr müsst jetzt noch nichts zahlen.
          </Text>

          <Section style={{ backgroundColor: "#EFE6D8", padding: "16px 20px", borderRadius: "12px", margin: "16px 0" }}>
            <Text style={{ ...muted, margin: 0 }}>Buchung</Text>
            <Text style={{ ...text, fontWeight: 600, margin: "4px 0 12px" }}>{bookingNumber}</Text>
            <Text style={{ ...muted, margin: 0 }}>Zeitraum</Text>
            <Text style={{ ...text, fontWeight: 600, margin: "4px 0 12px" }}>
              {arrival} bis {departure} · {nights} Nächte · {persons} Personen
            </Text>
            <Text style={{ ...muted, margin: 0 }}>Anzahlung (50 %)</Text>
            <Text style={{ ...text, fontWeight: 600, margin: "4px 0 0" }}>{prepaymentEuroLabel}</Text>
          </Section>

          <Text style={text}>
            Weil Schulgruppen die Elternbeiträge erst sammeln müssen, wird die Anzahlung{" "}
            <strong>nicht sofort</strong>, sondern erst rund 30 Tage vor Anreise fällig. Am{" "}
            <strong>{depositDueDateLabel}</strong> bekommt Ihr von uns automatisch eine E-Mail mit
            einem Zahlungslink. Die Restzahlung folgt 14 Tage vor Anreise.
          </Text>

          <Text style={muted}>
            Bei Fragen einfach auf diese Mail antworten oder an hello@wiesenhütte.com.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
