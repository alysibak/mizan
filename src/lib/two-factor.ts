import "server-only";
import { createHash, randomBytes } from "crypto";
import { eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { loginChallenges } from "@/db/schema";

/** How long after the password the authenticator code may be entered. */
export const CHALLENGE_MINUTES = 5;

function hashTicket(ticket: string): string {
  return createHash("sha256").update(`mizan-2fa:${ticket}`).digest("hex");
}

/** After a correct password: a ticket to present with the code. */
export async function createLoginChallenge(userId: string): Promise<string> {
  const ticket = randomBytes(32).toString("base64url");
  const now = new Date();
  await db.batch([
    db.delete(loginChallenges).where(lt(loginChallenges.expiresAt, now.toISOString())),
    db.insert(loginChallenges).values({
      tokenHash: hashTicket(ticket),
      userId,
      expiresAt: new Date(now.getTime() + CHALLENGE_MINUTES * 60_000).toISOString(),
    }),
  ]);
  return ticket;
}

/** The user a live ticket belongs to, or null. */
export async function challengeUser(ticket: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(ticket)) return null;
  const [row] = await db
    .select()
    .from(loginChallenges)
    .where(eq(loginChallenges.tokenHash, hashTicket(ticket)))
    .limit(1);
  if (!row || row.expiresAt < new Date().toISOString()) return null;
  return row.userId;
}

export async function endLoginChallenge(ticket: string): Promise<void> {
  await db.delete(loginChallenges).where(eq(loginChallenges.tokenHash, hashTicket(ticket)));
}
