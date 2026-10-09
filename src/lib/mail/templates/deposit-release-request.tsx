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
  guestName: string;
  bookingNumber: string;
  stayLabel: string;
  amountFormatted: string;
  reference: string;
  releasedBy: string;
  releasedAtFormatted: string;
  /** Freitext des Managers, z. B. "inkl. 1,37 € Überzahlung". */
  note?: string;
  /** Hinweis, wann und wie der Gast gezahlt hat — zum Finden der IBAN im Kontoauszug. */
  incomingHint?: string;
  confirmUrl: string;
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
  backgroundColor: "#e3ecdc",
  borderLeft: "4px solid #6FA05F",
  borderRadius: "12px",
  padding: "16px 20px",
  margin: "16px 0",
};
const amount = { ...heading, fontSize: "34px", margin: "4px 0 8px 0" };
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

export default function DepositReleaseRequestEmail({
  guestName,
  bookingNumber,
  stayLabel,
  amountFormatted,
  reference,
  releasedBy,
  releasedAtFormatted,
  note,
  incomingHint,
  confirmUrl,
}: Props) {
  return (
    <Html lang="de">
      <Head />
      <Preview>{`Freigabe: ${amountFormatted} Kaution an ${guestName} zurücküberweisen`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Intern · Kaution freigegeben</Text>
          <Heading style={heading}>Bitte Kaution zurücküberweisen.</Heading>
          <Text style={text}>
            Die Hütte ist abgenommen, die Kaution für diese Buchung ist zur Rückzahlung
            freigegeben.
          </Text>
          <Section style={box}>
            <Text style={eyebrow}>Betrag</Text>
            <Text style={amount}>{amountFormatted}</Text>
            <Text style={{ ...text, margin: "0 0 4px 0" }}>
              <strong>Empfänger:</strong> {guestName}
            </Text>
            <Text style={{ ...text, margin: "0 0 4px 0" }}>
              <strong>Verwendungszweck:</strong> {reference}
            </Text>
            <Text style={{ ...text, margin: 0 }}>
              <strong>Buchung:</strong> {bookingNumber} · {stayLabel}
            </Text>
          </Section>
          {note && (
            <Text style={text}>
              <strong>Hinweis:</strong> {note}
            </Text>
          )}
          <Text style={text}>
            Die IBAN steht im Kontoauszug beim Zahlungseingang des Gastes.
            {incomingHint ? ` ${incomingHint}` : ""}
          </Text>
          <Text style={text}>
            Wenn die Überweisung raus ist, bestätige sie bitte hier. Erst dann bekommt der Gast
            die Nachricht, dass die Kaution unterwegs ist.
          </Text>
          <Section style={{ margin: "20px 0" }}>
            <Button href={confirmUrl} style={button}>
              Überweisung bestätigen
            </Button>
          </Section>
          <Text style={muted}>
            Freigegeben von {releasedBy} am {releasedAtFormatted}. Der Link funktioniert ohne
            Anmeldung.
          </Text>
          <Text style={muted}>Automatische Systemnachricht · wiesenhuette.de</Text>
        </Container>
      </Body>
    </Html>
  );
}
