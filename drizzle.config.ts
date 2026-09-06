import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url:
      process.env.DATABASE_URL?.trim() ||
      process.env.TURSO_DATABASE_URL?.trim() ||
      "file:mizan.db",
    token:
      process.env.DATABASE_AUTH_TOKEN?.trim() ||
      process.env.TURSO_AUTH_TOKEN?.trim(),
  },
} satisfies Config;
