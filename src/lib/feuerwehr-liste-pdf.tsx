import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Farben analog zur Webseite / InvoicePdf
const C = {
  green: "#2F4A35",
  textBlack: "#111111",
  textMuted: "#5b5b56",
  border: "#C8CEC4",
  beige: "#EFE6D8",
};

const styles = StyleSheet.create({
  page: { padding: 50, fontSize: 11, color: C.textBlack, fontFamily: "Helvetica", lineHeight: 1.45 },
  header: {
    paddingBottom: 14,
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: C.green,
  },
  eyebrow: {
    fontSize: 9,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  title: { fontSize: 20, fontWeight: 700, color: C.green },
  meta: { fontSize: 10, color: C.textMuted, marginTop: 8 },
  note: {
    backgroundColor: C.beige,
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
    fontSize: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0.8,
    borderBottomColor: C.border,
    paddingVertical: 7,
  },
  box: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: C.textBlack,
    marginRight: 10,
  },
  num: { width: 24, fontSize: 9, color: C.textMuted },
  name: { fontSize: 12 },
});

export type FeuerwehrListePdfProps = {
  bookingNumber: string;
  groupName: string;
  arrival: string;
  departure: string;
  names: string[];
};

export function FeuerwehrListePdf({
  bookingNumber,
  groupName,
  arrival,
  departure,
  names,
}: FeuerwehrListePdfProps) {
  return (
    <Document
      title={`Feuerwehr-Meldeliste ${bookingNumber}`}
      author="Skifreunde Gütersloh e.V."
      subject={`Buchung ${bookingNumber}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Wiesenhütte · Feuerwehr-Meldeliste</Text>
          <Text style={styles.title}>{groupName}</Text>
          <Text style={styles.meta}>
            {arrival} – {departure} · Buchung {bookingNumber}
          </Text>
        </View>

        <View style={styles.note}>
          <Text>
            Bitte bei Anreise Teilnehmer:innen durchstreichen, die doch nicht mitgekommen sind —
            auch bei vorzeitigen Abreisen. So wartet die Feuerwehr im Ernstfall nicht unnötig auf
            jemanden, der gar nicht (mehr) da ist.
          </Text>
        </View>

        {names.map((name, i) => (
          <View key={i} style={styles.row} wrap={false}>
            <Text style={styles.num}>{i + 1}.</Text>
            <View style={styles.box} />
            <Text style={styles.name}>{name}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
