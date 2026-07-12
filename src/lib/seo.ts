// =============================================================
// Strukturierte Daten (schema.org) für die Wiesenhütte
//
// Zentrale Builder, damit Startseite (/) und /huette dieselbe LodgingBusiness-
// Entität referenzieren (gleiche @id). AggregateRating wird NUR ausgegeben,
// wenn auf der Seite auch tatsächlich Bewertungen sichtbar sind (Google-Richtlinie).
// =============================================================

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wiesenhuette.de";

/** Absolute URL aus einem relativen Pfad (für image/url-Felder im Schema). */
const abs = (path: string) => new URL(path, SITE_URL).toString();

export type LodgingSchemaInput = {
  /** Durchschnittsbewertung (1–5); weglassen, wenn keine Bewertungen sichtbar. */
  ratingValue?: number;
  /** Anzahl Bewertungen; > 0 nötig, damit AggregateRating ausgegeben wird. */
  reviewCount?: number;
};

/**
 * LodgingBusiness-Schema für die Wiesenhütte (Selbstversorgerhütte, 33 Plätze,
 * Langewiese/Hochsauerland). Geo aus /lage. Adresse auf Orts-Ebene (Straße der
 * Hütte wird bewusst nicht erfunden).
 */
export function lodgingBusinessSchema(input: LodgingSchemaInput = {}): Record<string, unknown> {
  const { ratingValue, reviewCount } = input;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": `${SITE_URL}/#lodging`,
    name: "Wiesenhütte · Skifreunde Gütersloh e.V.",
    description:
      "Selbstversorgerhütte in Langewiese im Hochsauerland — 33 Schlafplätze in 5 Zimmern, mitten im Wander- und Wintersportgebiet rund um den Kahlen Asten. Ideal für Vereine, Schulklassen, Familien­feiern und Gruppen.",
    url: SITE_URL,
    image: abs("/media/video/hero-poster.jpg"),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Langewiese",
      addressRegion: "Nordrhein-Westfalen",
      postalCode: "59955",
      addressCountry: "DE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 51.1524045,
      longitude: 8.4636047,
      elevation: "690",
    },
    numberOfRooms: 5,
    petsAllowed: false, // Hausordnung/AGB: „Tiere aller Art sind zu keiner Zeit erlaubt."
    priceRange: "€€",
    currenciesAccepted: "EUR",
    paymentAccepted: "Kreditkarte, SEPA-Lastschrift",
    potentialAction: {
      "@type": "ReserveAction",
      target: abs("/buchen"),
    },
  };

  if (ratingValue && reviewCount && reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Math.round(ratingValue * 10) / 10,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}
