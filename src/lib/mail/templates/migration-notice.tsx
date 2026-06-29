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
  Hr,
} from "@react-email/components";

type Props = {
  firstName: string;
  /** Buchungs-/Zahlungslink (Stripe). Pro Empfänger individuell beim echten Versand. */
  bookingUrl: string;
  /** Link zur Datenschutzerklärung. */
  datenschutzUrl: string;
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
  margin: "0 0 14px 0",
};
const muted = { ...text, color: "#5b5b56", fontSize: "14px" };
const li = { ...text, margin: "0 0 8px 0" };
const button = {
  backgroundColor: "#2F4A35",
  color: "#F7F7F2",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "16px",
  fontWeight: 600,
  padding: "14px 26px",
  borderRadius: "14px",
  textDecoration: "none",
  display: "inline-block",
};
const deadlineBox = {
  backgroundColor: "#EFE6D8",
  borderLeft: "4px solid #2F4A35",
  padding: "14px 18px",
  borderRadius: "10px",
  margin: "8px 0 4px",
};

export default function MigrationNoticeEmail({
  firstName,
  bookingUrl,
  datenschutzUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Eure Wiesenhütte-Anfrage bleibt — und ist jetzt direkt buchbar</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Skifreunde Gütersloh e.V.</Text>
          <Heading style={heading}>
            Eure Anfrage bleibt — und ist jetzt direkt buchbar.
          </Heading>

          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            hinter den Kulissen der Wiesenhütte hat sich etwas getan — und weil Ihr bei uns eine
            Buchung angefragt habt, möchten wir Euch kurz und ehrlich ins Bild setzen.
          </Text>
          <Text style={text}>
            Bisher haben wir Eure Anfragen von Hand bearbeitet. Ab jetzt läuft das über unser neues
            Online-System unter <strong>wiesenhütte.com</strong> — übersichtlicher für Euch, weniger
            Zettelwirtschaft für uns. An der Hütte, an unserem Verein und an dem, was Ihr bei uns
            erlebt, ändert das nichts.
          </Text>

          <Text style={{ ...text, fontWeight: 700, margin: "20px 0 8px" }}>
            Was für Euch gleich bleibt:
          </Text>
          <Text style={li}>
            • <strong>Eure Anfrage bleibt vorgemerkt.</strong> Sie geht nicht verloren, sondern
            wandert einfach mit ins neue System.
          </Text>
          <Text style={li}>
            • <strong>Euer Ansprechpartner bleiben die Skifreunde Gütersloh e.V.</strong> Ihr habt
            Euch an unseren Verein gewandt — und das bleibt so. Eure Buchung kommt weiterhin mit uns
            zustande.
          </Text>
          <Text style={li}>
            • <strong>Eure Preise bleiben.</strong> Auch wenn wir im neuen System neue Konditionen
            hinterlegt haben: Die Preise, die wir Euch für Eure Anfrage genannt bzw. zugeschickt
            haben, gelten für Euch selbstverständlich weiter. Da kommt nichts Neues oben drauf.
          </Text>

          <Hr style={{ borderColor: "#C8CEC4", margin: "24px 0 20px" }} />

          <Text style={{ ...text, fontWeight: 700, margin: "0 0 8px" }}>
            Jetzt verbindlich buchen — in zwei Minuten:
          </Text>
          <Text style={text}>
            Eure Buchung könnt Ihr ab sofort direkt online abschließen und sicher per Stripe
            (Kreditkarte oder SEPA) bezahlen. Ein Klick genügt:
          </Text>

          <Section style={{ textAlign: "center", margin: "20px 0" }}>
            <EmailButton href={bookingUrl} style={button}>
              Jetzt buchen & bezahlen
            </EmailButton>
          </Section>

          <Section style={deadlineBox}>
            <Text style={{ ...text, margin: 0, fontWeight: 600 }}>
              Bitte innerhalb der nächsten 14 Tage abschließen.
            </Text>
            <Text style={{ ...muted, margin: "6px 0 0" }}>
              Geht in dieser Zeit keine Buchung ein, geben wir Eure Anfrage und den Zeitraum
              automatisch wieder frei (die Anfrage wird storniert). So bleibt die Hütte fair für
              alle verfügbar.
            </Text>
          </Section>

          <Text style={muted}>
            Falls der Button nicht funktioniert, hier der direkte Link:
            <br />
            <a href={bookingUrl}>{bookingUrl}</a>
          </Text>

          <Hr style={{ borderColor: "#C8CEC4", margin: "24px 0 20px" }} />

          <Text style={{ ...text, fontWeight: 700, margin: "0 0 8px" }}>
            Ganz transparent — zu Euren Daten:
          </Text>
          <Text style={text}>
            Als Teil des Umzugs ins neue System sind die Daten aus Eurer Anfrage jetzt auf
            wiesenhütte.com hinterlegt, damit wir sie für Euch sauber weiterführen können. Falls Ihr
            damit nicht einverstanden seid, könnt Ihr dem jederzeit widersprechen — wie das geht und
            welche Rechte Ihr habt, findet Ihr in unserer Datenschutzerklärung unter{" "}
            <a href={datenschutzUrl}>wiesenhütte.com/datenschutz</a>. Eine kurze Mail an uns genügt.
          </Text>

          <Text style={text}>
            Fragen — zu Eurer Anfrage, zum neuen System oder zu sonst irgendetwas? Antwortet einfach
            auf diese Mail oder schreibt uns an hello@wiesenhütte.com. Wir sind wie immer für Euch
            da.
          </Text>
          <Text style={text}>Wir freuen uns darauf, Euch in der Wiesenhütte zu begrüßen.</Text>

          <Text style={{ ...text, margin: "20px 0 0" }}>
            Herzliche Grüße
            <br />
            Euer Team der Skifreunde Gütersloh e.V.
            <br />
            <span style={{ color: "#5b5b56", fontSize: "14px" }}>wiesenhütte.com</span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
