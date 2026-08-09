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
  institution?: string | null;
  arrival: string;
  departure: string;
  remainderCents: number;
  depositCents: number;
  /** Spätester Überweisungstermin (2 Wochen vor Anreise), formatiert. */
  deadline: string;
  /** Zuletzt gespeicherter AVS-SelfCheck-in-Link, falls schon einer verschickt wurde. */
  avsCheckinLink?: string | null;
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
  color: "#F7F7F2",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "16px",
  fontWeight: 600,
  textDecoration: "none",
  padding: "14px 28px",
  borderRadius: "10px",
  display: "inline-block",
};

const eur = (c: number) =>
  (c / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export default function RestzahlungRequestEmail({
  firstName,
  bookingNumber,
  institution,
  arrival,
  departure,
  remainderCents,
  depositCents,
  deadline,
  avsCheckinLink,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Restzahlung Eurer Buchung {bookingNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Restzahlung</Text>
          <Heading style={heading}>In 3 Wochen geht&apos;s los — bitte um Überweisung.</Heading>
          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            Eure Anreise zur Wiesenhütte rückt näher{institution ? ` (${institution})` : ""} — in
            drei Wochen ist es soweit ({arrival} bis {departure}). Zeit für die Restzahlung Eurer
            Buchung <strong>{bookingNumber}</strong>.
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
              Offener Betrag: <strong>{eur(remainderCents)}</strong>
              <br />
              <span style={{ fontSize: "13px", color: "#5b5b56" }}>
                inkl. {eur(depositCents)} Kaution · Eure Anzahlung von 100,00 € ist bereits
                verrechnet.
              </span>
            </Text>
          </Section>
          <Text style={text}>
            Bitte überweist den Betrag bis spätestens <strong>{deadline}</strong> (2 Wochen vor
            Anreise) auf folgendes Konto:
          </Text>
          <Section
            style={{
              backgroundColor: "#F7F7F2",
              border: "1px solid #C8CEC4",
              padding: "16px 20px",
              borderRadius: "12px",
              margin: "8px 0 20px 0",
            }}
          >
            <Text style={{ ...text, margin: 0 }}>
              Sparkasse Gütersloh
              <br />
              IBAN: DE13 4785 0065 0008 0013 31
              <br />
              Kontoinhaber: Skifreunde Gütersloh e.V.
              <br />
              Verwendungszweck: {bookingNumber}
            </Text>
          </Section>
          {avsCheckinLink ? (
            <>
              <Text style={text}>
                Euer Link zum digitalen Check-in (Kurkarten) ist noch offen:
              </Text>
              <Section style={{ textAlign: "center", margin: "20px 0" }}>
                <Button href={avsCheckinLink} style={button}>
                  Jetzt ausfüllen
                </Button>
              </Section>
              <Text style={muted}>
                Bitte für alle Erwachsenen (ab 16 Jahre) die vollständigen Namen eintragen — das
                ist Voraussetzung für die Kurtaxe-Abrechnung mit Winterberg. Falls der Button nicht
                funktioniert, nutzt diesen Link:
                <br />
                {avsCheckinLink}
              </Text>
            </>
          ) : (
            <Text style={text}>
              Falls Ihr Euren Link zum digitalen Check-in (Kurkarten) noch nicht bekommen habt,
              meldet Euch kurz bei uns.
            </Text>
          )}
          <Text style={muted}>
            Die Kaution wird innerhalb von 14 Tagen nach mangelfreier Abreise vollständig
            zurückerstattet.
          </Text>
          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>
            Fragen? Einfach auf diese E-Mail antworten — Skifreunde Gütersloh e.V.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
