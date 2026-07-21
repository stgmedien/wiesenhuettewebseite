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

type FailureRow = {
  bookingId: string | null;
  bookingNumber: string;
  guestName: string;
  templateLabel: string;
  to: string;
  error: string | null;
};

type Props = {
  failures: FailureRow[];
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

export default function MailFailureDigestEmail({ failures, baseUrl }: Props) {
  return (
    <Html lang="de">
      <Head />
      <Preview>
        {`${failures.length} ${failures.length === 1 ? "Mail konnte" : "Mails konnten"} nicht zugestellt werden`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Intern · Zustellungs-Fehler</Text>
          <Heading style={heading}>
            {failures.length === 1
              ? "Eine Mail konnte nicht zugestellt werden."
              : `${failures.length} Mails konnten nicht zugestellt werden.`}
          </Heading>
          <Text style={text}>
            Meist ein Tippfehler in der E-Mail-Adresse. Bitte Kontaktdaten in der Buchung prüfen
            (ggf. den Gast anrufen), korrigieren und die wichtigsten Mails über den
            &bdquo;Erneut senden&ldquo;-Button in der Buchung nachreichen.
          </Text>
          <Section style={box}>
            {failures.map((f, i) => (
              <Text key={i} style={{ ...text, margin: "0 0 8px 0" }}>
                <strong>{f.bookingNumber}</strong> · {f.guestName} · {f.templateLabel} an {f.to}
                {f.error && (
                  <>
                    <br />
                    <span style={{ fontSize: "13px", color: "#5b5b56" }}>{f.error}</span>
                  </>
                )}
                {f.bookingId && (
                  <>
                    <br />
                    <a
                      href={`${baseUrl}/m/buchungen/${f.bookingId}`}
                      style={{ color: "#2F4A35", fontSize: "13px" }}
                    >
                      Buchung im Manager öffnen
                    </a>
                  </>
                )}
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
