/**
 * Server-side Loader für die Trust-Daten (Trust-Badge im Hero + Popup-Modal).
 *
 * Strategie: Wenn die DB live ist und published Reviews hat → DB-Daten.
 * Wenn die DB leer ist oder unerreichbar → STATIC_FALLBACK (kuratiert,
 * basiert auf den 25 echten Google-Reviews). So ist der Badge IMMER
 * sichtbar — auch auf Preview-Deployments ohne Seed-Daten.
 *
 * Sobald der Hütten-Betreiber Reviews via /m/bewertungen pflegt, gewinnen
 * automatisch die DB-Daten — der Fallback ist Backstop, kein Ersatz.
 */

import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { externalReviews } from "@/lib/db/schema";
import { eq, desc, and, isNotNull } from "drizzle-orm";

/** Cache-Tag — bei Review-Mutationen via revalidateTag("trust-reviews") invalidieren. */
export const TRUST_REVIEWS_TAG = "trust-reviews";

export type TrustReviewItem = {
  id: string;
  authorName: string;
  rating: number | null;
  text: string | null;
  relativeTime: string | null;
  source: string;
  translated: boolean;
  originalLanguage: string | null;
};

export type TrustData = {
  avg: number;
  count: number;
  sources: string[];
  items: TrustReviewItem[]; // alle published, neueste zuerst
};

const SOURCE_LABELS: Record<string, string> = {
  google: "Google",
  gruppenhaus: "Gruppenhaus.de",
  gruppenunterkuenfte: "Gruppenunterkünfte.de",
  manual: "",
};

