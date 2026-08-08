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
  firstName?: string | null;
  /** Bereits formatiert (formatDateLong) */
  arrival: string;
  /** Bereits formatiert (formatDateLong) */
  departure: string;
  persons?: number | null;
  bookingUrl: string;
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

export default function WaitlistSlotFreeEmail({
  firstName,
  arrival,
  departure,
  persons,
  bookingUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Dein Wunschtermin an der Wiesenhütte ist frei geworden!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Verfügbarkeits-Alarm</Text>
          <Heading style={heading}>Dein Wunschtermin ist frei geworden!</Heading>
          <Text style={text}>Hallo{firstName ? ` ${firstName}` : ""},</Text>
          <Text style={text}>
            gute Nachrichten: Für Deinen Wunschzeitraum an der Wiesenhütte wurde gerade eine
            Buchung storniert — die Hütte ist jetzt wieder komplett frei.
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
              Dein Zeitraum: <strong>{arrival}</strong> bis <strong>{departure}</strong>
              {persons ? (
                <>
                  <br />
                  <span style={{ fontSize: "13px", color: "#5b5b56" }}>
                    Vorgemerkt für {persons} {persons === 1 ? "Person" : "Personen"}
                  </span>
                </>
              ) : null}
            </Text>
          </Section>
          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            <Button href={bookingUrl} style={button}>
              Jetzt buchen
            </Button>
          </Section>
          <Text style={text}>
            Aber nicht zu lange warten: Der Termin ist <strong>nicht reserviert</strong> — es
            gilt „first come, first served“. Wer zuerst bucht, bekommt die Hütte.
          </Text>
          <Text style={muted}>
            Falls der Button nicht funktioniert, nutze diesen Link:
            <br />
            {bookingUrl}
          </Text>
          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>
            Du bekommst diese Mail, weil Du Dich auf der Wiesenhütten-Website für den
            Verfügbarkeits-Alarm zu diesem Zeitraum eingetragen hast. Dein Eintrag wird jetzt
            automatisch gelöscht. Fragen? Einfach auf diese E-Mail antworten — Skifreunde
            Gütersloh e.V.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
