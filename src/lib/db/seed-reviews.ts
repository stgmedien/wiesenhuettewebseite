/**
 * Seed-Daten für die externalReviews-Tabelle.
 *
 * Quelle Google: Vom Manager/Betreiber aus dem eigenen Google-Business-Profil
 * der Hütte exportiert (Stand: Mai 2026). Authoren werden mit dem Namen so
 * dargestellt, wie sie public auf Google sichtbar sind. Stern-Werte + relative
 * Zeit-Angaben werden 1:1 übernommen; das geschätzte reviewedAt-Datum
 * berechnen wir aus heute - "vor X Monaten/Jahren" für Sortierzwecke.
 *
 * Aufruf:  npm run db:seed:reviews
 */

import "dotenv/config";
import { db } from "./index";
import { externalReviews } from "./schema";
import { sql } from "drizzle-orm";

type SeedReview = {
  source: "google" | "gruppenhaus" | "gruppenunterkuenfte" | "manual";
  authorName: string;
  rating: number | null; // 1-5 oder null
  text: string | null;
  relativeTime: string | null;
  /** Geschätzte Tage in der Vergangenheit (für reviewedAt) */
  ageDays: number;
  /** Stabiler Identifier innerhalb der Quelle (für unique-constraint) */
  sourceRef: string;
  sourceUrl?: string;
  originalLanguage?: string;
  translated?: boolean;
  /** Initial-Highlight für den Trust-Badge-Carousel? (manuelle Auswahl der besten) */
  highlight?: boolean;
};

const MONTH = 30;
const YEAR = 365;

