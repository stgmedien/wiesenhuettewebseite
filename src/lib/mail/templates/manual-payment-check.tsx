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

type ManualPaymentRow = {
  bookingId: string;
  bookingNumber: string;
  guestName: string;
  arrival: string;
  amountCents: number;
};

type Props = {
  rows: ManualPaymentRow[];
  baseUrl: string;
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

const formatEuro = (cents: number): string =>
  (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export default function ManualPaymentCheckEmail({ rows, baseUrl }: Props) {
  return (
    <Html lang="de">
      <Head />
      <Preview>
        {`${rows.length} manuelle ${rows.length === 1 ? "Buchung" : "Buchungen"} in 6 Tagen — Kontoeingang prüfen`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Intern · Manuelle Zahlungen</Text>
          <Heading style={heading}>
            {rows.length === 1
              ? "Eine manuelle Buchung in 6 Tagen — bitte Kontoeingang prüfen."
              : `${rows.length} manuelle Buchungen in 6 Tagen — bitte Kontoeingang prüfen.`}
          </Heading>
          <Text style={text}>
            Bei diesen Buchungen läuft die Zahlung nicht über Stripe — bitte im Vereinskonto
            nachschauen, ob die folgenden Überweisungen bereits eingegangen sind, und falls ja, in
            der Buchung über &bdquo;Restzahlung + Kaution + Kurtaxe per Überweisung erhalten&ldquo;
            bestätigen.
          </Text>
          <Section style={box}>
            {rows.map((r) => (
              <Text key={r.bookingId} style={{ ...text, margin: "0 0 8px 0" }}>
                <strong>{r.guestName}</strong> · {formatEuro(r.amountCents)} · Anreise {r.arrival}
                <br />
                <span style={{ fontSize: "13px", color: "#5b5b56" }}>{r.bookingNumber}</span>
                <br />
                <a
                  href={`${baseUrl}/m/buchungen/${r.bookingId}`}
                  style={{ color: "#2F4A35", fontSize: "13px" }}
                >
                  Buchung im Manager öffnen
                </a>
              </Text>
            ))}
          </Section>
          <Section style={{ margin: "20px 0" }}>
            <EmailButton href={`${baseUrl}/m/buchungen`} style={button}>
              Alle Buchungen ansehen
            </EmailButton>
          </Section>
          <Text style={muted}>Automatische Systemnachricht · wiesenhuette.de</Text>
        </Container>
      </Body>
    </Html>
  );
}