// =========================================================================
// STATIC_FALLBACK — 25 echte Google-Reviews der Wiesenhütte als Backup, falls
// die DB leer ist oder nicht erreichbar. 14× 5★, 8× 4★, 2× 3★, 1× 1★ → Ø 4,36.
// =========================================================================
const STATIC_REVIEWS: TrustReviewItem[] = [
  {
    id: "static-1",
    authorName: "Sebastian Meschede",
    rating: 5,
    text: "Gemütliche einfache Hütte für Gruppen. Selbstversorger. Gut ausgestattete Küche. Toller Blick aus dem Aufenthaltsraum. Alles sauber und in gutem Zustand.",
    relativeTime: "vor 5 Monaten",
    source: "google",
    translated: false,
    originalLanguage: "de",
  },
  {
    id: "static-2",
    authorName: "Leenin Krüger",
    rating: 4,
    text: "Wir waren mit einer Kinderfreizeit hier. Super Lage, schön ruhig und rundherum genug zu erkunden. Haus ist alt und verwinkelt aber gut ausgestattet.",
    relativeTime: "vor einem Jahr",
    source: "google",
    translated: false,
    originalLanguage: "de",
  },
  {
    id: "static-3",
    authorName: "DRH Kleinert",
    rating: 5,
    text: "Dass ich das nochmal sehe... In der Hütte haben wir mit unserer Schulklasse im Winter (Februar) so 1976-1978 unvergessliche Tage verbracht.",
    relativeTime: "vor 3 Jahren",
    source: "google",
    translated: false,
    originalLanguage: "de",
  },
  {
    id: "static-4",
    authorName: "Rolf D",
    rating: 5,
    text: "Schöne Hütte. Wurden von den Damen top versorgt. Zum Skifahren nach Winterberg nur wenige Minuten.",
    relativeTime: "vor 3 Jahren",
    source: "google",
    translated: false,
    originalLanguage: "de",
  },
  {
    id: "static-5",
    authorName: "Stino1958 Heinz",
    rating: 5,
    text: "Vom Feinsten. Kommen schon mit den Bayern seit über zwanzig Jahren.",
    relativeTime: "vor 6 Jahren",
    source: "google",
    translated: false,
    originalLanguage: "de",
  },
  {
    id: "static-6",
    authorName: "Melanie Fink",
    rating: 5,
    text: "Sehr schönes Haus. Eher rustikal eingerichtet und auch schon alles etwas älter, aber alles sauber und gepflegt. Die Küche ist sehr groß und auch großzügig ausgestattet.",
    relativeTime: "vor 7 Jahren",
    source: "google",
    translated: false,
    originalLanguage: "de",
  },
  {
    id: "static-7",
    authorName: "Frank Andert",
    rating: 4,
    text: "Wir waren hier für zwei Übernachtungen zu einem Junggesellenabschied. Die Inneneinrichtung bietet herben Sauerland-Charme.",
    relativeTime: "vor 7 Jahren",
    source: "google",
    translated: false,
    originalLanguage: "de",
  },
  {
    id: "static-8",
    authorName: "Nicole Henkel",
    rating: 4,
    text: "Schöne zweckmäßig eingerichtete Hütte. Alles da was man braucht. Einfahrt etwas tricky. Netter Vorortkontakt.",
    relativeTime: "vor 6 Jahren",
    source: "google",
    translated: false,
    originalLanguage: "de",
  },
  {
    id: "static-9",
    authorName: "Yannic Aleff",
    rating: 4,
    text: "Einfache Hütte, aber gut ausgestattet. Ideal für Jugend- oder Mannschaftsfahrten. Etwas weit vom Schuss.",
    relativeTime: "vor 7 Jahren",
    source: "google",
    translated: false,
    originalLanguage: "de",
  },
  {
    id: "static-10",
    authorName: "Karin Lütgert",
    rating: 5,
    text: "Skihütte in gutem Zustand, Aufenthaltsort neu gestaltet. Nur schade, keine Vermietung wegen Corona.",
    relativeTime: "vor 5 Jahren",
    source: "google",
    translated: false,
    originalLanguage: "de",
  },
  {
    id: "static-11",
    authorName: "Daniel Bischoff",
    rating: 5,
    text: "Exzellenter Urlaubsort mit tollem Ausblick auf die Skipiste und vielen Unterbringungsmöglichkeiten.",
    relativeTime: "vor 7 Jahren",
    source: "google",
    translated: false,
    originalLanguage: "de",
  },
  {
    id: "static-12",
    authorName: "Corey Westerneng",
    rating: 4,
    text: "Gute Lage für eine große Gruppe, die Küche sieht gut aus, der Rest ist etwas in die Jahre gekommen, aber funktionsfähig.",
    relativeTime: "vor 7 Jahren",
    source: "google",
    translated: true,
    originalLanguage: "nl",
  },
  {
    id: "static-13",
    authorName: "Johannes Petzoldt",
    rating: 4,
    text: "Betten ohne Sachschäden, nur für kleine Leute, sonst alles okay.",
    relativeTime: "vor 7 Jahren",
    source: "google",
    translated: false,
    originalLanguage: "de",
  },
  {
    id: "static-14",
    authorName: "Kerstin",
    rating: 3,
    text: "Wir waren dort mit sieben Kindern und sechs Erwachsenen. Es ist zwar alt und nicht auf dem neuesten Stand, aber für ein Wochenende war es ok.",
    relativeTime: "vor 7 Jahren",
    source: "google",
    translated: false,
    originalLanguage: "de",
  },
  {
    id: "static-15",
    authorName: "Alexander Threm",
    rating: 3,
    text: "Einfach und funktional eingerichtet. Für handfeste Gruppenreisen gut geeignet.",
    relativeTime: "vor 6 Jahren",
    source: "google",
    translated: false,
    originalLanguage: "de",
  },
  // Reviews ohne Textinhalt — zaehlen mit fuer Durchschnitt + Count
  { id: "static-16", authorName: "Martina Völlmecke", rating: 5, text: null, relativeTime: "vor 3 Monaten", source: "google", translated: false, originalLanguage: "de" },
  { id: "static-17", authorName: "KIKI", rating: 4, text: null, relativeTime: "vor 2 Jahren", source: "google", translated: false, originalLanguage: "de" },
  { id: "static-18", authorName: "Monika Duffe", rating: 5, text: null, relativeTime: "vor 3 Jahren", source: "google", translated: false, originalLanguage: "de" },
  { id: "static-19", authorName: "Niklas Bruns", rating: 4, text: null, relativeTime: "vor 3 Jahren", source: "google", translated: false, originalLanguage: "de" },
  { id: "static-20", authorName: "Melanie Eckstein", rating: 5, text: null, relativeTime: "vor 3 Jahren", source: "google", translated: false, originalLanguage: "de" },
  { id: "static-21", authorName: "Thomas Schmidt", rating: 5, text: null, relativeTime: "vor 6 Jahren", source: "google", translated: false, originalLanguage: "de" },
  { id: "static-22", authorName: "Carla Wösthenrich", rating: 5, text: null, relativeTime: "vor 6 Jahren", source: "google", translated: false, originalLanguage: "de" },
  { id: "static-23", authorName: "Gucci Prada", rating: 5, text: null, relativeTime: "vor 7 Jahren", source: "google", translated: false, originalLanguage: "de" },
  { id: "static-24", authorName: "Tobi Vettel", rating: 5, text: null, relativeTime: "vor 8 Jahren", source: "google", translated: false, originalLanguage: "de" },
  { id: "static-25", authorName: "Leon Die", rating: 1, text: null, relativeTime: "vor 6 Jahren", source: "google", translated: false, originalLanguage: "de" },
];

