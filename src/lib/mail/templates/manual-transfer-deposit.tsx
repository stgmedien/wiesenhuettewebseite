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
import { CLUB_BANK_DETAILS } from "@/lib/bank-details";

type Props = {
  /**
   * received  = direkt nach der Buchung (Bankdaten + Frist)
   * reminder  = Erinnerung kurz vor Fristablauf
   * cancelled = Frist verstrichen, Termin wieder freigegeben
   */
  variant: "received" | "reminder" | "cancelled";
  firstName: string;
  bookingNumber: string;
  arrival: string;
  departure: string;
  /** Formatierter Anzahlungsbetrag, z. B. "425,00 €". */
  depositLabel: string;
  /** Formatiertes Datum, bis zu dem die Anzahlung eingegangen sein muss. */
  deadlineLabel: string;
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
const box = {
  backgroundColor: "#EFE6D8",
  borderLeft: "4px solid #2F4A35",
  padding: "16px 20px",
  borderRadius: "12px",
  margin: "20px 0",
};

const COPY = {
  received: {
    preview: "Buchung eingegangen — bitte Anzahlung überweisen",
    eyebrow: "Wiesenhütte · Buchung eingegangen",
    heading: "Bitte überweist die Anzahlung.",
  },
  reminder: {
    preview: "Erinnerung: Anzahlung für Eure Buchung noch offen",
    eyebrow: "Wiesenhütte · Erinnerung",
    heading: "Die Anzahlung ist noch offen.",
  },
  cancelled: {
    preview: "Buchung storniert — Anzahlung nicht eingegangen",
    eyebrow: "Wiesenhütte · Buchung storniert",
    heading: "Der Termin ist wieder freigegeben.",
  },
} as const;

export default function ManualTransferDepositEmail({
  variant,
  firstName,
  bookingNumber,
  arrival,
  departure,
  depositLabel,
  deadlineLabel,
}: Props) {
  const c = COPY[variant];
  return (
    <Html>
      <Head />
      <Preview>{c.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>{c.eyebrow}</Text>
          <Heading style={heading}>{c.heading}</Heading>
          <Text style={text}>Hallo {firstName},</Text>

          {variant === "cancelled" ? (
            <>
              <Text style={text}>
                für Eure Buchung <strong>{bookingNumber}</strong> ({arrival} bis {departure}) ist
                bis zum <strong>{deadlineLabel}</strong> keine Anzahlung bei uns eingegangen. Wir
                haben die Buchung deshalb storniert und den Termin wieder freigegeben.
              </Text>
              <Text style={text}>
                Falls Ihr inzwischen überwiesen habt oder weiterhin kommen möchtet, meldet Euch
                bitte kurz bei uns — solange der Termin noch frei ist, buchen wir Euch gern wieder
                ein.
              </Text>
            </>
          ) : (
            <>
              <Text style={text}>
                {variant === "received" ? (
                  <>
                    vielen Dank für Eure Buchung <strong>{bookingNumber}</strong> ({arrival} bis{" "}
                    {departure})! Der Termin ist jetzt für Euch reserviert.
                  </>
                ) : (
                  <>
                    für Eure Buchung <strong>{bookingNumber}</strong> ({arrival} bis {departure})
                    ist die Anzahlung bisher nicht bei uns eingegangen.
                  </>
                )}
              </Text>
              <Text style={text}>
                Bitte überweist die Anzahlung von <strong>{depositLabel}</strong> so, dass sie{" "}
                <strong>bis spätestens {deadlineLabel}</strong> bei uns eingeht. Geht bis dahin
                keine Zahlung ein, wird die Buchung automatisch storniert und der Termin wieder
                freigegeben.
              </Text>
              <Section style={box}>
                <Text style={{ ...text, margin: 0 }}>
                  <strong>Überweisung an:</strong>
                  <br />
                  {CLUB_BANK_DETAILS.kontoinhaber}
                  <br />
                  {CLUB_BANK_DETAILS.bank} · IBAN: {CLUB_BANK_DETAILS.iban}
                  <br />
                  Verwendungszweck: {bookingNumber}
                </Text>
              </Section>
              <Text style={muted}>
                Braucht Eure Kasse länger für die Überweisung? Dann meldet Euch bitte vor Ablauf
                der Frist bei uns — wir finden eine Lösung. Die Restzahlung inklusive Kaution und
                Kurtaxe wird 14 Tage vor Anreise fällig; dazu erinnern wir Euch rechtzeitig.
              </Text>
            </>
          )}

          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px" }} />
          <Text style={muted}>
            Fragen? Einfach auf diese E-Mail antworten oder an hello@wiesenhuette.de schreiben —
            Skifreunde Gütersloh e.V.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
