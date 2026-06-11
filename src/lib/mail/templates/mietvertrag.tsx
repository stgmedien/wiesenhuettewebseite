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
  Row,
  Column,
} from "@react-email/components";
import { formatEuro } from "@/lib/pricing";

type Props = {
  bookingNumber: string;
  arrival: string;
  departure: string;
  nights: number;
  customer: {
    salutation?: string;
    firstName: string;
    lastName: string;
    company?: string | null;
    email: string;
    phone?: string | null;
    street?: string | null;
    zip?: string | null;
    city?: string | null;
  };
  persons: {
    adults: number;
    members: number;
    children: number;
    pupils: number;
    teachers: number;
    total: number;
  };
  pricing: {
    accommodationCents: number;
    energyFlatCents: number;
    cleaningCents: number;
    soloSurchargeCents: number;
    minOccupancySurchargeCents: number;
    subtotalCents: number;
    depositCents: number;
    prepaymentCents: number;
    remainderCents: number;
  };
  signedAt: string; // ISO date — Vertragsabschluss
  contractDate: string; // formatted German
};

const main = { backgroundColor: "#F7F7F2", padding: "32px 0" };
const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 36px",
  maxWidth: "680px",
  borderRadius: "20px",
};
const heading = {
  fontFamily: "Bricolage Grotesque, system-ui, sans-serif",
  color: "#2F4A35",
  fontSize: "26px",
  fontWeight: 700,
  margin: "0 0 8px 0",
};
const h2 = {
  fontFamily: "Bricolage Grotesque, system-ui, sans-serif",
  color: "#2F4A35",
  fontSize: "16px",
  fontWeight: 700,
  margin: "24px 0 8px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
};
const eyebrow = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  color: "#5b5b56",
  margin: 0,
};
const text = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "14px",
  lineHeight: 1.55,
  color: "#111111",
  margin: "0 0 8px 0",
};
const muted = { ...text, color: "#5b5b56", fontSize: "13px" };
const partyBox = {
  backgroundColor: "#EFE6D8",
  padding: "16px 18px",
  borderRadius: "10px",
  margin: "0 0 12px 0",
};
const tableLabel = { ...text, fontWeight: 600 as const, margin: 0 };
const tableValue = { ...text, textAlign: "right" as const, margin: 0 };

