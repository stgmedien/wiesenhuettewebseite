/**
 * Server-seitiger JSON-LD-Injektor (kein Client-JS). Das übergebene Objekt wird
 * aus eigenen, vertrauenswürdigen Werten gebaut — daher ist dangerouslySetInnerHTML
 * hier unbedenklich. Mehrere Instanzen pro Seite sind erlaubt.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
