import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type AppDatabase = LibSQLDatabase<typeof schema>;

/**
 * Local:  DATABASE_URL=file:mizan.db  (default)
 * Turso:  DATABASE_URL=libsql://...    DATABASE_AUTH_TOKEN=...
 *
 * libSQL keeps the SQLite dialect while allowing a free hosted DB so the app
 * can run on serverless without your computer staying on.
 */
function createDb(): AppDatabase {
  // Prefer app names; fall back to Vercel Turso marketplace vars.
  // Treat empty strings as unset (e.g. vercel env pull placeholders).
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.TURSO_DATABASE_URL?.trim() ||
    "file:mizan.db";
  const authToken =
    process.env.DATABASE_AUTH_TOKEN?.trim() ||
    process.env.TURSO_AUTH_TOKEN?.trim() ||
    undefined;
  const client: Client = createClient(
    authToken ? { url, authToken } : { url },
  );
  return drizzle(client, { schema });
}

// Lazy init so Next.js build workers do not open the DB at import time.
let _db: AppDatabase | undefined;

export const db: AppDatabase = new Proxy({} as AppDatabase, {
  get(_target, prop, receiver) {
    if (!_db) {
      _db = createDb();
    }
    return Reflect.get(_db, prop, receiver);
  },
});

export { schema };
