/**
 * Apply pending Drizzle SQL migrations. Safe to run on every boot.
 * Usage: npm run db:migrate
 *
 * A database that already has tables but no migration history (for example
 * one created with `drizzle-kit push`) is adopted first: each migration whose
 * statements are all already reflected in the schema is recorded as applied,
 * so the migrator does not try to create the same tables or columns twice.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@libsql/client");
const { drizzle } = require("drizzle-orm/libsql");
const { migrate } = require("drizzle-orm/libsql/migrator");

const url =
  process.env.DATABASE_URL?.trim() ||
  process.env.TURSO_DATABASE_URL?.trim() ||
  "file:mizan.db";
const authToken =
  process.env.DATABASE_AUTH_TOKEN?.trim() ||
  process.env.TURSO_AUTH_TOKEN?.trim() ||
  undefined;
const folder = path.join(__dirname, "..", "drizzle");

/** Show where the database lives without printing credentials. */
function describeUrl(raw) {
  try {
    const u = new URL(raw);
    if (u.protocol === "file:") return raw;
    return `${u.protocol}//${u.host}`;
  } catch {
    return "(database)";
  }
}

async function main() {
  const client = createClient(authToken ? { url, authToken } : { url });

  async function exists(type, name) {
    const result = await client.execute({
      sql: "SELECT 1 AS ok FROM sqlite_master WHERE type = ? AND name = ?",
      args: [type, name],
    });
    return result.rows.length > 0;
  }

  async function columnExists(table, column) {
    const result = await client.execute(`PRAGMA table_info(\`${table}\`)`);
    return result.rows.some((row) => row.name === column);
  }

  async function migrationCount() {
    if (!(await exists("table", "__drizzle_migrations"))) return 0;
    const result = await client.execute(
      "SELECT COUNT(*) AS c FROM __drizzle_migrations",
    );
    return Number(result.rows[0].c);
  }

  /** True when this statement's effect is already present in the schema. */
  async function statementSatisfied(statement) {
    const sql = statement.replace(/\s+/g, " ").trim();
    let m = /^CREATE TABLE `([^`]+)`/i.exec(sql);
    if (m) return exists("table", m[1]);
    m = /^CREATE (?:UNIQUE )?INDEX `([^`]+)`/i.exec(sql);
    if (m) return exists("index", m[1]);
    m = /^ALTER TABLE `([^`]+)` ADD `([^`]+)`/i.exec(sql);
    if (m) return columnExists(m[1], m[2]);
    return false;
  }

  async function adoptUntrackedDatabase() {
    if (!(await exists("table", "users"))) return;
    if ((await migrationCount()) > 0) return;

    const journal = JSON.parse(
      fs.readFileSync(path.join(folder, "meta", "_journal.json"), "utf8"),
    );

    await client.execute(`
      CREATE TABLE IF NOT EXISTS \`__drizzle_migrations\` (
        \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        \`hash\` text NOT NULL,
        \`created_at\` numeric
      );
    `);

    const adopted = [];
    for (const entry of journal.entries) {
      const query = fs.readFileSync(path.join(folder, `${entry.tag}.sql`), "utf8");
      const statements = query
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter(Boolean);
      const missing = [];
      for (const statement of statements) {
        if (!(await statementSatisfied(statement))) missing.push(statement);
      }
      // Nothing from this migration is present: it and the rest are pending.
      if (missing.length === statements.length) break;
      // Partly present (a pushed schema can omit indexes that only exist in
      // hand-written SQL): run just the missing pieces, then record it.
      for (const statement of missing) {
        await client.execute(statement);
      }
      const hash = crypto.createHash("sha256").update(query).digest("hex");
      await client.execute({
        sql: "INSERT INTO `__drizzle_migrations` (`hash`, `created_at`) VALUES (?, ?)",
        args: [hash, entry.when],
      });
      adopted.push(entry.tag);
    }

    if (adopted.length > 0) {
      console.log(`Adopted existing schema through ${adopted[adopted.length - 1]}`);
    }
  }

  await adoptUntrackedDatabase();

  const db = drizzle(client);
  await migrate(db, { migrationsFolder: folder });
  client.close();

  console.log(`Migrations applied (${describeUrl(url)}) from ${folder}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
