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
  bookingNumber: string;
  guestName: string;
  guestPhone?: string | null;
  arrival: string;
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

function timeLabel(days: number, guestName: string): string {
  if (days >= 2) return `In ${days} Tagen kommt ${guestName}.`;
  if (days === 1) return `Morgen kommt ${guestName}.`;
  return `${guestName} kommt sehr bald.`;
}

export default function HuettenwartArrivalReminderEmail({
  bookingNumber,
  guestName,
  guestPhone,
  arrival,
  daysUntilArrival,
  hasAttachments,
}: Props) {
  const headline = timeLabel(daysUntilArrival, guestName);
  return (
    <Html>
      <Head />
      <Preview>{headline} — falls noch kein Anruf kam</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Hüttenwart</Text>
          <Heading style={heading}>{headline}</Heading>
          <Text style={text}>Hallo Toni,</Text>
          <Text style={text}>
            Buchung {bookingNumber}, Anreise am {arrival}. Der Gast wurde gebeten, sich bei Dir
            zu melden, falls die Ankunftszeit noch nicht abgestimmt ist
            {guestPhone ? (
              <>
                {" "}
                — Kontakt: <strong>{guestPhone}</strong>
              </>
            ) : null}
            .
          </Text>

          {hasAttachments && (
            <Section style={{ backgroundColor: "#EFE6D8", padding: "16px 20px", borderRadius: "12px", margin: "16px 0" }}>
              <Text style={{ ...text, margin: 0 }}>
                Im Anhang: Kurkarten und Feuerwehr-Meldeliste.
              </Text>
            </Section>
          )}

          <Text style={muted}>Fragen? Einfach auf diese Mail antworten.</Text>
        </Container>
      </Body>
    </Html>
  );
}