// Reviews — eingegeben durch den Hütten-Betreiber aus seinem Google-Business-
// Profil. Die "vor X Jahren"-Werte sind Google-Originale; wir konvertieren in
// ein approximiertes Datum (heute - X) damit wir sortieren können.
const GOOGLE_REVIEWS: SeedReview[] = [
  {
    source: "google",
    authorName: "Sebastian Meschede",
    rating: 5,
    text: "Gemütliche einfache Hütte für Gruppen. Selbstversorger. Gut ausgestattete Küche. Toller Blick aus dem Aufenthaltsraum. Alles sauber und in gutem Zustand.",
    relativeTime: "vor 5 Monaten",
    ageDays: 5 * MONTH,
    sourceRef: "google:sebastian-meschede-2025-12",
    highlight: true,
  },
  {
    source: "google",
    authorName: "Leenin Krüger",
    rating: 4,
    text: "Wir waren mit einer Kinderfreizeit hier. Super Lage, schön ruhig und rundherum genug zu erkunden. Haus ist alt und verwinkelt aber gut ausgestattet.",
    relativeTime: "vor einem Jahr",
    ageDays: YEAR,
    sourceRef: "google:leenin-krueger-2025-05",
    highlight: true,
  },
  {
    source: "google",
    authorName: "Melanie Fink",
    rating: 5,
    text: "Sehr schönes Haus. Eher rustikal eingerichtet und auch schon alles etwas älter, aber alles sauber und gepflegt. Die Küche ist sehr groß und auch großzügig ausgestattet.",
    relativeTime: "vor 7 Jahren",
    ageDays: 7 * YEAR,
    sourceRef: "google:melanie-fink-2019-05",
  },
  {
    source: "google",
    authorName: "Frank Andert",
    rating: 4,
    text: "Wir waren hier für zwei Übernachtungen zu einem Junggesellenabschied. Die Inneneinrichtung bietet herben Sauerland-Charme. Dunkle Möbel, alte Substanz — aber mit Charakter.",
    relativeTime: "vor 7 Jahren",
    ageDays: 7 * YEAR,
    sourceRef: "google:frank-andert-2019-05",
  },
  {
    source: "google",
    authorName: "DRH Kleinert",
    rating: 5,
    text: "Dass ich das nochmal sehe... In der Hütte haben wir mit unserer Schulklasse im Winter (Februar) so 1976-1978 unvergessliche Tage verbracht.",
    relativeTime: "vor 3 Jahren",
    ageDays: 3 * YEAR,
    sourceRef: "google:drh-kleinert-2023-05",
    highlight: true,
  },
  {
    source: "google",
    authorName: "Nicole Henkel",
    rating: 4,
    text: "Schöne zweckmäßig eingerichtete Hütte. Alles da was man braucht. Einfahrt etwas tricky. Netter Vorortkontakt.",
    relativeTime: "vor 6 Jahren",
    ageDays: 6 * YEAR,
    sourceRef: "google:nicole-henkel-2020-05",
  },
  {
    source: "google",
    authorName: "Kerstin",
    rating: 3,
    text: "Wir waren dort mit sieben Kindern und sechs Erwachsenen. Es ist zwar alt und nicht auf dem neuesten Stand, aber für ein Wochenende war es ok.",
    relativeTime: "vor 7 Jahren",
    ageDays: 7 * YEAR,
    sourceRef: "google:kerstin-2019-05",
  },
  {
    source: "google",
    authorName: "Yannic Aleff",
    rating: 4,
    text: "Einfache Hütte, aber gut ausgestattet. Ideal für Jugend- oder Mannschaftsfahrten. Etwas weit vom Schuss.",
    relativeTime: "vor 7 Jahren",
    ageDays: 7 * YEAR,
    sourceRef: "google:yannic-aleff-2019-05",
  },
  {
    source: "google",
    authorName: "Karin Lütgert",
    rating: 5,
    text: "Skihütte in gutem Zustand, Aufenthaltsort neu gestaltet. Nur schade, keine Vermietung wegen Corona.",
    relativeTime: "vor 5 Jahren",
    ageDays: 5 * YEAR,
    sourceRef: "google:karin-luetgert-2021-05",
  },
  {
    source: "google",
    authorName: "Alexander Threm",
    rating: 3,
    text: "Einfach und funktional eingerichtet. Für handfeste Gruppenreisen gut geeignet.",
    relativeTime: "vor 6 Jahren",
    ageDays: 6 * YEAR,
    sourceRef: "google:alexander-threm-2020-05",
  },
  {
    source: "google",
    authorName: "Rolf D",
    rating: 5,
    text: "Schöne Hütte. Wurden von den Damen top versorgt. Zum Skifahren nach Winterberg nur wenige Minuten.",
    relativeTime: "vor 3 Jahren",
    ageDays: 3 * YEAR,
    sourceRef: "google:rolf-d-2023-05",
    highlight: true,
  },
  {
    source: "google",
    authorName: "Johannes Petzoldt",
    rating: 4,
    text: "Betten ohne Sachschäden, nur für kleine Leute, sonst alles okay.",
    relativeTime: "vor 7 Jahren",
    ageDays: 7 * YEAR,
    sourceRef: "google:johannes-petzoldt-2019-05",
  },
  {
    source: "google",
    authorName: "Daniel Bischoff",
    rating: 5,
    text: "Exzellenter Urlaubsort mit tollem Ausblick auf die Skipiste und vielen Unterbringungsmöglichkeiten.",
    relativeTime: "vor 7 Jahren",
    ageDays: 7 * YEAR,
    sourceRef: "google:daniel-bischoff-2019-05",
  },
  {
    source: "google",
    authorName: "Stino1958 Heinz",
    rating: 5,
    text: "Vom Feinsten. Kommen schon mit den Bayern seit über zwanzig Jahren.",
    relativeTime: "vor 6 Jahren",
    ageDays: 6 * YEAR,
    sourceRef: "google:stino1958-heinz-2020-05",
    highlight: true,
  },
  {
    source: "google",
    authorName: "Corey Westerneng",
    rating: 4,
    text: "Gute Lage für eine große Gruppe, die Küche sieht gut aus, der Rest ist etwas in die Jahre gekommen, aber funktionsfähig.",
    relativeTime: "vor 7 Jahren",
    ageDays: 7 * YEAR,
    sourceRef: "google:corey-westerneng-2019-05",
    originalLanguage: "nl",
    translated: true,
  },
  {
    source: "google",
    authorName: "Martina Völlmecke",
    rating: 5,
    text: null,
    relativeTime: "vor 3 Monaten",
    ageDays: 3 * MONTH,
    sourceRef: "google:martina-voellmecke-2026-02",
  },
  {
    source: "google",
    authorName: "KIKI",
    rating: 4,
    text: null,
    relativeTime: "vor 2 Jahren",
    ageDays: 2 * YEAR,
    sourceRef: "google:kiki-2024-05",
  },
  {
    source: "google",
    authorName: "Monika Duffe",
    rating: 5,
    text: null,
    relativeTime: "vor 3 Jahren",
    ageDays: 3 * YEAR,
    sourceRef: "google:monika-duffe-2023-05",
  },
  {
    source: "google",
    authorName: "Niklas Bruns",
    rating: 4,
    text: null,
    relativeTime: "vor 3 Jahren",
    ageDays: 3 * YEAR,
    sourceRef: "google:niklas-bruns-2023-05",
  },
  {
    source: "google",
    authorName: "Melanie Eckstein",
    rating: 5,
    text: null,
    relativeTime: "vor 3 Jahren",
    ageDays: 3 * YEAR,
    sourceRef: "google:melanie-eckstein-2023-05",
  },
  {
    source: "google",
    authorName: "Thomas Schmidt",
    rating: 5,
    text: null,
    relativeTime: "vor 6 Jahren",
    ageDays: 6 * YEAR,
    sourceRef: "google:thomas-schmidt-2020-05",
  },
  {
    source: "google",
    authorName: "Carla Wösthenrich",
    rating: 5,
    text: null,
    relativeTime: "vor 6 Jahren",
    ageDays: 6 * YEAR,
    sourceRef: "google:carla-woesthenrich-2020-05",
  },
  {
    source: "google",
    authorName: "Leon Die",
    rating: 1,
    text: null,
    relativeTime: "vor 6 Jahren",
    ageDays: 6 * YEAR,
    sourceRef: "google:leon-die-2020-05",
  },
  {
    source: "google",
    authorName: "Gucci Prada",
    rating: 5,
    text: null,
    relativeTime: "vor 7 Jahren",
    ageDays: 7 * YEAR,
    sourceRef: "google:gucci-prada-2019-05",
  },
  {
    source: "google",
    authorName: "Tobi Vettel",
    rating: 5,
    text: null,
    relativeTime: "vor 8 Jahren",
    ageDays: 8 * YEAR,
    sourceRef: "google:tobi-vettel-2018-05",
  },
];

