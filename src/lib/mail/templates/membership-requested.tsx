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
  memberId: string | null;
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

export default function MembershipRequestedEmail({ firstName, memberId }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Dein Antrag auf Vereinsmitgliedschaft ist eingegangen</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Skifreunde Gütersloh · Mitgliedschaft</Text>
          <Heading style={heading}>Antrag eingegangen.</Heading>
          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            wir haben Deinen Antrag auf Verifizierung Deiner Vereinsmitgliedschaft erhalten.
            Vielen Dank!
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
              <strong>Wie geht's weiter?</strong> Der Vorstand der Skifreunde Gütersloh prüft
              Deine Angaben und gleicht sie mit dem Vereinsverzeichnis ab. In der Regel dauert
              das ein paar Werktage. Sobald wir bestätigt haben, erhältst Du eine weitere
              E-Mail — und siehst den neuen Status in Deinem Konto.
            </Text>
            {memberId && (
              <Text style={{ ...muted, marginTop: 12 }}>
                Übermittelte Mitgliedsnummer: <strong>{memberId}</strong>
              </Text>
            )}
          </Section>
          <Text style={text}>
            Bis zur Bestätigung gelten für Buchungen die regulären Nichtmitglieds-Tarife
            (22 € pro Erwachsenem und Nacht; Mitglieder erhalten 50 % Nachlass).
          </Text>
          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>
            Du kannst Deinen Antrag jederzeit im{" "}
            <a href="https://www.wiesenhütte.com/konto/profil" style={{ color: "#2F4A35" }}>
              Konto-Profil
            </a>{" "}
            zurückziehen.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
