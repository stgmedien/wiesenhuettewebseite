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

type Props = {
  bookingNumber: string;
  guestName: string;
  guestPhone?: string | null;
  arrival: string;
  departure: string;
  persons: number;
  nights: number;
  purpose?: string | null;
  managerUrl: string;
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
const button = {
  backgroundColor: "#2F4A35",
  color: "#F7F7F2",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "16px",
  fontWeight: 600,
  padding: "14px 24px",
  borderRadius: "14px",
  textDecoration: "none",
  display: "inline-block",
};

export default function HuettenwartNoticeEmail({
  bookingNumber,
  guestName,
  guestPhone,
  arrival,
  departure,
  persons,
  nights,
  purpose,
  managerUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>In 7 Tagen kommt eine Gruppe zur Wiesenhütte — bitte Übergabe vorbereiten</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Hüttenwart</Text>
          <Heading style={heading}>In 7 Tagen kommt eine Gruppe.</Heading>

          <Text style={text}>Hallo Toni,</Text>
          <Text style={text}>
            in einer Woche reist die nächste Gruppe an. Hier die Eckdaten, damit Du die Übergabe
            und Abnahme vorbereiten kannst:
          </Text>

          <Section style={{ backgroundColor: "#EFE6D8", padding: "16px 20px", borderRadius: "12px", margin: "16px 0" }}>
            <Text style={{ ...muted, margin: 0 }}>Buchung</Text>
            <Text style={{ ...text, fontWeight: 600, margin: "4px 0 12px" }}>{bookingNumber}</Text>
            <Text style={{ ...muted, margin: 0 }}>Gruppe / Bucher</Text>
            <Text style={{ ...text, fontWeight: 600, margin: "4px 0 12px" }}>
              {guestName}
              {guestPhone ? ` · ${guestPhone}` : ""}
            </Text>
            <Text style={{ ...muted, margin: 0 }}>Zeitraum</Text>
            <Text style={{ ...text, fontWeight: 600, margin: "4px 0 12px" }}>
              {arrival} bis {departure} · {nights} Nächte · {persons} Personen
            </Text>
            {purpose ? (
              <>
                <Text style={{ ...muted, margin: 0 }}>Anlass</Text>
                <Text style={{ ...text, fontWeight: 600, margin: "4px 0 0" }}>{purpose}</Text>
              </>
            ) : null}
          </Section>

          <Text style={text}>
            Über das Portal kannst Du Dir die Buchung im Detail ansehen und die Übergabe (Check-in)
            sowie die Abnahme (Check-out) direkt dokumentieren:
          </Text>

          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <EmailButton href={managerUrl} style={button}>
              Buchung & Abnahme im Portal öffnen
            </EmailButton>
          </Section>

          <Text style={muted}>
            Falls der Button nicht funktioniert, hier der direkte Link:
            <br />
            <a href={managerUrl}>{managerUrl}</a>
          </Text>

          <Text style={muted}>
            Hinweis: Für die Ansicht im Portal musst Du als Manager angemeldet sein. Fragen? Einfach
            auf diese Mail antworten.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