const isoFromAgeDays = (ageDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - ageDays);
  return d.toISOString().slice(0, 10);
};

async function main() {
  let inserted = 0;
  let skipped = 0;

  for (const r of GOOGLE_REVIEWS) {
    const reviewedAt = isoFromAgeDays(r.ageDays);
    // ON CONFLICT DO NOTHING via unique-Index (source, source_ref)
    const res = await db
      .insert(externalReviews)
      .values({
        source: r.source,
        authorName: r.authorName,
        rating: r.rating,
        text: r.text,
        relativeTime: r.relativeTime,
        reviewedAt,
        sourceRef: r.sourceRef,
        sourceUrl: r.sourceUrl ?? null,
        originalLanguage: r.originalLanguage ?? "de",
        translated: r.translated ?? false,
        published: true,
        highlight: r.highlight ?? false,
      })
      .onConflictDoNothing({ target: [externalReviews.source, externalReviews.sourceRef] })
      .returning({ id: externalReviews.id });

    if (res.length > 0) inserted++;
    else skipped++;
  }

  const total = await db.execute(sql`SELECT count(*)::int AS n FROM external_reviews`);
  console.log(
    `Seed reviews: ${inserted} eingefügt, ${skipped} schon vorhanden — DB-Total: ${
      (total as unknown as { n: number }[])[0]?.n ?? "?"
    }`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
