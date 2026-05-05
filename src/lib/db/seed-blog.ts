/**
 * Seed a single demo blog post so the /blog page is not empty for the demo.
 * Idempotent — re-runs do nothing if the slug already exists.
 *
 *   npx tsx --env-file=.env.local src/lib/db/seed-blog.ts
 */

import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });

import { db } from "./index";
import { blogPosts, users } from "./schema";
import { eq } from "drizzle-orm";

const SLUG = "willkommen-im-wiesenhuetten-blog";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set.");
    process.exit(1);
  }

  const existing = await db.select().from(blogPosts).where(eq(blogPosts.slug, SLUG)).limit(1);
  if (existing[0]) {
    console.log(`✓ already seeded (${SLUG})`);
    return;
  }

  const adminEmail = "jonathan@stg-medien.com";
  const found = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
  const authorId = found[0]?.id ?? null;

  const html = `
    <h2>Was uns hier erwartet</h2>
    <p>
      Auf diesem Blog teilen wir Geschichten von der Wiesenhütte — vom Vereinsleben, von Klassenfahrten,
      vom Hochsauerland. Tipps für Eure Buchung, Bilder aus den Saisons, kleine Anekdoten von
      Renovierungswochenenden.
    </p>
    <h3>Worüber wir schreiben werden</h3>
    <ul>
      <li>Wandertouren, die direkt an der Hütte starten</li>
      <li>Klassenfahrten und ESG-Hüttenwochen</li>
      <li>Selbstversorgung in der Gruppe — Einkaufslisten, Mengenplanung</li>
      <li>Vereinsleben — Adventskaffeetrinken, Grünkohlwanderung, Skigymnastik</li>
      <li>Bilder, die eine Geschichte erzählen</li>
    </ul>
    <blockquote>
      Die Wiesenhütte ist kein Hotel. Sie ist ein Ort, an dem Gruppen zusammenkommen,
      kochen, an der Feuerstelle sitzen und Generationen von Skifreunden Spuren hinterlassen.
    </blockquote>
    <p>Bis bald — auf der Hütte oder hier im Blog.</p>
  `;

  await db.insert(blogPosts).values({
    slug: SLUG,
    title: "Willkommen im Wiesenhütten-Blog",
    excerpt:
      "Geschichten, Tipps und News rund um die Wiesenhütte in Langewiese — von Vereinsleben bis Hochsauerland.",
    contentHtml: html,
    coverImageUrl: "/media/photos/aerial-1.jpg",
    coverImageAlt: "Wiesenhütte aus der Vogelperspektive",
    authorId,
    status: "published",
    publishedAt: new Date(),
    metaTitle: "Willkommen im Wiesenhütten-Blog",
    metaDescription:
      "Geschichten und Tipps von der Wiesenhütte der Skifreunde Gütersloh in Langewiese, Hochsauerland.",
    readingMinutes: 2,
  });

  console.log(`✓ seeded blog post: ${SLUG}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));
