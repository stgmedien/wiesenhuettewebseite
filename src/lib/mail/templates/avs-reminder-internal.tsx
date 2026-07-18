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

type BookingRow = {
  bookingId: string;
  bookingNumber: string;
  guestName: string;
  arrival: string;
};

type Props = {
  bookings: BookingRow[];
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

export default function AvsReminderInternalEmail({ bookings, baseUrl }: Props) {
  return (
    <Html lang="de">
      <Head />
      <Preview>
        {`${bookings.length} ${bookings.length === 1 ? "Buchung braucht" : "Buchungen brauchen"} noch den AVS-Meldeschein-Link`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Intern · Kurkarten-Erinnerung</Text>
          <Heading style={heading}>Noch 3 Wochen bis Anreise — AVS-Link fehlt.</Heading>
          <Text style={text}>
            Bei den folgenden Buchungen wurde noch kein digitaler Meldeschein (AVS-SelfCheck-in)
            an den Gast verschickt. Anreise ist in 21 Tagen — bitte rechtzeitig im AVS-Portal
            (Link-Generator) einen Link erzeugen und in der Buchung eintragen, damit der Gast noch
            genug Zeit zum Ausfüllen hat.
          </Text>
          <Section style={box}>
            {bookings.map((b) => (
              <Text key={b.bookingId} style={{ ...text, margin: "0 0 8px 0" }}>
                <strong>{b.bookingNumber}</strong> · {b.guestName} · Anreise {b.arrival}
                <br />
                <a href={`${baseUrl}/m/buchungen/${b.bookingId}`} style={{ color: "#2F4A35", fontSize: "13px" }}>
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
