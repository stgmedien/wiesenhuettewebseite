import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });

import postgres from "postgres";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set.");
    process.exit(1);
  }
  const sql = postgres(process.env.DATABASE_URL, { prepare: false });
  await sql`INSERT INTO site_settings (id, cleaning_days_after_departure) VALUES (1, 1) ON CONFLICT (id) DO NOTHING`;
  const rows = await sql`SELECT * FROM site_settings`;
  console.log("site_settings rows:", rows);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
