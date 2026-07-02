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
  /** Formatiertes Anreisedatum. */
  arrival: string;
  oldPersons: number;
  newPersons: number;
  deltaCents: number;
  newSubtotalCents: number;
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

export default function PersonsIncreasedEmail({
  firstName,
  bookingNumber,
  arrival,
  oldPersons,
  newPersons,
  deltaCents,
  newSubtotalCents,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Teilnehmerzahl Eurer Buchung {bookingNumber} aktualisiert</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Buchung</Text>
          <Heading style={heading}>Teilnehmerzahl aktualisiert.</Heading>
          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            wir haben die Nachmeldung für Eure Buchung <strong>{bookingNumber}</strong> (Anreise{" "}
            {arrival}) übernommen:
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
              Personen: <strong>{oldPersons} → {newPersons}</strong>
              <br />
              Mehrbetrag: <strong>{eur(deltaCents)}</strong>
              <br />
              Neue Zwischensumme: <strong>{eur(newSubtotalCents)}</strong>
            </Text>
          </Section>
          <Text style={text}>
            Ihr müsst nichts weiter tun: Der Mehrbetrag wird automatisch mit Eurer{" "}
            <strong>Restzahlung</strong> fällig (14 Tage vor Anreise) — es kommt keine separate
            Rechnung.
          </Text>
          <Text style={muted}>
            Bis 15 Tage vor Anreise könnt Ihr weitere Personen über Euer Konto nachmelden. Sollte
            sich die Zahl verringern, meldet Euch bitte direkt bei uns — einfach auf diese E-Mail
            antworten.
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
