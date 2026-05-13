/**
 * PDF-Renderer für die personalisierte Packliste.
 */

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import {
  type PackCategory,
  type PackInput,
  SEASON_LABEL,
  ACTIVITY_LABEL,
  renderItemQuantity,
} from "./packliste-rules";

const C = {
  green: "#2F4A35",
  textBlack: "#111111",
  textMuted: "#5b5b56",
  border: "#C8CEC4",
  beige: "#EFE6D8",
  snow: "#FAF9F5",
};

const styles = StyleSheet.create({
  page: {
    padding: 44,
    fontSize: 10,
    color: C.textBlack,
    fontFamily: "Helvetica",
    lineHeight: 1.45,
  },
  header: {
    paddingBottom: 14,
    marginBottom: 22,
    borderBottomWidth: 2,
    borderBottomColor: C.green,
  },
  eyebrow: {
    fontSize: 8,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: { fontSize: 24, fontWeight: 700, color: C.green },
  subtitle: { fontSize: 10, color: C.textMuted, marginTop: 4 },
  metaRow: { flexDirection: "row", marginTop: 12, gap: 16 },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 7, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8 },
  metaValue: { fontSize: 11, fontWeight: 700, marginTop: 2, color: C.green },
  category: { marginTop: 16, marginBottom: 4 },
  categoryTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: C.green,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  itemRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingLeft: 2,
    alignItems: "flex-start",
  },
  itemCheck: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: C.green,
    borderRadius: 1.5,
    marginRight: 8,
    marginTop: 1.5,
  },
  itemQty: {
    width: 32,
    fontSize: 9,
    fontFamily: "Courier",
    color: C.textMuted,
    paddingTop: 0.5,
  },
  itemBody: { flex: 1 },
  itemName: { fontSize: 10 },
  itemHint: { fontSize: 8, color: C.textMuted, marginTop: 1 },
  footer: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    fontSize: 8,
    color: C.textMuted,
  },
  smallNote: {
    backgroundColor: C.beige,
    padding: 8,
    marginTop: 14,
    borderRadius: 4,
    fontSize: 9,
  },
});

export function PacklistePdf({
  input,
  categories,
}: {
  input: PackInput;
  categories: PackCategory[];
}) {
  const generatedAt = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const activitiesLabel =
    input.activities.length > 0
      ? input.activities.map((a) => ACTIVITY_LABEL[a]).join(", ")
      : "Allgemein";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Wiesenhütte · Persönliche Packliste</Text>
          <Text style={styles.title}>Deine Packliste</Text>
          <Text style={styles.subtitle}>
            Generiert am {generatedAt} · Druck-freundlich mit Häkchen-Boxen
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Saison</Text>
              <Text style={styles.metaValue}>{SEASON_LABEL[input.season]}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Übernachtungen</Text>
              <Text style={styles.metaValue}>{input.nights}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Aktivitäten</Text>
              <Text style={styles.metaValue}>{activitiesLabel}</Text>
            </View>
          </View>
        </View>

        {categories.map((cat) => (
          <View key={cat.title} style={styles.category} wrap={false}>
            <Text style={styles.categoryTitle}>{cat.title}</Text>
            {cat.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemCheck} />
                <Text style={styles.itemQty}>{renderItemQuantity(item)}</Text>
                <View style={styles.itemBody}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.hint && <Text style={styles.itemHint}>{item.hint}</Text>}
                </View>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.smallNote}>
          <Text>
            Mengen mit „xN" sind die empfohlene Stückzahl. Items ohne Zahl: 1 Stück. Die Sektion
            „Gemeinsam absprechen" enthält Dinge, die nur eine Person aus der Gruppe mitbringen
            muss — kurz vor der Anreise abstimmen.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>
            Wiesenhütte Langewiese · Skifreunde Gütersloh e.V. · wiesenhütte.com/packliste
          </Text>
        </View>
      </Page>
    </Document>
  );
}
