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
  Row,
  Column,
} from "@react-email/components";
import { formatEuro, PRICES } from "@/lib/pricing";

type Props = {
  bookingNumber: string;
  guestName: string;
  arrival: string;
  departure: string;
  nights: number;
  persons: number;
  totalCents: number;
  depositCents: number;
  kurtaxeCents: number;
  paidCents: number;
  /** true bei kurzfristigen Buchungen (< 14 Tage vor Anreise) — dort sind
   * Kaution und Kurtaxe bereits mit bezahlt; sonst werden sie erst bei der
   * Restzahlung (14 Tage vor Anreise) eingezogen. */
  kautionDueNow: boolean;
  baseUrl: string;
  // Mietvertrag-Inhalt (§1–§9) — dieselbe Mail dient als Buchungsbestätigung
  // UND als Mietvertrag, statt zwei getrennte Mails zu verschicken.
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
  personsBreakdown: {
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
    kurtaxePersons: number;
    kurtaxeCents: number;
    prepaymentCents: number;
    remainderCents: number;
  };
  signedAt: string; // ISO date — Vertragsabschluss
  contractDate: string; // formatted German
};

const main = { backgroundColor: "#F7F7F2", padding: "40px 0" };
const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "32px",
  maxWidth: "640px",
  borderRadius: "20px",
};
const heading = {
  fontFamily: "Bricolage Grotesque, system-ui, sans-serif",
  color: "#2F4A35",
  fontSize: "32px",
  fontWeight: 700,
  lineHeight: 1.05,
  margin: "0 0 16px 0",
};
const h2 = {
  fontFamily: "Bricolage Grotesque, system-ui, sans-serif",
  color: "#2F4A35",
  fontSize: "15px",
  fontWeight: 700,
  margin: "24px 0 8px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.07em",
};
const h3 = {
  ...heading,
  fontSize: "20px",
  margin: "24px 0 8px 0",
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
const smallText = { ...text, fontSize: "14px" };
const muted = { ...text, color: "#5b5b56" };
const smallMuted = { ...smallText, color: "#5b5b56", fontSize: "13px" };
const cardWarm = {
  backgroundColor: "#EFE6D8",
  padding: "20px",
  borderRadius: "12px",
  margin: "16px 0",
};
const cardFlat = { backgroundColor: "#F7F7F2", padding: "16px", borderRadius: "10px", margin: "0 0 12px 0" };
const label = { ...muted, fontSize: "13px", margin: "0 0 4px 0" };
const value = { ...text, fontWeight: 600, margin: 0 };
const rowLabel = { ...smallText, fontWeight: 600 as const, margin: 0 };
const rowValue = { ...smallText, textAlign: "right" as const, margin: 0 };

export default function BookingConfirmedEmail({
  bookingNumber,
  guestName,
  arrival,
  departure,
  nights,
  persons,
  totalCents,
  depositCents,
  kurtaxeCents,
  paidCents,
  kautionDueNow,
  baseUrl,
  customer,
  personsBreakdown,
  pricing,
  signedAt,
  contractDate,
}: Props) {
  const personComponents = [
    personsBreakdown.adults > 0 && `${personsBreakdown.adults} Erwachsene`,
    personsBreakdown.members > 0 && `${personsBreakdown.members} Erwachsene · Mitglied (−50 %)`,
    personsBreakdown.children > 0 && `${personsBreakdown.children} Kinder/Schüler bis 16 J.`,
    personsBreakdown.pupils > 0 && `${personsBreakdown.pupils} Kinder/Schüler bis 16 J. · Mitglied (−50 %)`,
    personsBreakdown.teachers > 0 && `${personsBreakdown.teachers} Lehrkräfte`,
  ].filter(Boolean) as string[];

  return (
    <Html>
      <Head />
      <Preview>Eure Buchung in der Wiesenhütte ist bestätigt — inkl. Mietvertrag</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Wiesenhütte · Skifreunde Gütersloh e.V.</Text>
          <Heading style={heading}>Eure Buchung ist bestätigt.</Heading>
          <Text style={text}>Hallo {guestName},</Text>
          <Text style={text}>
            wir freuen uns, dass ihr in die Wiesenhütte kommt. Hier die Übersicht eurer Buchung —
            sie gilt zugleich als euer Mietvertrag (vollständiger Text weiter unten).
          </Text>

          <Section style={cardWarm}>
            <Row>
              <Column>
                <Text style={label}>Buchungsnummer</Text>
                <Text style={value}>{bookingNumber}</Text>
              </Column>
              <Column>
                <Text style={label}>Personen</Text>
                <Text style={value}>{persons}</Text>
              </Column>
            </Row>
            <Hr style={{ borderColor: "#C8CEC4", margin: "12px 0" }} />
            <Row>
              <Column>
                <Text style={label}>Anreise</Text>
                <Text style={value}>{arrival}</Text>
              </Column>
              <Column>
                <Text style={label}>Abreise</Text>
                <Text style={value}>{departure}</Text>
              </Column>
              <Column>
                <Text style={label}>Nächte</Text>
                <Text style={value}>{nights}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={cardWarm}>
            <Row>
              <Column>
                <Text style={label}>Übernachtung & Pauschalen</Text>
                <Text style={value}>{formatEuro(totalCents)}</Text>
              </Column>
              <Column>
                <Text style={label}>Kaution</Text>
                <Text style={value}>{formatEuro(depositCents)}</Text>
                <Text style={{ ...muted, fontSize: "12px", margin: "2px 0 0 0" }}>
                  {kautionDueNow ? "heute bezahlt" : "fällig mit Restzahlung"}
                </Text>
              </Column>
              {kurtaxeCents > 0 && (
                <Column>
                  <Text style={label}>Kurtaxe</Text>
                  <Text style={value}>{formatEuro(kurtaxeCents)}</Text>
                  <Text style={{ ...muted, fontSize: "12px", margin: "2px 0 0 0" }}>
                    {kautionDueNow ? "heute bezahlt" : "fällig mit Restzahlung"}
                  </Text>
                </Column>
              )}
              <Column>
                <Text style={label}>Bereits bezahlt</Text>
                <Text style={value}>{formatEuro(paidCents)}</Text>
              </Column>
            </Row>
          </Section>

          <Heading as="h3" style={h3}>
            Was als Nächstes passiert
          </Heading>
          <Text style={text}>
            Eine Woche vor eurer Anreise schicken wir euch alle Anfahrtsdetails, die Hausordnung
            und Infos zur Schlüsselübergabe. Falls ihr vorher Fragen habt, antwortet einfach auf
            diese Mail.
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
            <Text style={{ ...text, fontWeight: 700, margin: "0 0 8px 0" }}>
              Wichtig: Die Personenzahl kann nur noch erhöht, nicht verringert werden.
            </Text>
            <Text style={{ ...text, margin: 0 }}>
              Auch wenn einzelne Teilnehmer kurzfristig ausfallen, bleibt der volle
              Übernachtungspreis fällig. Zusätzliche Personen könnt ihr bis 15 Tage vor
              Anreise jederzeit bequem selbst über euer Konto nachbuchen und direkt
              bezahlen:{" "}
              <a href={`${baseUrl}/konto`} style={{ color: "#2F4A35" }}>
                {baseUrl}/konto
              </a>
            </Text>
          </Section>

          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 24px 0" }} />

          <Text style={eyebrow}>Skifreunde Gütersloh e.V.</Text>
          <Heading as="h3" style={{ ...h3, fontSize: "22px" }}>
            Euer Mietvertrag
          </Heading>
          <Text style={smallMuted}>
            Buchung {bookingNumber} · ausgestellt am {contractDate}
          </Text>

          <Heading as="h4" style={h2}>§ 1 Vertragsparteien</Heading>
          <Section style={cardFlat}>
            <Text style={{ ...smallMuted, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
              Vermieter
            </Text>
            <Text style={rowLabel}>Skifreunde Gütersloh e.V.</Text>
            <Text style={smallMuted}>
              Postfach 2819 · 33258 Gütersloh
              <br />
              hello@wiesenhuette.de
            </Text>
          </Section>
          <Section style={cardFlat}>
            <Text style={{ ...smallMuted, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
              Mieter
            </Text>
            <Text style={rowLabel}>
              {customer.salutation ? `${customer.salutation} ` : ""}
              {customer.firstName} {customer.lastName}
            </Text>
            {customer.company ? <Text style={smallText}>{customer.company}</Text> : null}
            <Text style={smallMuted}>
              {customer.street ? <>{customer.street}<br /></> : null}
              {customer.zip || customer.city ? `${customer.zip ?? ""} ${customer.city ?? ""}` : null}
              {customer.street || customer.zip || customer.city ? <br /> : null}
              {customer.email}
              {customer.phone ? <><br />{customer.phone}</> : null}
            </Text>
          </Section>

          <Heading as="h4" style={h2}>§ 2 Mietobjekt</Heading>
          <Text style={smallText}>
            Wiesenhütte der Skifreunde Gütersloh e.V., Bundesstraße 6, 59955 Winterberg-Langewiese
            (Hochsauerland). Selbstversorgerhütte mit 33 Schlafplätzen in 5 Schlafzimmern,
            Esszimmer und Wohnzimmer, voll ausgestatteter Küche, Sanitärbereich, Skikeller,
            Feuerstelle und Außenbereich.
          </Text>

          <Heading as="h4" style={h2}>§ 3 Mietdauer & Belegung</Heading>
          <Section style={cardFlat}>
            <Row>
              <Column><Text style={rowLabel}>Anreise</Text></Column>
              <Column><Text style={rowValue}>{arrival}</Text></Column>
            </Row>
            <Row>
              <Column><Text style={rowLabel}>Abreise</Text></Column>
              <Column><Text style={rowValue}>{departure}</Text></Column>
            </Row>
            <Row>
              <Column><Text style={rowLabel}>Nächte</Text></Column>
              <Column><Text style={rowValue}>{nights}</Text></Column>
            </Row>
            <Row>
              <Column><Text style={rowLabel}>Personen gesamt</Text></Column>
              <Column><Text style={rowValue}>{personsBreakdown.total}</Text></Column>
            </Row>
          </Section>
          {personComponents.length > 0 && (
            <Text style={smallMuted}>Zusammensetzung: {personComponents.join(" · ")}</Text>
          )}

          <Heading as="h4" style={h2}>§ 4 Mietpreis</Heading>
          <Section style={cardFlat}>
            <Row>
              <Column><Text style={rowLabel}>Übernachtung</Text></Column>
              <Column><Text style={rowValue}>{formatEuro(pricing.accommodationCents)}</Text></Column>
            </Row>
            {pricing.energyFlatCents > 0 && (
              <Row>
                <Column><Text style={rowLabel}>Energiepauschale</Text></Column>
                <Column><Text style={rowValue}>{formatEuro(pricing.energyFlatCents)}</Text></Column>
              </Row>
            )}
            <Row>
              <Column><Text style={rowLabel}>Endreinigung (Pflicht)</Text></Column>
              <Column><Text style={rowValue}>{formatEuro(pricing.cleaningCents)}</Text></Column>
            </Row>
            {pricing.soloSurchargeCents > 0 && (
              <Row>
                <Column><Text style={rowLabel}>Aufschlag Allein-/Exklusivnutzung</Text></Column>
                <Column><Text style={rowValue}>{formatEuro(pricing.soloSurchargeCents)}</Text></Column>
              </Row>
            )}
            {pricing.minOccupancySurchargeCents > 0 && (
              <Row>
                <Column><Text style={rowLabel}>Aufschlag Mindestbelegung (15 Personen)</Text></Column>
                <Column><Text style={rowValue}>{formatEuro(pricing.minOccupancySurchargeCents)}</Text></Column>
              </Row>
            )}
            <Hr style={{ borderColor: "#C8CEC4", margin: "8px 0" }} />
            <Row>
              <Column><Text style={rowLabel}>Buchungssumme</Text></Column>
              <Column><Text style={{ ...rowValue, fontWeight: 700 }}>{formatEuro(pricing.subtotalCents)}</Text></Column>
            </Row>
          </Section>

          <Heading as="h4" style={h2}>§ 5 Zahlungen, Kaution & Kurtaxe</Heading>
          <Text style={smallText}>
            Die Mietzahlung wird in zwei Raten eingezogen: eine <strong>Anzahlung</strong> bei
            Buchung sowie die <strong>Restzahlung</strong> spätestens 14 Tage vor Anreise
            (Auto-Einzug per Stripe). {kautionDueNow
              ? "Kaution und Kurtaxe sind bereits mit der Anzahlung fällig"
              : "Kaution und Kurtaxe werden zusammen mit der Restzahlung eingezogen"}. Die
            Kaution wird nach mangelfreier Abreise innerhalb von 14 Tagen erstattet; die Kurtaxe
            führt der Verein an die Kurverwaltung Winterberg ab.
          </Text>
          <Section style={cardFlat}>
            <Row>
              <Column><Text style={rowLabel}>Anzahlung (heute fällig)</Text></Column>
              <Column><Text style={rowValue}>{formatEuro(pricing.prepaymentCents)}</Text></Column>
            </Row>
            {kautionDueNow && (
              <Row>
                <Column><Text style={rowLabel}>Kaution (heute fällig)</Text></Column>
                <Column><Text style={rowValue}>{formatEuro(pricing.depositCents)}</Text></Column>
              </Row>
            )}
            {kautionDueNow && pricing.kurtaxeCents > 0 && (
              <Row>
                <Column><Text style={rowLabel}>Kurtaxe (heute fällig)</Text></Column>
                <Column><Text style={rowValue}>{formatEuro(pricing.kurtaxeCents)}</Text></Column>
              </Row>
            )}
            <Row>
              <Column>
                <Text style={rowLabel}>
                  Restzahlung (vor Anreise){!kautionDueNow && " inkl. Kaution + Kurtaxe"}
                </Text>
              </Column>
              <Column>
                <Text style={rowValue}>
                  {formatEuro(
                    pricing.remainderCents +
                      (kautionDueNow ? 0 : pricing.depositCents + pricing.kurtaxeCents)
                  )}
                </Text>
              </Column>
            </Row>
          </Section>
          {pricing.kurtaxeCents > 0 && (
            <Text style={smallMuted}>
              Kurtaxe Hochsauerland: {pricing.kurtaxePersons} Personen (ab 16 Jahren) × {nights}{" "}
              Nächte × {formatEuro(PRICES.kurtaxeRateCents)} = {formatEuro(pricing.kurtaxeCents)}.
              Der Verein zieht sie ein und führt sie an die Kurverwaltung Winterberg ab.
            </Text>
          )}

          <Heading as="h4" style={h2}>§ 6 Stornobedingungen</Heading>
          <Text style={smallText}>
            Bei Rücktritt durch den Mieter werden folgende Stornogebühren auf den reinen
            Übernachtungspreis erhoben. Endreinigung und Kaution werden im Stornofall nicht
            fällig bzw. vollständig zurückerstattet:
          </Text>
          <ul style={{ margin: "0 0 8px 18px", padding: 0, color: "#111", fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: 1.55 }}>
            <li>mehr als 60 Tage vor Anreise: 0 %</li>
            <li>60 – 31 Tage vor Anreise: 30 %</li>
            <li>30 – 14 Tage vor Anreise: 50 %</li>
            <li>weniger als 14 Tage vor Anreise: 100 %</li>
          </ul>

          <Heading as="h4" style={h2}>§ 7 Hausordnung</Heading>
          <Text style={smallText}>
            Die Hausordnung ist Bestandteil dieses Vertrags. Insbesondere gilt: keine Tiere, keine
            Lebensmittel in den Schlafräumen, Mülltrennung, Nachtruhe ab 22:00 Uhr,
            Schlüsselübergabe durch den Hüttenwart Toni Klauke, Hütte am Abreisetag bis 12:00
            Uhr besenrein verlassen.
          </Text>
          <Text style={smallMuted}>
            Vollständige Hausordnung:{" "}
            <a href="https://wiesenhuette.vercel.app/hausordnung">https://wiesenhuette.vercel.app/hausordnung</a>
          </Text>

          <Heading as="h4" style={h2}>§ 8 Schäden & Haftung</Heading>
          <Text style={smallText}>
            Der Mieter haftet für während der Mietzeit verursachte Schäden im Rahmen der
            gesetzlichen Bestimmungen. Schäden sind unverzüglich beim Hüttenwart zu melden und
            werden ggf. von der Kaution einbehalten. Übersteigt der Schaden die Kaution, behält
            sich der Vermieter eine separate Rechnungsstellung vor.
          </Text>

          <Heading as="h4" style={h2}>§ 9 Schlussbestimmungen</Heading>
          <Text style={smallText}>
            Änderungen und Ergänzungen dieses Vertrags bedürfen der Textform. Sollten einzelne
            Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
            Gerichtsstand ist, soweit gesetzlich zulässig, Gütersloh.
          </Text>

          <Hr style={{ borderColor: "#C8CEC4", margin: "28px 0 16px" }} />

          <Text style={smallMuted}>
            Dieser Mietvertrag wurde am <strong>{contractDate}</strong> elektronisch durch
            Online-Buchung und Online-Zahlung der Anzahlung wirksam abgeschlossen
            (Zustimmung dokumentiert: {signedAt}). Eine separate Unterschrift ist nicht erforderlich.
          </Text>
          <Text style={smallMuted}>
            Wiesenhütte · Skifreunde Gütersloh e.V. · Postfach 2819 · 33258 Gütersloh ·
            Vereinsregister VR 320 beim Amtsgericht Gütersloh
            <br />
            <a href={baseUrl}>{baseUrl}</a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
