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
  Hr,
} from "@react-email/components";

type Props = {
  firstName: string;
  bookingNumber: string;
  arrival: string;
  remainderCents: number;
  daysUntilArrival: number;
  paymentLink?: string | null;
  autoChargePlanned: boolean;
  /** Formatiertes Datum, bis zu dem Personen nachgemeldet werden können (Issue #60). */
  increaseHintUntil?: string | null;
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
const button = {
  backgroundColor: "#2F4A35",
  color: "#ffffff",
  padding: "14px 24px",
  borderRadius: "999px",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-block",
};

const eur = (c: number) =>
  (c / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export default function PaymentReminderEmail({
  firstName,
  bookingNumber,
  arrival,
  remainderCents,
  daysUntilArrival,
  paymentLink,
  autoChargePlanned,
  increaseHintUntil,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Restzahlung Wiesenhütte — {bookingNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Zahlungserinnerung</Text>
          <Heading style={heading}>Restzahlung in {daysUntilArrival} Tagen.</Heading>
          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            Eure Anreise ist am <strong>{arrival}</strong>. Vor der Anreise wird die Restzahlung
            für Eure Buchung <strong>{bookingNumber}</strong> in Höhe von{" "}
            <strong>{eur(remainderCents)}</strong> fällig.
          </Text>

          {autoChargePlanned ? (
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
                <strong>Automatischer Einzug:</strong> Wir buchen den Betrag automatisch 14 Tage
                vor Anreise von der Karte ab, mit der Du die Anzahlung gemacht hast. Du musst
                nichts weiter tun.
              </Text>
            </Section>
          ) : (
            <>
              <Text style={text}>
                Bitte zahle den Betrag rechtzeitig vor Anreise — die Buchung verfällt 48 Stunden
                nach Fälligkeit, wenn keine Zahlung eingeht.
              </Text>
              {paymentLink && (
                <Section style={{ margin: "24px 0" }}>
                  <Button style={button} href={paymentLink}>
                    Jetzt {eur(remainderCents)} zahlen
                  </Button>
                </Section>
              )}
            </>
          )}

          {increaseHintUntil && (
            <Text style={text}>
              <strong>Kommen mehr Personen mit?</strong> Bis zum{" "}
              <strong>{increaseHintUntil}</strong> könnt Ihr die Teilnehmerzahl noch selbst
              nachmelden — in Eurem Konto unter{" "}
              <a href="https://wiesenhuette.de/konto" style={{ color: "#2F4A35" }}>
                wiesenhuette.de/konto
              </a>
              . Der Mehrbetrag fließt automatisch in die Restzahlung.
            </Text>
          )}

          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>
            Fragen? Schreib einfach auf hello@wiesenhütte.com — wir helfen.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
