import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { formatEuro } from "@/lib/pricing";

type Props = {
  guestName: string;
  bookingNumber: string;
  amountCents: number;
  dateFormatted: string;
  arrival: string;
  baseUrl: string;
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
const h3 = {
  ...heading,
  fontSize: "20px",
  margin: "28px 0 8px 0",
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
  padding: "20px",
  borderRadius: "12px",
  margin: "16px 0",
};
const label = { ...muted, fontSize: "13px", margin: "0 0 4px 0" };
const value = { ...text, fontWeight: 600, margin: 0 };

export default function RestzahlungConfirmedEmail({
  guestName,
  bookingNumber,
  amountCents,
  dateFormatted,
  arrival,
  baseUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Eure Restzahlung ist bei uns eingegangen — Anreise-Infos zur Wiesenhütte</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Skifreunde Gütersloh e.V.</Text>
          <Heading style={heading}>Zahlung bestätigt.</Heading>
          <Text style={text}>Hallo {guestName},</Text>
          <Text style={text}>
            Eure Restzahlung für die Buchung {bookingNumber} ist bei uns eingegangen.
          </Text>

          <Section style={box}>
            <Text style={label}>Betrag</Text>
            <Text style={value}>{formatEuro(amountCents)}</Text>
            <Hr style={{ borderColor: "#C8CEC4", margin: "12px 0" }} />
            <Text style={label}>Datum</Text>
            <Text style={value}>{dateFormatted}</Text>
          </Section>

          <Heading as="h3" style={h3}>
            Adresse
          </Heading>
          <Text style={text}>
            Wiesenhütte, Bundesstraße 6, 59955 Winterberg-Langewiese
          </Text>

          <Heading as="h3" style={h3}>
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
              Pflicht ab 16 Jahren). Eure Kurkarten schicken wir Euch separat zu, sobald sie
              fertig sind.
            </Text>
            <Text style={{ ...text, margin: "0 0 8px 0" }}>
              <strong>Spätestens 2 Tage vor Anreise:</strong> teilt Toni Klauke telefonisch Eure
              genaue Ankunftszeit mit (01516 7448273) — er nimmt Euch am {arrival} an der Hütte in
              Empfang und überreicht die Schlüssel.
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

          <Hr style={{ borderColor: "#C8CEC4", margin: "28px 0 16px" }} />
          <Text style={muted}>
            Schlüsselübergabe regeln wir persönlich mit dem Hüttenwart Toni Klauke — er nimmt
            Euch an der Hütte in Empfang. Notfall-Telefon Toni Klauke: 01516 7448273. Fragen?
            Einfach auf diese E-Mail antworten.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
