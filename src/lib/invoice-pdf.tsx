/**
 * GoBD-konforme PDF-Rechnung als @react-pdf/renderer-Komponente.
 *
 * Wichtige Pflichtangaben gemäß §14 UStG (auch fuer gemeinnuetzige Vereine
 * empfohlen, soweit Rechnungen ueberhaupt ausgestellt werden):
 *  - Rechnungsaussteller mit vollstaendiger Anschrift
 *  - Rechnungsempfaenger
 *  - Steuernummer (oder USt-IdNr; Verein hat Steuernummer)
 *  - Ausstellungsdatum
 *  - Fortlaufende Rechnungsnummer (WH-YYYY-NNNNN)
 *  - Menge / Art der Leistung / Leistungszeitraum
 *  - Entgelt
 *  - USt-Hinweis (hier: gemeinnuetziger Verein, Vermietung steuerfrei)
 */

import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Farben analog zur Webseite
const C = {
  green: "#2F4A35",
  textBlack: "#111111",
  textMuted: "#5b5b56",
  border: "#C8CEC4",
  beige: "#EFE6D8",
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
    marginBottom: 28,
    borderBottomWidth: 2,
    borderBottomColor: C.green,
  },
  companyName: { fontSize: 18, fontWeight: 700, color: C.green },
  companyMeta: { fontSize: 9, color: C.textMuted, marginTop: 2 },
  invoiceMetaLabel: {
    fontSize: 8,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "Courier",
    marginTop: 2,
  },
  metaText: { fontSize: 9, color: C.textMuted, marginTop: 1 },
  section: { marginBottom: 22 },
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
  thQty: { width: 50, textAlign: "right" },
  thUnit: { width: 70, textAlign: "right" },
  thTotal: { width: 80, textAlign: "right" },
  thLabel: { flex: 1 },
  tr: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  td: { fontSize: 10 },
  tdQty: { width: 50, textAlign: "right" },
  tdUnit: { width: 70, textAlign: "right", fontFamily: "Courier" },
  tdTotal: { width: 80, textAlign: "right", fontFamily: "Courier" },
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
    width: 80,
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
    width: 80,
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
    width: 80,
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

export type InvoicePdfProps = {
  invoiceNumber: string;
  issueDate: string | Date;
  bookingNumber: string;
  customer: {
    name: string;
    company?: string;
    street?: string;
    zip?: string;
    city?: string;
    country?: string;
    email?: string;
  };
  arrival: string;
  departure: string;
  nights: number;
  persons: number;
  lineItems: { label: string; qty: number; unitCents: number; totalCents: number }[];
  subtotalCents: number;
  depositCents: number;
  kurtaxeCents: number;
  kurtaxePersons: number;
  /** Buchung vor dem Storno-Stichtag (05.07.2026) — zeigt die Alt-Staffel. */
  isLegacy: boolean;
  notes?: string;
};