export default function MietvertragEmail({
  bookingNumber,
  arrival,
  departure,
  nights,
  customer,
  persons,
  pricing,
  signedAt,
  contractDate,
}: Props) {
  const personComponents = [
    persons.adults > 0 && `${persons.adults} Erwachsene`,
    persons.members > 0 && `${persons.members} Erwachsene · Mitglied (−50 %)`,
    persons.children > 0 && `${persons.children} Kinder/Schüler bis 16 J.`,
    persons.pupils > 0 && `${persons.pupils} Kinder/Schüler bis 16 J. · Mitglied (−50 %)`,
    persons.teachers > 0 && `${persons.teachers} Lehrkräfte`,
  ].filter(Boolean) as string[];

  return (
    <Html>
      <Head />
      <Preview>Mietvertrag Wiesenhütte — Buchung {bookingNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Skifreunde Gütersloh e.V.</Text>
          <Heading style={heading}>Mietvertrag · Wiesenhütte</Heading>
          <Text style={muted}>
            Buchung {bookingNumber} · ausgestellt am {contractDate}
          </Text>

          <Hr style={{ borderColor: "#C8CEC4", margin: "20px 0" }} />

          <Heading as="h3" style={h2}>§ 1 Vertragsparteien</Heading>

          <Section style={partyBox}>
            <Text style={eyebrow}>Vermieter</Text>
            <Text style={tableLabel}>Skifreunde Gütersloh e.V.</Text>
            <Text style={muted}>
              Postfach 2819 · 33258 Gütersloh
              <br />
              hello@wiesenhuette.de
            </Text>
          </Section>

          <Section style={partyBox}>
            <Text style={eyebrow}>Mieter</Text>
            <Text style={tableLabel}>
              {customer.salutation ? `${customer.salutation} ` : ""}
              {customer.firstName} {customer.lastName}
            </Text>
            {customer.company ? <Text style={text}>{customer.company}</Text> : null}
            <Text style={muted}>
              {customer.street ? <>{customer.street}<br /></> : null}
              {customer.zip || customer.city ? `${customer.zip ?? ""} ${customer.city ?? ""}` : null}
              {customer.street || customer.zip || customer.city ? <br /> : null}
              {customer.email}
              {customer.phone ? <><br />{customer.phone}</> : null}
            </Text>
          </Section>

          <Heading as="h3" style={h2}>§ 2 Mietobjekt</Heading>
          <Text style={text}>
            Wiesenhütte der Skifreunde Gütersloh e.V., Bundesstraße 6, 59955 Winterberg-Langewiese
            (Hochsauerland). Selbstversorgerhütte mit 33 Schlafplätzen in 5 Schlafzimmern, zwei
            Aufenthaltsräumen, voll ausgestatteter Küche, Sanitärbereich, Skikeller, Feuerstelle
            und Außenbereich.
          </Text>

          <Heading as="h3" style={h2}>§ 3 Mietdauer & Belegung</Heading>
          <Section style={{ backgroundColor: "#F7F7F2", padding: "16px", borderRadius: "10px" }}>
            <Row>
              <Column><Text style={tableLabel}>Anreise</Text></Column>
              <Column><Text style={tableValue}>{arrival}</Text></Column>
            </Row>
            <Row>
              <Column><Text style={tableLabel}>Abreise</Text></Column>
              <Column><Text style={tableValue}>{departure}</Text></Column>
            </Row>
            <Row>
              <Column><Text style={tableLabel}>Nächte</Text></Column>
              <Column><Text style={tableValue}>{nights}</Text></Column>
            </Row>
            <Row>
              <Column><Text style={tableLabel}>Personen gesamt</Text></Column>
              <Column><Text style={tableValue}>{persons.total}</Text></Column>
            </Row>
          </Section>
          {personComponents.length > 0 && (
            <Text style={muted}>Zusammensetzung: {personComponents.join(" · ")}</Text>
          )}

          <Heading as="h3" style={h2}>§ 4 Mietpreis</Heading>
          <Section style={{ backgroundColor: "#F7F7F2", padding: "16px", borderRadius: "10px" }}>
            <Row>
              <Column><Text style={tableLabel}>Übernachtung</Text></Column>
              <Column><Text style={tableValue}>{formatEuro(pricing.accommodationCents)}</Text></Column>
            </Row>
            {pricing.energyFlatCents > 0 && (
              <Row>
                <Column><Text style={tableLabel}>Energiepauschale</Text></Column>
                <Column><Text style={tableValue}>{formatEuro(pricing.energyFlatCents)}</Text></Column>
              </Row>
            )}
            <Row>
              <Column><Text style={tableLabel}>Endreinigung (Pflicht)</Text></Column>
              <Column><Text style={tableValue}>{formatEuro(pricing.cleaningCents)}</Text></Column>
            </Row>
            {pricing.soloSurchargeCents > 0 && (
              <Row>
                <Column><Text style={tableLabel}>Aufschlag Allein-/Exklusivnutzung</Text></Column>
                <Column><Text style={tableValue}>{formatEuro(pricing.soloSurchargeCents)}</Text></Column>
              </Row>
            )}
            {pricing.minOccupancySurchargeCents > 0 && (
              <Row>
                <Column><Text style={tableLabel}>Aufschlag Mindestbelegung (15 Personen)</Text></Column>
                <Column><Text style={tableValue}>{formatEuro(pricing.minOccupancySurchargeCents)}</Text></Column>
              </Row>
            )}
            <Hr style={{ borderColor: "#C8CEC4", margin: "8px 0" }} />
            <Row>
              <Column><Text style={tableLabel}>Buchungssumme</Text></Column>
              <Column><Text style={{ ...tableValue, fontWeight: 700 }}>{formatEuro(pricing.subtotalCents)}</Text></Column>
            </Row>
          </Section>

          <Heading as="h3" style={h2}>§ 5 Zahlungen & Kaution</Heading>
          <Text style={text}>
            Die Mietzahlung wird in zwei Raten eingezogen: <strong>50 % Anzahlung</strong> bei
            Buchung, <strong>50 % Restzahlung</strong> spätestens 14 Tage vor Anreise. Die Kaution
            wird mit der Anzahlung mitvoraussetzt und nach mangelfreier Abreise innerhalb von 14
            Tagen erstattet.
          </Text>
          <Section style={{ backgroundColor: "#F7F7F2", padding: "16px", borderRadius: "10px" }}>
            <Row>
              <Column><Text style={tableLabel}>Anzahlung (heute fällig)</Text></Column>
              <Column><Text style={tableValue}>{formatEuro(pricing.prepaymentCents)}</Text></Column>
            </Row>
            <Row>
              <Column><Text style={tableLabel}>Kaution (heute fällig)</Text></Column>
              <Column><Text style={tableValue}>{formatEuro(pricing.depositCents)}</Text></Column>
            </Row>
            <Row>
              <Column><Text style={tableLabel}>Restzahlung (vor Anreise)</Text></Column>
              <Column><Text style={tableValue}>{formatEuro(pricing.remainderCents)}</Text></Column>
            </Row>
          </Section>
          <Text style={muted}>
            Die Kurtaxe Hochsauerland ist nicht im Mietpreis enthalten und wird vom Mieter direkt
            über das offizielle Kurtaxen-Portal des Hochsauerlandkreises angemeldet und bezahlt.
          </Text>

          <Heading as="h3" style={h2}>§ 6 Stornobedingungen</Heading>
          <Text style={text}>
            Bei Rücktritt durch den Mieter werden folgende Stornogebühren auf die Buchungssumme
            (ohne Kaution) erhoben:
          </Text>
          <ul style={{ margin: "0 0 8px 18px", padding: 0, color: "#111", fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: 1.55 }}>
            <li>mehr als 30 Tage vor Anreise: 0 %</li>
            <li>29 – 14 Tage vor Anreise: 30 %</li>
            <li>13 – 7 Tage vor Anreise: 60 %</li>
            <li>weniger als 7 Tage vor Anreise: 90 %</li>
          </ul>
          <Text style={muted}>
            Die Kaution wird im Stornofall vollständig zurückerstattet.
          </Text>

          <Heading as="h3" style={h2}>§ 7 Hausordnung</Heading>
          <Text style={text}>
            Die Hausordnung ist Bestandteil dieses Vertrags. Insbesondere gilt: keine Tiere, keine
            Lebensmittel in den Schlafräumen, Mülltrennung, Nachtruhe ab 22:00 Uhr,
            Schlüsselübergabe durch den Hüttenwart Toni Klauke, Hütte am Abreisetag bis 12:00
            Uhr besenrein verlassen.
          </Text>
          <Text style={muted}>
            Vollständige Hausordnung:{" "}
            <a href="https://wiesenhuette.vercel.app/hausordnung">https://wiesenhuette.vercel.app/hausordnung</a>
          </Text>

          <Heading as="h3" style={h2}>§ 8 Schäden & Haftung</Heading>
          <Text style={text}>
            Der Mieter haftet für während der Mietzeit verursachte Schäden im Rahmen der
            gesetzlichen Bestimmungen. Schäden sind unverzüglich beim Hüttenwart zu melden und
            werden ggf. von der Kaution einbehalten. Übersteigt der Schaden die Kaution, behält
            sich der Vermieter eine separate Rechnungsstellung vor.
          </Text>

          <Heading as="h3" style={h2}>§ 9 Schlussbestimmungen</Heading>
          <Text style={text}>
            Änderungen und Ergänzungen dieses Vertrags bedürfen der Textform. Sollten einzelne
            Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
            Gerichtsstand ist, soweit gesetzlich zulässig, Gütersloh.
          </Text>

          <Hr style={{ borderColor: "#C8CEC4", margin: "28px 0 16px" }} />

          <Text style={muted}>
            Dieser Mietvertrag wurde am <strong>{contractDate}</strong> elektronisch durch
            Online-Buchung und Online-Zahlung der Anzahlung wirksam abgeschlossen
            (Zustimmung dokumentiert: {signedAt}). Eine separate Unterschrift ist nicht erforderlich.
          </Text>
          <Text style={muted}>
            Skifreunde Gütersloh e.V. · Postfach 2819 · 33258 Gütersloh · Vereinsregister VR 142
            beim Amtsgericht Gütersloh
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
