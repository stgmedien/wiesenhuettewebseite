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
  fileNames: string[];
  note?: string;
  uploadedBy: string;
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

export default function AvsInvoiceFinanceEmail({ fileNames, note, uploadedBy }: Props) {
  const plural = fileNames.length > 1;
  return (
    <Html lang="de">
      <Head />
      <Preview>{plural ? `${fileNames.length} neue AVS-Rechnungen` : "Neue AVS-Rechnung"}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Intern · AVS / Kurbeitrag</Text>
          <Heading style={heading}>
            {plural ? "Neue AVS-Rechnungen zur Zahlung." : "Neue AVS-Rechnung zur Zahlung."}
          </Heading>
          <Text style={text}>
            Hallo Norbert, im Anhang {plural ? "findest du die Rechnungen" : "findest du die Rechnung"}{" "}
            der AVS bzw. Kurverwaltung Winterberg. Bitte überweisen und verbuchen.
          </Text>
          <Section style={box}>
            {fileNames.map((n) => (
              <Text key={n} style={{ ...text, margin: "0 0 4px 0" }}>
                📎 {n}
              </Text>
            ))}
            {note ? (
              <Text style={{ ...text, margin: "8px 0 0 0" }}>
                <strong>Notiz:</strong> {note}
              </Text>
            ) : null}
          </Section>
          <Text style={muted}>
            Hochgeladen von {uploadedBy} im Manager-Bereich · automatische Systemnachricht ·
            wiesenhuette.de
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
