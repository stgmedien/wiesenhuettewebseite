import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

/**
 * Mail an Toni, sobald Kurkarten hochgeladen werden und darin ausländische
 * Gäste stehen: Für sie gilt weiter der Meldeschein mit Unterschrift auf
 * Papier am Anreisetag (§ 29 BMG). Bei Reisegesellschaften über 10 Personen
 * unterschreibt nur die Reiseleitung (§ 29 Abs. 2 Satz 3 BMG). Johannes 11/2026.
 */
type Props = {
  bookingNumber: string;
  guestName: string;
  arrival: string;
  persons: number;
  nationalities: string[];
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

export const meldescheinAuslaenderSubject = (guestName: string, bookingNumber: string, arrival: string) =>
  `Meldeschein unterschreiben lassen: ${guestName} — ${bookingNumber} (Anreise ${arrival})`;

export default function HuettenwartMeldescheinAuslaenderEmail({
  bookingNumber,
  guestName,
  arrival,
  persons,
  nationalities,
}: Props) {
  const group = persons > 10;
  const natLabel = nationalities.join(", ");
  return (
    <Html>
      <Head />
      <Preview>{`Ausländische Gäste (${natLabel}) — Meldeschein bei Anreise unterschreiben lassen`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Hüttenwart</Text>
          <Heading style={heading}>Meldeschein unterschreiben lassen.</Heading>
          <Text style={text}>Hallo Toni,</Text>
          <Text style={text}>
            zur Buchung <strong>{bookingNumber}</strong> ({guestName}, Anreise am {arrival}) reisen
            ausländische Gäste an (Staatsangehörigkeit: <strong>{natLabel}</strong>). Für sie gilt
            weiter die Meldepflicht
            mit Unterschrift auf Papier am Anreisetag.
          </Text>
          <Section
            style={{
              backgroundColor: "#EFE6D8",
              borderLeft: "4px solid #2F4A35",
              padding: "16px 20px",
              borderRadius: "12px",
              margin: "8px 0 20px 0",
            }}
          >
            <Text style={{ ...text, margin: 0 }}>
              <strong>Bitte bei der Schlüsselübergabe:</strong>
              <br />
              1. <strong>Seite 1</strong> der angehängten PDF ausdrucken (Meldeschein mit MS-Nr.
              und Anschrift).
              <br />
              2. Unterschreiben lassen:{" "}
              {group ? (
                <>
                  Bei einer Gruppe über 10 Personen reicht die Unterschrift der{" "}
                  <strong>Reiseleitung</strong> (in der Regel {guestName}).
                </>
              ) : (
                <>
                  <strong>Jede erwachsene ausländische Person</strong> unterschreibt (mitreisende
                  Ehepartner und minderjährige Kinder nicht).
                </>
              )}
              <br />
              3. Den <strong>Ausweis</strong> der unterschreibenden Person zeigen lassen.
              <br />
              4. Den unterschriebenen Meldeschein an Johannes geben — er muss ein Jahr
              aufbewahrt werden.
            </Text>
          </Section>
          <Text style={text}>
            Im Anhang: Kurkarten mit Meldeschein. Die Kurkarten bekommt die Gruppe wie gewohnt
            zusätzlich per Mail.
          </Text>
          <Text style={muted}>Fragen? Einfach auf diese Mail antworten.</Text>
        </Container>
      </Body>
    </Html>
  );
}
