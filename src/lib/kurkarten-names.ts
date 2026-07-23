import { PDFParse } from "pdf-parse";

// AVS-Kurkarten-PDFs sind maschinell erzeugt und folgen pro Gast einem festen
// 7-Zeilen-Block: "<Kategorie-Kürzel> <Nummer>", Name, Zeitraum, Barcode-Ziffern,
// Ort, Preis, Kartencode. Statt auf das (variable) Kategorie-Kürzel zu ankern,
// nutzen wir den zuverlässig immer gleich formatierten Zeitraum als Anker und
// nehmen die Zeile direkt davor als Name — robust auch bei Leerzeilen/
// Seitenumbrüchen zwischen den Blöcken.
const DATE_RANGE_RE = /^\d{2}\.\d{2}\.\d{2}\s*-\s*\d{2}\.\d{2}\.\d{2}$/;

export function extractNamesFromText(text: string): string[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const names: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!DATE_RANGE_RE.test(lines[i])) continue;
    const candidate = lines[i - 1];
    // Sanity-Check: eine Namenszeile enthaelt kein "€" (Preis) und ist kein
    // Seitenumbruch-Marker ("-- 1 of 6 --").
    if (candidate && !candidate.includes("€") && !/^--.*--$/.test(candidate)) {
      names.push(candidate);
    }
  }
  return names;
}

/**
 * Bestpraktig, kein Fehler nach oben: schlaegt die Extraktion fehl (z. B.
 * unerwartetes PDF-Layout), wird eine leere Liste zurueckgegeben — der
 * eigentliche Kurkarten-Upload darf davon nie abhaengen. Dana sieht dann
 * einfach eine leere Vorschlagsliste und traegt Namen manuell ein.
 */
export async function extractNamesFromKurkartenPdf(buffer: Buffer): Promise<string[]> {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return extractNamesFromText(result.text);
  } catch (err) {
    console.error("[kurkarten-names] Extraktion fehlgeschlagen:", err);
    return [];
  }
}
