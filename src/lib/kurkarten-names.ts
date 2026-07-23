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
export async function extractNamesFromKurkartenPdf(buffer: Buffer): Promise<string[]> {
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
              text: "Dies ist ein AVS-Kurkarten-PDF mit einer Gästekarte pro Person. Extrahiere die vollständigen Namen aller Gäste in der Reihenfolge, in der sie im Dokument erscheinen. Gib nur die Namen zurück — keine Preise, Orte, Kategorien oder Kartencodes.",
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
            },
            required: ["names"],
            additionalProperties: false,
          },
        },
      },
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return [];
    const parsed = JSON.parse(textBlock.text) as { names: string[] };
    return parsed.names.filter((n) => n.trim().length > 0);
  } catch (err) {
    console.error("[kurkarten-names] KI-Extraktion fehlgeschlagen:", err);
    return [];
  }
}
