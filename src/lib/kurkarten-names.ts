import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

/**
 * Liest die Gästenamen direkt aus dem AVS-Kurkarten-PDF, indem das PDF als
 * Dokument an Claude übergeben wird (kein Text-Parsing mehr nötig — die
 * vorherige pdf-parse/pdfjs-dist-Lösung crashte in Vercels Serverless-Umgebung
 * mit "DOMMatrix is not defined", weil pdfjs-dist dort Browser-Globals
 * voraussetzt). Schlägt die Extraktion fehl (fehlender API-Key, Netzwerk-
 * fehler o. ä.), wird eine leere Liste zurückgegeben — der Kurkarten-Upload
 * selbst darf davon nie abhängen.
 */
export type KurkartenInfo = {
  names: string[];
  /**
   * Staatsangehörigkeiten aus dem Meldeschein-Teil (z. B. "niederländisch").
   * Leer, wenn nicht erkennbar. Für die Meldeschein-Mail an Toni bei
   * ausländischen Gästen (Unterschrift auf Papier, § 29 BMG).
   */
  nationalities: string[];
};

/** Mindestens eine nicht-deutsche Staatsangehörigkeit erkannt? */
export const hasForeignGuests = (info: KurkartenInfo): boolean =>
  info.nationalities.some((n) => n.trim() !== "" && !/^deutsch/i.test(n.trim()));

export async function extractNamesFromKurkartenPdf(buffer: Buffer): Promise<KurkartenInfo> {
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: buffer.toString("base64"),
              },
            },
            {
              type: "text",
              text: "Dies ist ein AVS-Kurkarten-PDF mit einer Gästekarte pro Person und einem Meldeschein-Block (Anschrift, darunter \"Land - Staatsangehörigkeit\", z. B. \"Niederlande - niederländisch\" oder \"Deutschland - deutsch\"). 1) names: die vollständigen Namen aller Gäste in der Reihenfolge, in der sie im Dokument erscheinen — nur Namen, keine Preise, Orte, Kategorien oder Kartencodes. 2) nationalities: alle im Dokument genannten Staatsangehörigkeiten (nur das Adjektiv nach dem Bindestrich, kleingeschrieben, ohne Duplikate, z. B. \"niederländisch\"); leere Liste, wenn keine genannt ist.",
            },
          ],
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              names: { type: "array", items: { type: "string" } },
              nationalities: { type: "array", items: { type: "string" } },
            },
            required: ["names", "nationalities"],
            additionalProperties: false,
          },
        },
      },
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return { names: [], nationalities: [] };
    const parsed = JSON.parse(textBlock.text) as { names: string[]; nationalities?: string[] };
    return {
      names: parsed.names.filter((n) => n.trim().length > 0),
      nationalities: (parsed.nationalities ?? []).map((n) => n.trim().toLowerCase()).filter(Boolean),
    };
  } catch (err) {
    console.error("[kurkarten-names] KI-Extraktion fehlgeschlagen:", err);
    return { names: [], nationalities: [] };
  }
}
