// AVS exportiert die Kurkarten-Sammel-PDF immer unter demselben generischen
// Dateinamen (z. B. "pdfDruck.pdf") — beim Hochladen/Weiterleiten hier durch
// einen sprechenden Namen (Nachname + Anreisedatum) ersetzen, damit sie in
// Danas/Tonis Postfach und Downloads unterscheidbar bleibt.
export function buildKurkartenFilename(lastName: string, arrival: string): string {
  const safeName =
    lastName
      .replace(/ä/gi, "ae")
      .replace(/ö/gi, "oe")
      .replace(/ü/gi, "ue")
      .replace(/ß/gi, "ss")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "Gast";
  return `Kurkarten_${safeName}_${arrival}.pdf`;
}
