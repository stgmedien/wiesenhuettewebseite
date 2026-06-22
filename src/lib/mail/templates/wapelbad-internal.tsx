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
  email: string;
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
  margin: "0 0 4px 0",
};
const row = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "16px",
  lineHeight: 1.5,
  color: "#111111",
  margin: "0 0 6px 0",
};
const label = { fontWeight: 600, color: "#5b5b56" };

export default function WapelbadInternalEmail({
  name,
  email,
  persons,
  grill,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{`Neue Wapelbad-Anmeldung: ${name} (${persons} ${persons === 1 ? "Person" : "Personen"})`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wapelbad · Anmeldung</Text>
          <Heading style={heading}>Neue Anmeldung eingegangen</Heading>
          <Section>
            <Text style={row}>
              <span style={label}>Name: </span>
              {name}
            </Text>
            <Text style={row}>
              <span style={label}>E-Mail: </span>
              {email}
            </Text>
            <Text style={row}>
              <span style={label}>Personenanzahl: </span>
              {persons}
            </Text>
            <Text style={row}>
              <span style={label}>Grillbuffet (10 €/Person): </span>
              {grill ? `ja — ${persons} × 10 € = ${persons * 10} €` : "nein"}
            </Text>
          </Section>
          <Text style={{ ...row, color: "#5b5b56", fontSize: "13px", marginTop: "16px" }}>
            Antwort an diese Mail geht direkt an die anmeldende Person.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
