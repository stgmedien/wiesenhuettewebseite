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
  name: string;
  persons: number;
  grill: boolean;
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
  margin: "0 0 4px 0",
};
const text = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "16px",
  lineHeight: 1.55,
  color: "#111111",
  margin: "0 0 12px 0",
};
const box = {
  backgroundColor: "#EEF3EA",
  borderRadius: "12px",
  padding: "16px 20px",
  margin: "8px 0 16px 0",
};
const muted = { ...text, color: "#5b5b56", fontSize: "14px" };

export default function WapelbadConfirmEmail({ name, persons, grill }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Deine Anmeldung zum Wapelbad ist eingegangen.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Skifreunde Gütersloh · Wapelbad</Text>
          <Heading style={heading}>Danke für deine Anmeldung, {name}!</Heading>
          <Text style={text}>
            Wir freuen uns auf einen gemütlichen Nachmittag mit dir im Wapelbad.
          </Text>

          <Section style={box}>
            <Text style={{ ...text, margin: "0 0 6px 0", fontWeight: 600 }}>
              Samstag, 5. September 2026 · 16 Uhr · Wapelbad
            </Text>
            <Text style={{ ...muted, margin: 0 }}>
              Angemeldet: {persons} {persons === 1 ? "Person" : "Personen"}
              {grill ? ` · Grillbuffet (10 € pro Person, vor Ort)` : ""}
            </Text>
          </Section>

          <Text style={muted}>
            Sollte das Treffen wetterbedingt ausfallen oder verschoben werden,
            melden wir uns rechtzeitig per E-Mail. Fragen? Einfach auf diese Mail
            antworten oder an skifreunde@wiesenhuette.de schreiben.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
