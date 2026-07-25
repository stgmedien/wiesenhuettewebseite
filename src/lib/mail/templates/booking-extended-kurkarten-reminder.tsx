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
  kurtaxePersons: number;
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

export default function BookingExtendedKurkartenReminderEmail({
  bookingNumber,
  guestName,
  oldDeparture,
  newDeparture,
  extraNights,
  kurtaxePersons,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Kurkarten nachmelden — {bookingNumber} verlängert</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · To-do</Text>
          <Heading style={heading}>Kurkarten nachmelden.</Heading>
          <Text style={text}>
            Buchung <strong>{bookingNumber}</strong> ({guestName}) wurde vom Gast selbst
            verlängert — die AVS-Kurkarten-Meldung deckt den neuen Zeitraum noch nicht ab.
          </Text>
          <Section
            style={{
              backgroundColor: "#EFE6D8",
              borderLeft: "4px solid #7a3a20",
              padding: "16px 20px",
              borderRadius: "12px",
              margin: "20px 0",
            }}
          >
            <Text style={{ ...text, margin: 0 }}>
              Abreise: <strong>{oldDeparture} → {newDeparture}</strong> ({extraNights}{" "}
              {extraNights === 1 ? "Nacht" : "Nächte"} mehr)
              <br />
              Betroffen (ab 16 Jahren): <strong>{kurtaxePersons} Personen</strong>
            </Text>
          </Section>
          <Text style={text}>
            Bitte die zusätzlichen {extraNights} {extraNights === 1 ? "Nacht" : "Nächte"} für
            diese Buchung manuell im AVS-Meldeschein-Portal bei Winterberg nachmelden — das kann
            das System nicht automatisch.
          </Text>
          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>Skifreunde Gütersloh e.V. · automatische Benachrichtigung</Text>
        </Container>
      </Body>
    </Html>
  );
}
