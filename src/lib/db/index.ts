import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __postgresClient: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __drizzleDb: PostgresJsDatabase<typeof schema> | undefined;
}

const buildClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    prepare: false,
  });
};

// Lazy proxy: the connection is only created on the first query, not at import time.
// This lets Next.js build/static-rendering succeed even when DATABASE_URL isn't yet present
// at build time (e.g. on first deploy with env vars set in dashboard).
const getDb = (): PostgresJsDatabase<typeof schema> => {
  if (global.__drizzleDb) return global.__drizzleDb;
  const client = global.__postgresClient ?? buildClient();
  if (process.env.NODE_ENV !== "production") global.__postgresClient = client;
  const dbInstance = drizzle(client, { schema });
  if (process.env.NODE_ENV !== "production") global.__drizzleDb = dbInstance;
  return dbInstance;
};

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop);
  },
});

export { schema };
