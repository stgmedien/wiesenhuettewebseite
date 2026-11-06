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

type Props = { active: boolean };

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
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
  padding: "12px 24px",
  borderRadius: "10px",
  display: "inline-block",
};

/**
 * Interner Status zur Stripe-Banküberweisung (Vorstand).
 * active=false: wöchentliche Erinnerung, dass die Freischaltung noch aussteht.
 * active=true:  einmalige Meldung, dass Gruppen jetzt per Überweisung zahlen können.
 */
export default function BankTransferStatusEmail({ active }: Props) {
  return (
    <Html>
      <Head />
      <Preview>
        {active
          ? "Stripe-Banküberweisung ist jetzt aktiv"
          : "Erinnerung: Stripe-Banküberweisung noch nicht freigeschaltet"}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Intern · Stripe</Text>
          {active ? (
            <>
              <Heading style={heading}>🎉 Banküberweisung ist aktiv.</Heading>
              <Text style={text}>
                Stripe hat die Zahlungsmethode „Bank Transfers" freigeschaltet. Ab sofort können
                Vereins-, Schul- und Firmengruppen im Buchungs-Checkout und über Zahlungslinks per{" "}
                <strong>klassischer SEPA-Überweisung</strong> zahlen (virtuelle deutsche IBAN,
                automatische Zuordnung). Kautions-Rückerstattungen laufen für diese Zahlungen
                automatisch per SEPA zurück.
              </Text>
              <Text style={muted}>
                Empfehlung: einmal eine Test-Buchung als „Verein / Schule" bis zum Checkout
                durchklicken und prüfen, dass „Banküberweisung" als Option erscheint.
              </Text>
            </>
          ) : (
            <>
              <Heading style={heading}>Banküberweisung noch nicht freigeschaltet.</Heading>
              <Text style={text}>
                Die Plattform ist fertig, aber Stripe hat „Bank Transfers" noch nicht aktiviert —
                Gruppen können deshalb weiterhin nur per Karte zahlen. Die Aktivierung muss{" "}
                <strong>Tanja Milse</strong> als eingetragene Vorständin persönlich abschließen
                (ca. 10 Minuten):
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
                  1. Stripe-Dashboard → Einstellungen → Zahlungsmethoden → <strong>Bank Transfers</strong> → „Enable"
                  <br />
                  2. Zwei Info-Schritte bestätigen; Registrierungsdatum ist bereits eingetragen
                  <br />
                  3. <strong>Steuer-ID</strong> eingeben, dann <strong>Ausweis + Selfie</strong> (Stripe Identity, geht per Handy)
                </Text>
              </Section>
              <Section style={{ textAlign: "center", margin: "24px 0" }}>
                <Button href="https://dashboard.stripe.com/settings/payment_methods" style={button}>
                  Zu den Stripe-Zahlungsmethoden
                </Button>
              </Section>
              <Text style={muted}>
                Diese Erinnerung kommt wöchentlich, bis die Freischaltung erledigt ist. Sobald sie
                aktiv ist, meldet sich das System einmalig — es ist kein Deploy nötig.
              </Text>
            </>
          )}
          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>Skifreunde Gütersloh e.V. · automatische Benachrichtigung</Text>
        </Container>
      </Body>
    </Html>
  );
}
