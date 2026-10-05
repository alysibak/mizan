import "server-only";
import { createHash, randomBytes } from "crypto";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { emailTokens } from "@/db/schema";

export type EmailTokenPurpose = "verify" | "reset";

function hashEmailToken(token: string): string {
  return createHash("sha256").update(`mizan-email:${token}`).digest("hex");
}

/**
 * A fresh one-time token for a link. Any earlier unused token for the same
 * purpose stops working, so only the newest email's link is live.
 */
export async function createEmailToken(
  userId: string,
  purpose: EmailTokenPurpose,
  ttlMinutes: number,
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  await db.batch([
    db
      .delete(emailTokens)
      .where(and(eq(emailTokens.userId, userId), eq(emailTokens.purpose, purpose))),
    // Housekeeping: nobody can use an expired token, so drop them all.
    db.delete(emailTokens).where(lt(emailTokens.expiresAt, now.toISOString())),
    db.insert(emailTokens).values({
      tokenHash: hashEmailToken(token),
      userId,
      purpose,
      expiresAt: new Date(now.getTime() + ttlMinutes * 60_000).toISOString(),
    }),
  ]);
  return token;
}

/** The user a live token belongs to, without using it up. */
export async function peekEmailToken(
  token: string,
  purpose: EmailTokenPurpose,
): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const [row] = await db
    .select()
    .from(emailTokens)
    .where(and(eq(emailTokens.tokenHash, hashEmailToken(token)), eq(emailTokens.purpose, purpose)))
    .limit(1);
  if (!row || row.expiresAt < new Date().toISOString()) return null;
  return row.userId;
}

/** Use a token up: the user it belonged to, or null if it was not live. */
export async function consumeEmailToken(
  token: string,
  purpose: EmailTokenPurpose,
): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const [row] = await db
    .delete(emailTokens)
    .where(and(eq(emailTokens.tokenHash, hashEmailToken(token)), eq(emailTokens.purpose, purpose)))
    .returning();
  if (!row || row.expiresAt < new Date().toISOString()) return null;
  return row.userId;
}
