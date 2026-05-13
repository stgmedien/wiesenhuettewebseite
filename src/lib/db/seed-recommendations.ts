/**
 * Seed-Daten für regionale Empfehlungen rund um Langewiese / Winterberg.
 *
 * Idempotent: läuft nur, wenn Tabelle leer ist.
 *
 * Lauf: `npx tsx src/lib/db/seed-recommendations.ts`
 *
 * Die Daten sind Beispiele/Anker — Vorstand kann sie über /m/empfehlungen
 * bearbeiten und um echte Tipps ergänzen.
 */

import { config as loadEnv } from "dotenv";
import path from "path";

loadEnv({ path: path.join(process.cwd(), ".env.local") });
loadEnv({ path: path.join(process.cwd(), ".env") });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { regionalRecommendations } from "./schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL nicht gesetzt — .env.local laden");
    process.exit(1);
  }
  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client);

  const existing = await db.select({ id: regionalRecommendations.id }).from(regionalRecommendations).limit(1);
  if (existing[0]) {
    console.log("Empfehlungen bereits in DB — skip seed.");
    await client.end();
    return;
  }

  const seeds: Array<typeof regionalRecommendations.$inferInsert> = [
    // EINKAUF
    {
      category: "einkauf",
      name: "REWE Winterberg",
      description: "Vollsortiment-Supermarkt. Idealer Stopp auf der Anreise — bereitet alles vor was Ihr für die Tage in der Hütte braucht.",
      address: "Am Waltenberg 60, 59955 Winterberg",
      distanceFromHuetteKm: 8,
      openingHours: "Mo-Sa 7-22 Uhr",
      sortOrder: 1,
      active: true,
    },
    {
      category: "einkauf",
      name: "Bäckerei Schäfer",
      description: "Traditionelle Sauerländer Bäckerei mit gutem Brot und frischen Brötchen — perfekt fürs erste Frühstück.",
      address: "Hauptstraße 12, Winterberg",
      distanceFromHuetteKm: 7.5,
      openingHours: "Di-Sa 6-13 Uhr, So 7-11 Uhr",
      sortOrder: 2,
      active: true,
    },
    // RESTAURANT
    {
      category: "restaurant",
      name: "Berggasthof Astenstube",
      description: "Klassische Sauerländer Küche mit fantastischem Ausblick vom Kahlen Asten. Reservierung empfohlen, besonders im Winter.",
      address: "Astenstraße 27, Winterberg-Altastenberg",
      distanceFromHuetteKm: 11,
      openingHours: "Mi-So 11-21 Uhr",
      sortOrder: 1,
      active: true,
    },
    {
      category: "restaurant",
      name: "Hotel Wittgenstein",
      description: "Familien-geführtes Restaurant in Langewiese mit regionalen Spezialitäten — der nächste Gastro-Tipp direkt im Dorf.",
      address: "Auf den Wiesen 1, 59955 Winterberg-Langewiese",
      distanceFromHuetteKm: 1.2,
      sortOrder: 2,
      active: true,
    },
    // AKTIVITAET (saisonal)
    {
      category: "aktivitaet",
      name: "Skiliftkarussell Winterberg",
      description: "Über 30 Lifte, 80 km Pisten, Snowpark — das größte Skigebiet im Sauerland. Ski-Pass online oder vor Ort.",
      address: "In der Büre 9, 59955 Winterberg",
      websiteUrl: "https://www.skiliftkarussell.de/",
      distanceFromHuetteKm: 9,
      seasonalOnly: "winter",
      sortOrder: 1,
      active: true,
    },
    {
      category: "aktivitaet",
      name: "Bike-Park Winterberg",
      description: "Downhill-Strecken aller Schwierigkeitsgrade. Verleih und Schulungen vor Ort. Für eine Klasse oder Wochenende mit Mountainbike-Freaks.",
      address: "Astenstraße, Winterberg",
      websiteUrl: "https://www.bikepark-winterberg.de/",
      distanceFromHuetteKm: 10,
      seasonalOnly: "sommer",
      sortOrder: 2,
      active: true,
    },
    // SEHENSWÜRDIGKEIT
    {
      category: "sehenswuerdigkeit",
      name: "Kahler Asten",
      description: "Zweithöchster Berg in NRW (842 m), Aussichtsturm, Wetterstation, Sauerlandblick. Klassischer Sonntags-Spaziergang.",
      address: "Astenstraße 27, Winterberg",
      distanceFromHuetteKm: 11,
      sortOrder: 1,
      active: true,
    },
    {
      category: "sehenswuerdigkeit",
      name: "Sauerland-Stabhochsprung-Anlage Langewiese",
      description: "Historisch wertvolle Sport-Anlage, Heimatort des Wintersports. Lohnt sich für eine kurze Stippvisite zu Fuß.",
      address: "Langewiese",
      distanceFromHuetteKm: 0.8,
      sortOrder: 2,
      active: true,
    },
    // VERLEIH
    {
      category: "verleih",
      name: "Sport Brockhaus Skiverleih",
      description: "Skier, Snowboards, Schuhe für die ganze Familie. Reservierung online möglich, perfekt wenn Ihr nicht alles mitschleppen wollt.",
      address: "Hauptstraße 30, Winterberg",
      distanceFromHuetteKm: 8.5,
      seasonalOnly: "winter",
      sortOrder: 1,
      active: true,
    },
    // NOTDIENST
    {
      category: "notdienst",
      name: "Apotheke am Markt Winterberg",
      description: "Apotheke mit Notdienst-Rotation. Adresse für die Reise-Apotheke.",
      address: "Marktplatz 8, Winterberg",
      phone: "+49 2981 1234",
      distanceFromHuetteKm: 8,
      openingHours: "Mo-Fr 8-18 Uhr, Sa 8-13 Uhr",
      sortOrder: 1,
      active: true,
    },
    {
      category: "notdienst",
      name: "St.-Franziskus-Hospital Winterberg",
      description: "Nächstes Krankenhaus mit 24/7-Notaufnahme.",
      address: "Am Waltenberg 35, Winterberg",
      phone: "+49 2981 805-0",
      distanceFromHuetteKm: 9,
      sortOrder: 2,
      active: true,
    },
  ];

  await db.insert(regionalRecommendations).values(seeds);
  console.log(`✓ ${seeds.length} Empfehlungen eingespielt.`);
  await client.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
