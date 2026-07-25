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
  bookingNumber: string;
  guestName: string;
  oldDeparture: string;
  newDeparture: string;
  extraNights: number;
  deltaCents: number;
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

export default function BookingExtendedInternalEmail({
  bookingNumber,
  guestName,
  oldDeparture,
  newDeparture,
  extraNights,
  deltaCents,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{`Verlängerung ${bookingNumber} — ${extraNights} Nächte mehr`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Hüttenservice</Text>
          <Heading style={heading}>Aufenthalt verlängert.</Heading>
          <Text style={text}>Hallo Dana, Herr Klauke, liebe Fam. Brandenburg,</Text>
          <Text style={text}>
            der Gast hat seinen Aufenthalt selbst über das Konto verlängert — bitte im Kalender
            berücksichtigen:
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
              Buchung: <strong>{bookingNumber}</strong>
              <br />
              Gast: <strong>{guestName}</strong>
              <br />
              Abreise: <strong>{oldDeparture} → {newDeparture}</strong> ({extraNights}{" "}
              {extraNights === 1 ? "Nacht" : "Nächte"} mehr)
              <br />
              Mehrbetrag: <strong>{eur(deltaCents)}</strong> (fließt automatisch in die
              Restzahlung T-14)
            </Text>
          </Section>
          <Text style={muted}>
            Keine separate Zahlung nötig — der Betrag wird bei der automatischen Restzahlung mit
            eingezogen.
          </Text>
          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>Skifreunde Gütersloh e.V. · automatische Benachrichtigung</Text>
        </Container>
      </Body>
    </Html>
  );
}
