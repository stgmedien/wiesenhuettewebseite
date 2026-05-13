/**
 * Server-side Loader für die Trust-Daten (kompakter Header-Badge + Modal).
 *
 * Wird im PublicLayout aufgerufen, das Ergebnis an den Header gereicht und von
 * dort an den TrustBadgeButton übergeben. Resilient: wenn die Tabelle (noch)
 * nicht existiert oder die DB unerreichbar ist, returned null → Badge wird
 * einfach ausgeblendet, kein Crash.
 */

import { db } from "@/lib/db";
import { externalReviews } from "@/lib/db/schema";
import { eq, desc, and, isNotNull } from "drizzle-orm";

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

export async function loadTrustData(): Promise<TrustData | null> {
  try {
    const rated = await db
      .select({ rating: externalReviews.rating, source: externalReviews.source })
      .from(externalReviews)
      .where(and(eq(externalReviews.published, true), isNotNull(externalReviews.rating)));

    if (rated.length === 0) return null;

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
    // Tabelle fehlt / DB nicht erreichbar — Badge ausblenden, kein Crash
    console.warn("[loadTrustData] DB-Query fehlgeschlagen:", err);
    return null;
  }
}
