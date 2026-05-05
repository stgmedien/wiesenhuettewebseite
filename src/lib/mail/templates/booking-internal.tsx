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
import { formatEuro } from "@/lib/pricing";

type Props = {
  bookingNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  arrival: string;
  departure: string;
  nights: number;
  persons: number;
  customerType: string;
  totalCents: number;
  paidCents: number;
  managerUrl: string;
  notes?: string;
};

const main = { backgroundColor: "#F7F7F2", padding: "32px 0" };
const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "28px",
  maxWidth: "600px",
  borderRadius: "16px",
  border: "1px solid #C8CEC4",
};
const heading = {
  fontFamily: "Bricolage Grotesque, system-ui, sans-serif",
  color: "#2F4A35",
  fontSize: "24px",
  fontWeight: 700,
  margin: "0 0 12px 0",
};
const text = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "15px",
  lineHeight: 1.55,
  color: "#111111",
  margin: "0 0 8px 0",
};
const row = { ...text, margin: "4px 0" };

export default function BookingInternalEmail({
  bookingNumber,
  guestName,
  guestEmail,
  guestPhone,
  arrival,
  departure,
  nights,
  persons,
  customerType,
  totalCents,
  paidCents,
  managerUrl,
  notes,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Neue Buchung {bookingNumber} ({guestName})</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>📌 Neue Buchung eingegangen</Heading>
          <Text style={text}>
            <strong>{bookingNumber}</strong> — {guestName} ({customerType})
          </Text>
          <Section style={{ marginTop: 16 }}>
            <Text style={row}>📅 {arrival} → {departure} ({nights} Nächte)</Text>
            <Text style={row}>👥 {persons} Personen</Text>
            <Text style={row}>📧 {guestEmail}{guestPhone ? ` · ☎ ${guestPhone}` : ""}</Text>
            <Text style={row}>💶 {formatEuro(totalCents)} (bezahlt: {formatEuro(paidCents)})</Text>
            {notes ? <Text style={row}>📝 {notes}</Text> : null}
          </Section>
          <Section style={{ marginTop: 20 }}>
            <Text style={text}>
              <a href={managerUrl}>Im Manager-Backend öffnen →</a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
