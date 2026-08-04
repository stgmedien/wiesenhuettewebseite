import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Props = {
  firstName: string;
  bookingNumber: string;
  arrival: string;
  /** Tage bis zur Anreise zum Sendezeitpunkt — normalerweise 3 (planmäßiger
   * T-3-Versand), kann aber kleiner sein, wenn die Kurkarten erst sehr kurz
   * vor Anreise hochgeladen werden und diese Mail als Sofort-Zustellung
   * dient statt auf den planmäßigen T-3-Lauf zu warten. */
  daysUntilArrival: number;
  hasAttachments: boolean;
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

function timeLabel(days: number): string {
  if (days >= 2) return `In ${days} Tagen geht's los.`;
  if (days === 1) return "Morgen geht's los.";
  return "Eure Anreise steht unmittelbar bevor.";
}

export default function ArrivalReminderEmail({
  firstName,
  bookingNumber,
  arrival,
  daysUntilArrival,
  hasAttachments,
}: Props) {
  const headline = timeLabel(daysUntilArrival);
  return (
    <Html>
      <Head />
      <Preview>
        {headline} — Buchung {bookingNumber}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Bald geht&apos;s los</Text>
          <Heading style={heading}>{headline}</Heading>
          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            Eure Anreise ({arrival}) steht kurz bevor. Falls Ihr Toni Klauke noch nicht Eure
            genaue Ankunftszeit mitgeteilt habt — bitte jetzt anrufen, damit er die
            Schlüsselübergabe planen kann: <strong>01516 7448273</strong>.
          </Text>

          {hasAttachments && (
            <Section style={{ backgroundColor: "#EFE6D8", padding: "16px 20px", borderRadius: "12px", margin: "16px 0" }}>
              <Text style={{ ...text, margin: 0 }}>
                Im Anhang: Eure Kurkarten und die Feuerwehr-Meldeliste.
              </Text>
            </Section>
          )}

          <Text style={muted}>
            Fragen? Einfach auf diese E-Mail antworten — Skifreunde Gütersloh e.V.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
