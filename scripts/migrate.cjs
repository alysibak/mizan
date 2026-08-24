/**
 * Apply pending Drizzle SQL migrations. Safe to run on every boot.
 * Usage: npm run db:migrate
 *
 * Local file DBs created earlier with drizzle-kit push are baselined so the
 * init migration is not re-run.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@libsql/client");
const { drizzle } = require("drizzle-orm/libsql");
const { migrate } = require("drizzle-orm/libsql/migrator");

const url =
  process.env.DATABASE_URL ??
  process.env.TURSO_DATABASE_URL ??
  "file:mizan.db";
const authToken =
  process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;
const folder = path.join(__dirname, "..", "drizzle");

async function main() {
  const client = createClient(authToken ? { url, authToken } : { url });

  async function tableExists(name) {
    const result = await client.execute({
      sql: "SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ?",
      args: [name],
    });
    return result.rows.length > 0;
  }

  async function migrationCount() {
    if (!(await tableExists("__drizzle_migrations"))) return 0;
    const result = await client.execute(
      "SELECT COUNT(*) AS c FROM __drizzle_migrations",
    );
    return Number(result.rows[0].c);
  }

  async function baselineExistingSchema() {
    if (!(await tableExists("users"))) return;
    if ((await migrationCount()) > 0) return;

    const journal = JSON.parse(
      fs.readFileSync(path.join(folder, "meta", "_journal.json"), "utf8"),
    );
    const entry = journal.entries[0];
    if (!entry) return;

    const sqlPath = path.join(folder, `${entry.tag}.sql`);
    const query = fs.readFileSync(sqlPath, "utf8");
    const hash = crypto.createHash("sha256").update(query).digest("hex");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS \`__drizzle_migrations\` (
        \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        \`hash\` text NOT NULL,
        \`created_at\` numeric
      );
    `);
    await client.execute({
      sql: "INSERT INTO `__drizzle_migrations` (`hash`, `created_at`) VALUES (?, ?)",
      args: [hash, entry.when],
    });

    console.log(`Baselined existing schema as ${entry.tag}`);
  }

  await baselineExistingSchema();

  const db = drizzle(client);
  await migrate(db, { migrationsFolder: folder });
  client.close();

  console.log(`Migrations applied (${url}) from ${folder}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
