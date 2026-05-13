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
} from "@react-email/components";

type Props = {
  firstName: string;
  bookingNumber: string;
  feedbackUrl: string;
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
  margin: "0 0 14px 0",
};
const small = {
  ...text,
  fontSize: "13px",
  color: "#5b5b56",
};
const button = {
  backgroundColor: "#2F4A35",
  borderRadius: "999px",
  color: "#ffffff",
  fontFamily: "Inter, system-ui, sans-serif",
  fontWeight: 600,
  fontSize: "15px",
  padding: "12px 24px",
  textDecoration: "none",
  display: "inline-block",
};

export default function FeedbackRequestEmail({ firstName, bookingNumber, feedbackUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Wie war Dein Aufenthalt? — 2 Minuten Feedback an die Hütte.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Nach dem Aufenthalt</Text>
          <Heading style={heading}>
            Hi {firstName}, wie war&apos;s bei uns?
          </Heading>
          <Text style={text}>
            Wir hoffen, Du hast die Zeit in der Wiesenhütte genossen. Damit wir die Hütte
            weiter besser machen können, würden wir uns sehr über zwei Minuten Deiner Zeit
            freuen.
          </Text>
          <Text style={text}>
            Die Umfrage ist sehr kurz, anonymisierbar und vor allem hilft sie uns konkret —
            wir lesen wirklich jede Antwort.
          </Text>
          <Section style={{ textAlign: "center", margin: "24px 0 16px 0" }}>
            <Button style={button} href={feedbackUrl}>
              Feedback geben
            </Button>
          </Section>
          <Text style={small}>
            Buchung Nr. {bookingNumber}. Der Link ist 90 Tage gültig und kann einmal genutzt
            werden. Wenn Du keine Lust hast, kein Stress — wir nerven Dich nicht weiter.
          </Text>
          <Text style={small}>
            Bis bald in der Wiesenhütte,<br />
            Dein Vorstand der Skifreunde Gütersloh e.V.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
