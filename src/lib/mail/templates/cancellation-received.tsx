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
  name: string;
  email: string;
  /** "ordentlich" zum Periodenende oder "ausserordentlich" (fristlos). */
  art: "ordentlich" | "ausserordentlich";
  reason?: string | null;
  /** Klartext, wann die Kündigung wirkt. */
  effectiveText: string;
  /** Eingangszeitpunkt (formatiert) — §312k verlangt Datum + Uhrzeit. */
  receivedAt: string;
  /** Wurde ein aktives Stripe-Abo automatisch gekündigt? */
  subscriptionCancelled: boolean;
  /** Interne Variante für den Vorstand. */
  forBoard?: boolean;
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

const artLabel = (a: Props["art"]) =>
  a === "ausserordentlich" ? "außerordentliche (fristlose) Kündigung" : "ordentliche Kündigung";

export default function CancellationReceivedEmail({
  name,
  email,
  art,
  reason,
  effectiveText,
  receivedAt,
  subscriptionCancelled,
  forBoard = false,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>
        {forBoard
          ? `Neue Mitgliedschafts-Kündigung: ${name}`
          : "Eingangsbestätigung Deiner Kündigung"}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Mitgliedschaft</Text>
          <Heading style={heading}>
            {forBoard ? "Neue Kündigung eingegangen" : "Eingangsbestätigung"}
          </Heading>

          {forBoard ? (
            <Text style={text}>
              Über die §312k-Kündigungsseite ist eine Kündigung eingegangen. Bitte im System
              prüfen und (falls kein Online-Abo) manuell bearbeiten:
            </Text>
          ) : (
            <Text style={text}>
              Hallo {name}, wir bestätigen den Eingang Deiner Kündigung der Vereinsmitgliedschaft.
            </Text>
          )}

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
              Name: <strong>{name}</strong>
              <br />
              E-Mail: <strong>{email}</strong>
              <br />
              Art: <strong>{artLabel(art)}</strong>
              <br />
              Eingegangen am: <strong>{receivedAt}</strong>
              <br />
              Wirksam: <strong>{effectiveText}</strong>
              {reason ? (
                <>
                  <br />
                  Grund: <strong>{reason}</strong>
                </>
              ) : null}
            </Text>
          </Section>

          {!forBoard && (
            <>
              <Text style={text}>
                {subscriptionCancelled
                  ? "Dein Beitrags-Abo wurde entsprechend gekündigt — es wird danach nicht mehr automatisch abgebucht."
                  : "Wir bearbeiten Deine Kündigung und melden uns, falls wir noch etwas von Dir brauchen."}
              </Text>
              <Text style={text}>
                Falls diese Kündigung nicht von Dir stammt, antworte bitte umgehend auf diese
                E-Mail.
              </Text>
            </>
          )}

          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>
            Skifreunde Gütersloh e.V. · Fragen? Einfach auf diese E-Mail antworten.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
