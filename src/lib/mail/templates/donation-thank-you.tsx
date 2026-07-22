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
  donorName: string;
  amountFormatted: string; // "50,00 €"
  dateFormatted: string; // "22. Juli 2026"
  /** true, wenn die Spende > 300 € war — dann folgt die foermliche
   * Zuwendungsbestaetigung separat vom Vorstand statt des vereinfachten
   * Nachweises in dieser Mail. */
  formalReceiptPending: boolean;
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
const box = {
  backgroundColor: "#EFE6D8",
  padding: "20px",
  borderRadius: "12px",
  margin: "16px 0",
};
const label = { ...muted, fontSize: "13px", margin: "0 0 4px 0" };
const value = { ...text, fontWeight: 600, margin: 0 };

export default function DonationThankYouEmail({
  donorName,
  amountFormatted,
  dateFormatted,
  formalReceiptPending,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Danke für Eure Spende fürs Zeltpodest an der Wiesenhütte!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Skifreunde Gütersloh e.V.</Text>
          <Heading style={heading}>Danke für Eure Spende!</Heading>
          <Text style={text}>Hallo {donorName},</Text>
          <Text style={text}>
            vielen Dank für Eure Unterstützung beim Bau des Zeltpodests an der Wiesenhütte —
            damit helft Ihr uns ganz direkt, die Hütte für alle ein Stück besser zu machen.
          </Text>

          <Section style={box}>
            <Text style={label}>Spendenbetrag</Text>
            <Text style={value}>{amountFormatted}</Text>
            <Hr style={{ borderColor: "#C8CEC4", margin: "12px 0" }} />
            <Text style={label}>Datum</Text>
            <Text style={value}>{dateFormatted}</Text>
            <Hr style={{ borderColor: "#C8CEC4", margin: "12px 0" }} />
            <Text style={label}>Verwendungszweck</Text>
            <Text style={value}>Bau des Zeltpodests an der Wiesenhütte</Text>
          </Section>

          {formalReceiptPending ? (
            <Text style={text}>
              Da Eure Spende 300 € übersteigt, braucht es für das Finanzamt eine{" "}
              <strong>förmliche Zuwendungsbestätigung</strong> nach amtlichem Vordruck. Die stellt
              unser Vorstand für Vereinsfinanzen Euch in den nächsten Tagen separat aus und
              schickt sie Euch zu — bitte habt noch etwas Geduld.
            </Text>
          ) : (
            <>
              <Text style={text}>
                Skifreunde Gütersloh e.V. ist als gemeinnütziger Verein anerkannt. Für Spenden bis
                300 € reicht dem Finanzamt laut § 50 Abs. 4 EStDV ein vereinfachter Nachweis:
                Bewahrt bitte diese E-Mail zusammen mit Eurem Zahlungsbeleg (z. B. der
                Kreditkartenabrechnung) auf — beides zusammen genügt als Nachweis für Eure
                Steuererklärung.
              </Text>
              <Text style={muted}>
                Bei Fragen zur steuerlichen Anerkennung meldet Euch gerne — wir helfen weiter.
              </Text>
            </>
          )}

          <Hr style={{ borderColor: "#C8CEC4", margin: "28px 0 16px" }} />
          <Text style={muted}>
            Fragen? Einfach auf diese E-Mail antworten — Skifreunde Gütersloh e.V.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
