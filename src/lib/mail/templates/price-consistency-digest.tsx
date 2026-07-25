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

type MismatchRow = {
  bookingId: string;
  bookingNumber: string;
  guestName: string;
  issues: string[];
};

type Props = {
  rows: MismatchRow[];
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
  color: "#7a3a20",
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
  borderLeft: "4px solid #7a3a20",
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

export default function PriceConsistencyDigestEmail({ rows, baseUrl }: Props) {
  return (
    <Html lang="de">
      <Head />
      <Preview>
        {`${rows.length} ${rows.length === 1 ? "Buchung" : "Buchungen"} mit inkonsistenten Preisfeldern`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Intern · Preis-Konsistenz-Check</Text>
          <Heading style={heading}>
            {rows.length === 1
              ? "Eine Buchung hat inkonsistente Preisfelder."
              : `${rows.length} Buchungen haben inkonsistente Preisfelder.`}
          </Heading>
          <Text style={text}>
            Der tägliche Konsistenz-Check hat Buchungen gefunden, bei denen die gespeicherten
            Preisfelder nicht mehr zueinander passen (z. B. Kurtaxe stimmt nicht mit der
            aktuellen Personenzahl überein, oder Zwischensumme ≠ Gesamtsumme). Bitte einmal
            manuell prüfen — hier wird nichts automatisch korrigiert.
          </Text>
          <Section style={box}>
            {rows.map((r) => (
              <Text key={r.bookingId} style={{ ...text, margin: "0 0 10px 0" }}>
                <strong>{r.bookingNumber}</strong> · {r.guestName}
                <br />
                {r.issues.map((issue, i) => (
                  <span key={i} style={{ fontSize: "13px", color: "#5b5b56" }}>
                    {issue}
                    {i < r.issues.length - 1 && <br />}
                  </span>
                ))}
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
