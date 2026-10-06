/**
 * Operator tool: give an account a new temporary password when its owner has
 * lost both their password and recovery code. Signs out every session and
 * turns two-step sign-in off (they may have lost that phone too); they can
 * set it up again in Settings.
 *
 *   DATABASE_URL=... node scripts/reset-password.cjs someone@example.com
 *
 * Prints the temporary password once; pass it to the owner privately and ask
 * them to change it in Settings.
 */
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { createClient } = require("@libsql/client");

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/reset-password.cjs <email>");
  process.exit(1);
}

const url =
  process.env.DATABASE_URL?.trim() ||
  process.env.TURSO_DATABASE_URL?.trim() ||
  "file:mizan.db";
const authToken =
  process.env.DATABASE_AUTH_TOKEN?.trim() ||
  process.env.TURSO_AUTH_TOKEN?.trim() ||
  undefined;

async function main() {
  const client = createClient(authToken ? { url, authToken } : { url });
  const found = await client.execute({
    sql: "SELECT id FROM users WHERE email = ?",
    args: [email],
  });
  if (found.rows.length === 0) {
    console.error(`No account for ${email}.`);
    process.exit(1);
  }
  const id = found.rows[0].id;
  const temporary = crypto.randomBytes(12).toString("base64url");
  const hash = await bcrypt.hash(temporary, 12);
  await client.batch(
    [
      {
        sql: "UPDATE users SET password_hash = ?, failed_login_count = 0, locked_until = NULL, totp_secret = NULL, totp_pending_secret = NULL, totp_last_step = NULL WHERE id = ?",
        args: [hash, id],
      },
      { sql: "DELETE FROM sessions WHERE user_id = ?", args: [id] },
    ],
    "write",
  );
  client.close();
  console.log(`Temporary password for ${email}: ${temporary}`);
  console.log("Two-step sign-in, if it was on, is now off.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
