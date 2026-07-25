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
  oldDeparture: string;
  newDeparture: string;
  extraNights: number;
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

export default function BookingExtendedEmail({
  firstName,
  bookingNumber,
  oldDeparture,
  newDeparture,
  extraNights,
  deltaCents,
  newSubtotalCents,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Aufenthalt Eurer Buchung {bookingNumber} verlängert</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Buchung</Text>
          <Heading style={heading}>Aufenthalt verlängert.</Heading>
          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            wir haben die Verlängerung für Eure Buchung <strong>{bookingNumber}</strong>{" "}
            übernommen:
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
              Abreise: <strong>{oldDeparture} → {newDeparture}</strong> ({extraNights}{" "}
              {extraNights === 1 ? "Nacht" : "Nächte"} mehr)
              <br />
              Mehrbetrag: <strong>{eur(deltaCents)}</strong>
              <br />
              Neue Zwischensumme (ohne Kurtaxe/Kaution): <strong>{eur(newSubtotalCents)}</strong>
            </Text>
          </Section>
          <Text style={text}>
            Ihr müsst nichts weiter tun: Der Mehrbetrag wird automatisch mit Eurer{" "}
            <strong>Restzahlung</strong> fällig (14 Tage vor Anreise) — es kommt keine separate
            Rechnung oder Zahlung jetzt.
          </Text>
          <Text style={muted}>
            Die zusätzlichen Nächte werden zum aktuell gültigen Tarif berechnet — auch bei
            Buchungen mit einem älteren, individuell vereinbarten Preis gilt das nur für die
            ursprünglich gebuchten Nächte, nicht für die Verlängerung.
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
