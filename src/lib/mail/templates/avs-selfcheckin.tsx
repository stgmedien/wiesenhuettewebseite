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
  guestName: string;
  bookingNumber: string;
  arrival: string;
  departure: string;
  /** Individueller AVS-SelfCheck-in-Link (im Manager eingetragen). */
  checkinUrl: string;
  /**
   * Neuer Link nach der AVS-Systemumstellung (11/2026): Gast hat schon einen
   * alten Link bekommen und muss den Meldeschein noch einmal ausfüllen.
   */
  reissue?: boolean;
};

export const avsSelfCheckinSubject = (reissue: boolean) =>
  reissue
    ? "Neuer Link für Euren digitalen Check-in — bitte noch einmal ausfüllen"
    : "Euer digitaler Check-in für die Wiesenhütte — bitte vor der Anreise ausfüllen";

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

export default function AvsSelfCheckinEmail({
  guestName,
  bookingNumber,
  arrival,
  departure,
  checkinUrl,
  reissue = false,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{avsSelfCheckinSubject(reissue)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Digitaler Check-in</Text>
          <Heading style={heading}>
            {reissue ? "Bitte noch einmal ausfüllen." : "Bitte vor der Anreise ausfüllen."}
          </Heading>
          <Text style={text}>Hallo {guestName},</Text>
          {reissue && (
            <Section
              style={{
                backgroundColor: "#FBEFE6",
                borderLeft: "4px solid #B85C38",
                padding: "16px 20px",
                borderRadius: "12px",
                margin: "8px 0 20px 0",
              }}
            >
              <Text style={{ ...text, margin: 0 }}>
                <strong>Neuer Link – sorry für den doppelten Aufwand!</strong>
                <br />
                Wegen einer Systemumstellung beim Meldeschein-Anbieter AVS und bei uns im Skiverein
                gilt Euer bisheriger Check-in-Link nicht mehr. Bitte füllt den Meldeschein über den
                neuen Link unten <strong>noch einmal aus – auch wenn Ihr das schon gemacht habt</strong>.
                Eure alten Angaben können wir leider nicht übernehmen. Danke für Euer Verständnis!
              </Text>
            </Section>
          )}
          <Text style={text}>
            vielen Dank für Eure Buchung <strong>{bookingNumber}</strong> ({arrival} bis{" "}
            {departure})! Bitte füllt vor der Anreise den digitalen Meldeschein aus — das ist{" "}
            <strong>gesetzlich vorgeschrieben</strong> (Meldepflicht und Kurbeitrag) und dauert nur
            wenige Minuten:
          </Text>
          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            <Button href={checkinUrl} style={button}>
              Digitalen Meldeschein ausfüllen
            </Button>
          </Section>
          <Text style={muted}>Falls der Button nicht funktioniert: {checkinUrl}</Text>
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
              <strong>Gut zu wissen:</strong>
              <br />–{" "}
              <strong>Bitte füllt den Meldeschein bis spätestens 14 Tage vor Anreise aus.</strong>{" "}
              Wir brauchen danach noch Zeit, um Eure Kurkarten zu erstellen.
              <br />– Du als Buchende:r trägst Dich mit Namen und Anschrift ein.
              <br />– Bitte tragt dann <strong>alle Mitreisenden einzeln als Begleitpersonen</strong>{" "}
              ein, auch Kinder — jeweils mit Vor- und Nachname und der passenden Kategorie:
              Erwachsen (ab 16 Jahren), Kind (4–15 Jahre) oder Kleinkind (0–3 Jahre). Am besten
              legt Ihr Euch die Teilnehmerliste vorher bereit.
              <br />– <strong>Das lohnt sich auch für Kinder:</strong> Sie sind vom Kurbeitrag
              befreit, bekommen aber eine eigene SauerlandCard. Damit fahrt Ihr alle kostenlos mit
              Bus und Bahn im Sauerland und erhaltet Ermäßigungen bei vielen Freizeitangeboten.{" "}
              <a
                href="https://www.winterberg.de/service-kontakt/gaestekarten/sauerlandcard/"
                style={{ color: "#2F4A35" }}
              >
                Mehr zur SauerlandCard
              </a>
              <br />– <strong>Es kommt noch jemand dazu oder fällt aus?</strong> Nach dem Absenden
              könnt Ihr den Meldeschein nicht mehr selbst ändern. Schreibt uns einfach kurz, wir
              tragen es für Euch nach.
              <br />– Eure <strong>Kurkarten</strong> schicken wir Euch vor der Anreise per E-Mail
              zu — bitte zur Anreise mitbringen (digital oder ausgedruckt).
            </Text>
          </Section>
          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>
            Fragen? Einfach auf diese E-Mail antworten — Skifreunde Gütersloh e.V.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