const STATIC_FALLBACK: TrustData = (() => {
  const rated = STATIC_REVIEWS.filter((r) => r.rating !== null);
  const sum = rated.reduce((acc, r) => acc + (r.rating ?? 0), 0);
  return {
    avg: sum / rated.length, // 4.36
    count: rated.length, // 25
    sources: ["Google"],
    items: STATIC_REVIEWS,
  };
})();

/**
 * Liefert immer TrustData zurück — entweder DB oder Static-Fallback.
 * Der Trust-Badge ist damit garantiert sichtbar.
 */
async function loadTrustDataUncached(): Promise<TrustData> {
  try {
    const rated = await db
      .select({ rating: externalReviews.rating, source: externalReviews.source })
      .from(externalReviews)
      .where(and(eq(externalReviews.published, true), isNotNull(externalReviews.rating)));

    // Wenn DB-Tabelle leer ist → Fallback
    if (rated.length === 0) return STATIC_FALLBACK;

    const avg = rated.reduce((acc, r) => acc + (r.rating ?? 0), 0) / rated.length;
    const sources = Array.from(new Set(rated.map((r) => r.source)))
      .map((s) => SOURCE_LABELS[s as string] ?? s)
      .filter(Boolean);

    // Alle published Reviews fuer das Modal — sortiert: Highlights zuerst,
    // dann neueste mit Text, dann der Rest.
    const allRows = await db
      .select()
      .from(externalReviews)
      .where(eq(externalReviews.published, true))
      .orderBy(desc(externalReviews.highlight), desc(externalReviews.reviewedAt));

    const items: TrustReviewItem[] = allRows.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      text: r.text,
      relativeTime: r.relativeTime,
      source: r.source as string,
      translated: r.translated,
      originalLanguage: r.originalLanguage,
    }));

    return {
      avg,
      count: rated.length,
      sources,
      items,
    };
  } catch (err) {
    // DB nicht erreichbar / Tabelle fehlt → Fallback statt null
    console.warn("[loadTrustData] DB-Query fehlgeschlagen, nutze Static-Fallback:", err);
    return STATIC_FALLBACK;
  }
}

/**
 * Liefert immer TrustData — gecacht (Next Data Cache). Wird bei jedem
 * Seitenaufruf auf `/` (Hero + PullQuote) gebraucht; der Cache verhindert
 * doppelte DB-Queries pro Request UND erneute Queries über Requests hinweg.
 * Invalidierung erfolgt sofort via revalidateTag("trust-reviews") aus den
 * Manager-Actions, sobald sich Reviews ändern.
 */
export const loadTrustData = unstable_cache(
  loadTrustDataUncached,
  ["trust-data-v1"],
  { tags: [TRUST_REVIEWS_TAG] }
);
