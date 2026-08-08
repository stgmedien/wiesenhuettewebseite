/**
 * Unverbindliches ANGEBOT als @react-pdf/renderer-Komponente.
 *
 * Stil eng an der Rechnung (invoice-pdf.tsx): gleiche Farben, Fonts und
 * Aufbau — aber bewusst KEINE Rechnungsnummer und KEIN Bezug zur
 * invoice_seq. Ein Angebot ist keine Rechnung und darf buchhalterisch
 * nicht wie eine aussehen (GoBD: fortlaufende Nummern nur für Rechnungen).
 *
 * Prominent: das Gültig-bis-Datum (eingefrorene Kalkulation, 14 Tage)
 * und der Link zur Online-Version als Text.
 */

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Farben analog zur Webseite (identisch zu invoice-pdf.tsx)
const C = {
  green: "#2F4A35",
  textBlack: "#111111",
  textMuted: "#5b5b56",
  border: "#C8CEC4",
  beige: "#EFE6D8",
  expired: "#8a3b2f",
};

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    color: C.textBlack,
    fontFamily: "Helvetica",
    lineHeight: 1.45,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 14,
    marginBottom: 22,
    borderBottomWidth: 2,
    borderBottomColor: C.green,
  },
  companyName: { fontSize: 18, fontWeight: 700, color: C.green },
  companyMeta: { fontSize: 9, color: C.textMuted, marginTop: 2 },
  metaLabel: {
    fontSize: 8,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: C.green,
    letterSpacing: 2,
    marginTop: 2,
  },
  metaText: { fontSize: 9, color: C.textMuted, marginTop: 1 },
  // Gültig-bis prominent
  validBox: {
    backgroundColor: C.beige,
    borderLeftWidth: 3,
    borderLeftColor: C.green,
    padding: 12,
    borderRadius: 4,
    marginBottom: 22,
  },
  validHeadline: { fontSize: 12, fontWeight: 700, color: C.green },
  validNote: { fontSize: 9, color: C.textMuted, marginTop: 2 },
  expiredHeadline: { fontSize: 12, fontWeight: 700, color: C.expired },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 8,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  recipientName: { fontWeight: 700, fontSize: 11 },
  recipientLine: { fontSize: 10, marginTop: 1 },
  stayBox: {
    flexDirection: "row",
    backgroundColor: C.beige,
    padding: 12,
    borderRadius: 4,
  },
  stayCol: { flex: 1 },
  table: { marginBottom: 16 },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1.4,
    borderBottomColor: C.textBlack,
    paddingBottom: 4,
  },
  th: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: 700,
  },
  thTotal: { width: 90, textAlign: "right" },
  thLabel: { flex: 1 },
  tr: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  td: { fontSize: 10 },
  tdTotal: { width: 90, textAlign: "right", fontFamily: "Courier" },
  tdLabel: { flex: 1 },
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1.4,
    borderTopColor: C.textBlack,
    paddingTop: 6,
    marginTop: 4,
  },
  subtotalLabel: { fontWeight: 700, fontSize: 10 },
  subtotalValue: {
    fontWeight: 700,
    fontSize: 10,
    fontFamily: "Courier",
    width: 90,
    textAlign: "right",
  },
  extraRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 5,
  },
  extraLabel: { fontSize: 9.5 },
  extraValue: {
    fontSize: 9.5,
    fontFamily: "Courier",
    width: 90,
    textAlign: "right",
  },
  extraDetail: { fontSize: 8, color: C.textMuted, marginTop: 1 },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1.4,
    borderTopColor: C.textBlack,
    paddingTop: 6,
    marginTop: 8,
  },
  totalLabel: { fontWeight: 700, fontSize: 12 },
  totalValue: {
    fontWeight: 700,
    fontSize: 12,
    fontFamily: "Courier",
    width: 90,
    textAlign: "right",
  },
  notesBox: {
    fontSize: 9,
    color: C.textMuted,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 10,
    marginTop: 12,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    fontSize: 7.5,
    color: C.textMuted,
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 8,
  },
});