export function InvoicePdf({
  invoiceNumber,
  issueDate,
  bookingNumber,
  customer,
  arrival,
  departure,
  nights,
  persons,
  lineItems,
  subtotalCents,
  depositCents,
  kurtaxeCents,
  kurtaxePersons,
  isLegacy,
  notes,
}: InvoicePdfProps) {
  return (
    <Document
      title={`Rechnung ${invoiceNumber}`}
      author="Skifreunde Gütersloh e.V."
      subject={`Buchung ${bookingNumber}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Kopf */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>Wiesenhütte</Text>
            <Text style={styles.companyMeta}>Skifreunde Gütersloh e.V.</Text>
            <Text style={styles.companyMeta}>Wiesenhütte 1, 59955 Winterberg-Langewiese</Text>
            <Text style={styles.companyMeta}>hello@wiesenhuette.de · www.wiesenhuette.de</Text>
            <Text style={styles.companyMeta}>
              Gemeinnütziger Verein · Vereinsregister Gütersloh VR 312
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.invoiceMetaLabel}>Rechnung</Text>
            <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
            <Text style={styles.metaText}>
              Ausstellungsdatum: {formatDate(issueDate)}
            </Text>
            <Text style={styles.metaText}>Buchung: {bookingNumber}</Text>
          </View>
        </View>

        {/* Empfaenger */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Rechnungsempfänger</Text>
          <Text style={styles.recipientName}>{customer.name}</Text>
          {customer.company && <Text style={styles.recipientLine}>{customer.company}</Text>}
          {customer.street && <Text style={styles.recipientLine}>{customer.street}</Text>}
          {(customer.zip || customer.city) && (
            <Text style={styles.recipientLine}>
              {[customer.zip, customer.city].filter(Boolean).join(" ")}
            </Text>
          )}
          {customer.country && customer.country !== "DE" && (
            <Text style={styles.recipientLine}>{customer.country}</Text>
          )}
          {customer.email && (
            <Text style={[styles.recipientLine, { color: C.textMuted }]}>{customer.email}</Text>
          )}
        </View>

        {/* Aufenthaltsdaten */}
        <View style={styles.section}>
          <View style={styles.stayBox}>
            <View style={styles.stayCol}>
              <Text style={styles.invoiceMetaLabel}>Anreise</Text>
              <Text style={{ fontWeight: 700, marginTop: 2 }}>{formatDate(arrival)}</Text>
            </View>
            <View style={styles.stayCol}>
              <Text style={styles.invoiceMetaLabel}>Abreise</Text>
              <Text style={{ fontWeight: 700, marginTop: 2 }}>{formatDate(departure)}</Text>
            </View>
            <View style={styles.stayCol}>
              <Text style={styles.invoiceMetaLabel}>Belegung</Text>
              <Text style={{ fontWeight: 700, marginTop: 2 }}>
                {persons} Personen · {nights} Nächte
              </Text>
            </View>
          </View>
        </View>

        {/* Positionen */}
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.thLabel]}>Position</Text>
            <Text style={[styles.th, styles.thQty]}>Menge</Text>
            <Text style={[styles.th, styles.thUnit]}>Einzel</Text>
            <Text style={[styles.th, styles.thTotal]}>Betrag</Text>
          </View>
          {lineItems.map((li, i) => (
            <View key={i} style={styles.tr}>
              <Text style={[styles.td, styles.tdLabel]}>{li.label}</Text>
              <Text style={[styles.td, styles.tdQty]}>{li.qty}</Text>
              <Text style={[styles.td, styles.tdUnit]}>{formatEuro(li.unitCents)}</Text>
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
                {kurtaxePersons} Personen ab 16 Jahren — wird an die Kurverwaltung Winterberg abgeführt
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
            <Text style={styles.totalLabel}>Gesamtbetrag </Text>
            <Text style={styles.totalValue}>
              {formatEuro(subtotalCents + kurtaxeCents + depositCents)}
            </Text>
          </View>
        </View>

        {/* USt-Hinweis */}
        <View style={styles.notesBox}>
          <Text style={{ fontWeight: 700, marginBottom: 4 }}>Hinweis zur Umsatzsteuer</Text>
          <Text>
            Skifreunde Gütersloh e.V. ist ein gemeinnütziger Verein im Sinne der §§ 51 ff. AO. Die
            Vermietung der Wiesenhütte erfolgt im Rahmen des satzungsmäßigen Vereinszwecks. Eine
            Umsatzsteuer wird daher nicht ausgewiesen. Freistellungsbescheid des Finanzamts auf
            Anfrage.
          </Text>
          {notes && (
            <Text style={{ marginTop: 6, color: C.textMuted }}>{notes}</Text>
          )}
          <Text style={{ marginTop: 8 }}>
            <Text style={{ fontWeight: 700 }}>Stornierungsbedingungen:</Text>{" "}
            {isLegacy
              ? <>{">"} 30 Tage vor Anreise 0 % · 29–14 Tage 30 % · 13–7 Tage 60 % · {"<"} 7 Tage 90 % der Zwischensumme (ohne Kaution).</>
              : <>{">"} 30 Tage vor Anreise 0 % · 30–14 Tage 50 % · {"<"} 14 Tage 100 % des reinen Übernachtungspreises.</>}
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Skifreunde Gütersloh e.V. · Wiesenhütte 1, 59955 Winterberg-Langewiese · hello@wiesenhuette.de
          {"\n"}
          Vereinsregister Gütersloh VR 312 · Gemeinnützig anerkannt · Keine USt nach §4 UStG
        </Text>
      </Page>
    </Document>
  );
}
