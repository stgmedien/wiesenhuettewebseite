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
  bookingNumber: string;
  arrival: string;
  departure: string;
  persons: number;
  nights: number;
  baseUrl: string;
  kurkartenAttached: boolean;
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

export default function ArrivalInfoEmail({
  firstName,
  bookingNumber,
  arrival,
  departure,
  persons,
  nights,
  baseUrl,
  kurkartenAttached,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Eure Anreise zur Wiesenhütte in 7 Tagen</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Anreise-Info</Text>
          <Heading style={heading}>Bald geht&apos;s los.</Heading>
          <Text style={text}>Hallo {firstName},</Text>
          <Text style={text}>
            in einer Woche fahrt Ihr zur Wiesenhütte. Hier alles Wichtige für die Anreise auf einen
            Blick.
          </Text>

          <Section
            style={{
              backgroundColor: "#EFE6D8",
              borderRadius: "12px",
              padding: "16px 20px",
              margin: "20px 0",
            }}
          >
            <Text style={{ ...text, margin: 0 }}>
              <strong>Buchung:</strong> {bookingNumber}
              <br />
              <strong>Anreise:</strong> {arrival}
              <br />
              <strong>Abreise:</strong> {departure}
              <br />
              <strong>Belegung:</strong> {persons} Personen · {nights} Nächte
            </Text>
          </Section>

          <Heading
            style={{ ...heading, fontSize: "20px", marginTop: 28, marginBottom: 8 }}
          >
            Adresse
          </Heading>
          <Text style={text}>
            Wiesenhütte, Wiesenhütte 1, 59955 Winterberg-Langewiese
          </Text>

          <Heading
            style={{ ...heading, fontSize: "20px", marginTop: 28, marginBottom: 8 }}
          >
            Anfahrt
          </Heading>
          <Text style={text}>
            <strong>Mit dem Auto:</strong> A46 → Abfahrt Bestwig → B480 nach Winterberg →
            Langewiese. Parkplätze vor der Hütte. Im Winter ggf. Schneeketten erforderlich. Bei
            unsicheren Bedingungen oben an der Bundesstraße parken und zu Fuß runter.
          </Text>
          <Text style={text}>
            <strong>Mit dem ÖPNV:</strong> ZOB Winterberg, von dort Bus R28 nach Langewiese,
            Haltestelle „Wiesenhütte&rdquo;.
          </Text>

          <Heading
            style={{ ...heading, fontSize: "20px", marginTop: 28, marginBottom: 8 }}
          >
            Was Ihr mitbringen solltet
          </Heading>
          <Text style={text}>
            Bettwäsche oder Schlafsack, Handtücher, Hausschuhe, Lebensmittel für die Selbstversorgung,
            Spülmittel, Geschirrtücher, Müllsäcke. Brennholz ist vor Ort.
          </Text>

          <Heading
            style={{ ...heading, fontSize: "20px", marginTop: 28, marginBottom: 8 }}
          >
            Wichtig vor der Anreise
          </Heading>
          <Section
            style={{
              backgroundColor: "#EFE6D8",
              borderLeft: "4px solid #2F4A35",
              padding: "16px 20px",
              borderRadius: "12px",
              margin: "0 0 16px 0",
            }}
          >
            <Text style={{ ...text, margin: "0 0 8px 0" }}>
              <strong>Kurkarten:</strong> Solltet Ihr den digitalen Meldeschein noch nicht
              ausgefüllt haben — bitte jetzt nachholen (Link kam per separater Mail von uns). Das
              ist gesetzlich vorgeschrieben (Meldepflicht und Kurbeitrag der Stadt Winterberg,
              Pflicht ab 16 Jahren).{" "}
              {kurkartenAttached ? (
                <>
                  Eure Kurkarten liegen dieser Mail als PDF bei — druckt sie gerne selbst aus oder
                  zeigt sie digital am Handy vor.
                </>
              ) : (
                <>
                  Eure Kurkarten bekommt Ihr rechtzeitig vor Anreise von uns zugeschickt — bitte
                  zur Anreise mitbringen, digital oder ausgedruckt.
                </>
              )}{" "}
              Falls Euch kein Drucker zur Verfügung steht, bringt Toni Klauke sie Euch auf
              Rückfrage auch gerne ausgedruckt mit.
            </Text>
            <Text style={{ ...text, margin: "0 0 8px 0" }}>
              <strong>Spätestens 2 Tage vor Anreise:</strong> teilt Toni Klauke telefonisch Eure
              genaue Ankunftszeit mit (01516 7448273) — er nimmt Euch an der Hütte in Empfang und
              überreicht die Schlüssel.
            </Text>
            <Text style={{ ...text, margin: 0 }}>
              <strong>Das Haus ist eine Nichtraucher-Unterkunft, Haustiere sind nicht gestattet.</strong>{" "}
              Ab 22:00 Uhr gilt Ruhezeit im Ort. Die Hütte ist kein Partyort — übermäßiger
              Alkoholkonsum und laute private Feiern sind nicht erlaubt.
            </Text>
          </Section>
          <Text style={muted}>
            Die vollständige Hausordnung (inkl. Abreise-Checkliste) findet Ihr unter{" "}
            <a href={`${baseUrl}/hausordnung`} style={{ color: "#2F4A35" }}>
              {baseUrl.replace(/^https?:\/\//, "")}/hausordnung
            </a>
            .
          </Text>

          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>
            Schlüsselübergabe regeln wir persönlich mit dem Hüttenwart Toni Klauke — er nimmt
            Euch an der Hütte in Empfang. Notfall-Telefon Toni Klauke: 01516 7448273. Bei
            Fragen: hello@wiesenhuette.de.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