const formatEuro = (cents: number): string =>
  (cents / 100).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });

const formatDate = (iso: string | Date): string => {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export type OfferPdfProps = {
  createdAt: string | Date;
  arrival: string;
  departure: string;
  nights: number;
  persons: number;
  /** z. B. "20 Erwachsene · 4 Lehrkräfte" */
  personsDetail: string;
  purpose?: string | null;
  institution?: string | null;
  contactName?: string | null;
  lineItems: { label: string; totalCents: number }[];
  subtotalCents: number;
  depositCents: number;
  kurtaxeCents: number;
  /** kurtaxenpflichtige Personen (ab 16 J.) */
  kurtaxePersons: number;
  validUntil: string;
  expired: boolean;
  /** Link zur Online-Version — wird als Text ins PDF gedruckt */
  onlineUrl: string;
};

export function OfferPdf({
  createdAt,
  arrival,
  departure,
  nights,
  persons,
  personsDetail,
  purpose,
  institution,
  contactName,
  lineItems,
  subtotalCents,
  depositCents,
  kurtaxeCents,
  kurtaxePersons,
  validUntil,
  expired,
  onlineUrl,
}: OfferPdfProps) {
  const hasRecipient = Boolean(institution || contactName || purpose);
  return (
    <Document
      title="Angebot Wiesenhütte"
      author="Skifreunde Gütersloh e.V."
      subject="Unverbindliches Angebot"
    >
      <Page size="A4" style={styles.page}>
        {/* Kopf — wie Rechnung, aber klar als ANGEBOT gekennzeichnet */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>Wiesenhütte</Text>
            <Text style={styles.companyMeta}>Skifreunde Gütersloh e.V.</Text>
            <Text style={styles.companyMeta}>Bundesstraße 6, 59955 Winterberg-Langewiese</Text>
            <Text style={styles.companyMeta}>hello@wiesenhuette.de · www.wiesenhuette.de</Text>
            <Text style={styles.companyMeta}>
              Gemeinnütziger Verein · Vereinsregister Gütersloh VR 320
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.metaLabel}>Unverbindlich</Text>
            <Text style={styles.offerTitle}>ANGEBOT</Text>
            <Text style={styles.metaText}>Erstellt am: {formatDate(createdAt)}</Text>
          </View>
        </View>

        {/* Gültig bis — prominent */}
        <View style={styles.validBox}>
          {expired ? (
            <Text style={styles.expiredHeadline}>
              Abgelaufen am {formatDate(validUntil)}
            </Text>
          ) : (
            <Text style={styles.validHeadline}>Gültig bis {formatDate(validUntil)}</Text>
          )}
          <Text style={styles.validNote}>
            {expired
              ? "Die Preise können sich geändert haben — bitte erstellt unter www.wiesenhuette.de/angebot ein neues Angebot."
              : "Bis dahin ist diese Preis-Kalkulation für euch eingefroren — spätere Preisänderungen betreffen dieses Angebot nicht."}
          </Text>
        </View>

        {/* Empfänger / Anlass (optional) */}
        {hasRecipient && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Angebot für</Text>
            {institution && <Text style={styles.recipientName}>{institution}</Text>}
            {contactName && <Text style={styles.recipientLine}>z. Hd. {contactName}</Text>}
            {purpose && (
              <Text style={[styles.recipientLine, { color: C.textMuted }]}>
                Anlass: {purpose}
              </Text>
            )}
          </View>
        )}

        {/* Aufenthaltsdaten */}
        <View style={styles.section}>
          <View style={styles.stayBox}>
            <View style={styles.stayCol}>
              <Text style={styles.metaLabel}>Anreise</Text>
              <Text style={{ fontWeight: 700, marginTop: 2 }}>{formatDate(arrival)}</Text>
            </View>
            <View style={styles.stayCol}>
              <Text style={styles.metaLabel}>Abreise</Text>
              <Text style={{ fontWeight: 700, marginTop: 2 }}>{formatDate(departure)}</Text>
            </View>
            <View style={styles.stayCol}>
              <Text style={styles.metaLabel}>Belegung</Text>
              <Text style={{ fontWeight: 700, marginTop: 2 }}>
                {persons} Personen · {nights} Nächte
              </Text>
              {personsDetail ? (
                <Text style={{ fontSize: 8, color: C.textMuted, marginTop: 1 }}>
                  {personsDetail}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Positionen (eingefrorener Snapshot) */}
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.thLabel]}>Position</Text>
            <Text style={[styles.th, styles.thTotal]}>Betrag</Text>
          </View>
          {lineItems.map((li, i) => (
            <View key={i} style={styles.tr}>
              <Text style={[styles.td, styles.tdLabel]}>{li.label}</Text>
              <Text style={[styles.td, styles.tdTotal]}>{formatEuro(li.totalCents)}</Text>
            </View>
          ))}
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Zwischensumme </Text>
            <Text style={styles.subtotalValue}>{formatEuro(subtotalCents)}</Text>
          </View>
          {kurtaxeCents > 0 && (
            <View>
              <View style={styles.extraRow}>
                <Text style={styles.extraLabel}>Kurtaxe Hochsauerland </Text>
                <Text style={styles.extraValue}>{formatEuro(kurtaxeCents)}</Text>
              </View>
              <Text style={[styles.extraDetail, { textAlign: "right" }]}>
                {kurtaxePersons} Personen (ab 16 Jahren) × {nights} Nächte — wird an die
                Kurverwaltung Winterberg abgeführt
              </Text>
            </View>
          )}
          {depositCents > 0 && (
            <View>
              <View style={styles.extraRow}>
                <Text style={styles.extraLabel}>Kaution </Text>
                <Text style={styles.extraValue}>{formatEuro(depositCents)}</Text>
              </View>
              <Text style={[styles.extraDetail, { textAlign: "right" }]}>
                Erstattung 14 Tage nach mangelfreier Abreise
              </Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text style={styles.totalLabel}>Gesamt inkl. Kaution & Kurtaxe </Text>
            <Text style={styles.totalValue}>
              {formatEuro(subtotalCents + kurtaxeCents + depositCents)}
            </Text>
          </View>
        </View>

        {/* Hinweise */}
        <View style={styles.notesBox}>
          <Text style={{ fontWeight: 700, marginBottom: 4 }}>
            Unverbindliches Angebot — vorbehaltlich Verfügbarkeit
          </Text>
          <Text>
            Dieses Angebot ist keine Reservierung und keine Rechnung — es entsteht kein Anspruch
            auf den Termin. Verbindlich wird der Aufenthalt erst mit einer Online-Buchung.
            Vereinsmitglieder erhalten beim Buchen 50 % Rabatt auf die Übernachtung; das Angebot
            rechnet konservativ ohne Rabatt.
          </Text>
          <Text style={{ marginTop: 6 }}>
            <Text style={{ fontWeight: 700 }}>Online-Version & verbindliche Buchung:</Text>{" "}
            {onlineUrl}
          </Text>
          <Text style={{ marginTop: 6 }}>
            Skifreunde Gütersloh e.V. ist ein gemeinnütziger Verein im Sinne der §§ 51 ff. AO. Die
            Vermietung der Wiesenhütte erfolgt im Rahmen des satzungsmäßigen Vereinszwecks; eine
            Umsatzsteuer wird nicht ausgewiesen.
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Skifreunde Gütersloh e.V. · Bundesstraße 6, 59955 Winterberg-Langewiese · hello@wiesenhuette.de
          {"\n"}
          Vereinsregister Gütersloh VR 320 · Gemeinnützig anerkannt · Keine USt nach §4 UStG
        </Text>
      </Page>
    </Document>
  );
}
