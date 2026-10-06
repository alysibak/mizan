import "server-only";
import { createHash, randomBytes } from "crypto";
import { and, eq, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import { oneTimeTokens } from "@/db/schema";

/**
 * verify: the link that confirms an email address.
 * reset:  the link that sets a new password.
 * login:  the ticket between a right password and a right authenticator code.
 */
export type TokenPurpose = "verify" | "reset" | "login";

/** The shape of every secret Mizan puts in a URL or hands to a browser. */
export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,64}$/;

function hashToken(token: string): string {
  return createHash("sha256").update(`mizan-token:${token}`).digest("hex");
}

/**
 * A fresh one-time token. Only its hash is stored. With `replace`, any
 * earlier unused token for the same purpose stops working, so only the
 * newest email's link is live.
 */
export async function createToken(
  userId: string,
  purpose: TokenPurpose,
  ttlMinutes: number,
  { replace = true }: { replace?: boolean } = {},
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  await db.batch([
    // Housekeeping: nobody can use an expired token, so drop them all.
    db.delete(oneTimeTokens).where(lt(oneTimeTokens.expiresAt, now.toISOString())),
    ...(replace
      ? [
          db
            .delete(oneTimeTokens)
            .where(and(eq(oneTimeTokens.userId, userId), eq(oneTimeTokens.purpose, purpose))),
        ]
      : []),
    db.insert(oneTimeTokens).values({
      tokenHash: hashToken(token),
      userId,
      purpose,
      expiresAt: new Date(now.getTime() + ttlMinutes * 60_000).toISOString(),
    }),
  ]);
  return token;
}

/** The user a live token belongs to, without using it up. */
export async function peekToken(token: string, purpose: TokenPurpose): Promise<string | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const [row] = await db
    .select()
    .from(oneTimeTokens)
    .where(and(eq(oneTimeTokens.tokenHash, hashToken(token)), eq(oneTimeTokens.purpose, purpose)))
    .limit(1);
  if (!row || row.expiresAt < new Date().toISOString()) return null;
  return row.userId;
}

/** Use a token up: the user it belonged to, or null if it was not live. */
export async function consumeToken(token: string, purpose: TokenPurpose): Promise<string | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const [row] = await db
    .delete(oneTimeTokens)
    .where(and(eq(oneTimeTokens.tokenHash, hashToken(token)), eq(oneTimeTokens.purpose, purpose)))
    .returning();
  if (!row || row.expiresAt < new Date().toISOString()) return null;
  return row.userId;
}

/**
 * When the password changes or two-step sign-in is turned off: pending
 * reset links and half-finished sign-ins made under the old state stop
 * working.
 */
export function revokeSignInTokens(userId: string) {
  return db
    .delete(oneTimeTokens)
    .where(
      and(eq(oneTimeTokens.userId, userId), inArray(oneTimeTokens.purpose, ["reset", "login"])),
    );
}
