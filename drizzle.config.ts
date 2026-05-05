import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  // Drizzle-kit reads .env.local manually below; this is a hint only.
  console.warn("DATABASE_URL not yet set — fill .env.local before running migrations.");
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
});
