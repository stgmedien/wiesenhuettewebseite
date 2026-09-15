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
} from "@react-email/components";
import type { TourismStats } from "@/lib/tourism-stats";

type Props = {
  stats: TourismStats;
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
  color: "#7a3a20",
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
  borderLeft: "4px solid #7a3a20",
  borderRadius: "12px",
  padding: "16px 20px",
  margin: "16px 0",
};
const button = {
  backgroundColor: "#2F4A35",
  color: "#F7F7F2",
  borderRadius: "999px",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 24px",
  textDecoration: "none",
};

export default function TourismStatsDigestEmail({ stats }: Props) {
  return (
    <Html lang="de">
      <Head />
      <Preview>
        {`IT.NRW-Tourismusstatistik ${stats.monthLabel}: ${stats.arrivals} Ankünfte, ${stats.overnightStays} Übernachtungen`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Intern · IT.NRW-Tourismusstatistik</Text>
          <Heading style={heading}>Zahlen für {stats.monthLabel}</Heading>
          <Text style={text}>
            Monatliche Meldepflicht nach BeherbStatG (Totalerhebung, keine Stichprobe — betrifft
            jeden Monat dauerhaft). Bitte bei{" "}
            <a href="https://www.idev.nrw.de" style={{ color: "#2F4A35" }}>
              idev.nrw.de
            </a>{" "}
            eintragen; die genaue Meldefrist steht im jeweiligen Erinnerungsschreiben.
          </Text>
          <Section style={box}>
            <Text style={{ ...text, margin: 0 }}>
              <strong>{stats.arrivals}</strong> Ankünfte
              <br />
              <strong>{stats.overnightStays}</strong> Übernachtungen
            </Text>
          </Section>
          {stats.bookings.length > 0 && (
            <Section>
              <Text style={muted}>Zugrunde liegende Buchungen:</Text>
              {stats.bookings.map((b) => (
                <Text key={b.bookingNumber} style={{ ...muted, margin: "0 0 6px 0" }}>
                  {b.bookingNumber} · {b.arrival} → {b.departure} · {b.persons} Personen ·{" "}
                  {b.nightsInMonth} {b.nightsInMonth === 1 ? "Nacht" : "Nächte"} in {stats.monthLabel}
                </Text>
              ))}
            </Section>
          )}
          <Section style={{ margin: "20px 0" }}>
            <EmailButton href="https://www.idev.nrw.de" style={button}>
              Bei IDEV melden
            </EmailButton>
          </Section>
          <Text style={muted}>Automatische Systemnachricht · wiesenhuette.de</Text>
        </Container>
      </Body>
    </Html>
  );
}
