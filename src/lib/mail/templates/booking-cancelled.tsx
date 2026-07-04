import {
  Body,
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
  firstName: string;
  bookingNumber: string;
  feePercent: number;
  feeCents: number;
  baseCents: number;
  baseLabel: string;
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

const eur = (c: number) =>
  (c / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export default function BookingCancelledEmail({
  firstName,
  bookingNumber,
  feePercent,
  feeCents,
  baseCents,
  baseLabel,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Stornierung bestätigt — Buchung {bookingNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Stornierung</Text>
          <Heading style={heading}>Stornierung bestätigt.</Heading>
          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            wir haben Deine Buchung <strong>{bookingNumber}</strong> storniert. Hier die Übersicht
            der Konditionen:
          </Text>
          <Section
            style={{
              backgroundColor: "#EFE6D8",
              borderLeft: "4px solid #2F4A35",
              padding: "16px 20px",
              borderRadius: "12px",
              margin: "20px 0",
            }}
          >
            <Text style={{ ...text, margin: 0 }}>
              {baseLabel}: <strong>{eur(baseCents)}</strong>
              <br />
              Storno-Gebühr ({feePercent}%): <strong>{eur(feeCents)}</strong>
              <br />
              Erstattung auf diesen Anteil: <strong>{eur(Math.max(0, baseCents - feeCents))}</strong>
            </Text>
          </Section>
          <Text style={text}>
            Bereits gezahlte Beträge erstatten wir abzüglich der Storno-Gebühr innerhalb von
            14 Tagen über den ursprünglichen Zahlweg. Endreinigung und Kaution (sofern
            eingezogen) werden vollständig zurückgebucht.
          </Text>
          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>
            Du hast Fragen? Schreib einfach auf hello@wiesenhütte.com — wir helfen weiter.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
