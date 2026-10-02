import "server-only";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { and, eq, lt, ne } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { SESSION_COOKIE } from "./constants";

export { SESSION_COOKIE };
const SESSION_TTL_DAYS = 30;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

// A real cost-12 hash of a throwaway string. Comparing against it when the
// email is unknown makes that path take as long as a wrong password, so
// response time does not reveal which emails have accounts.
const TIMING_EQUALIZER_HASH =
  "$2a$12$rcW9cIbClVclpt704FPZoOXqWurNEGynJjPPmE9RvlgQlISZggdO.";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Burn the same time as verifyPassword for an account that does not exist. */
export async function equalizeTiming(password: string): Promise<void> {
  await bcrypt.compare(password, TIMING_EQUALIZER_HASH);
}

/** We store only the hash of the token, so a leaked database cannot be used to impersonate sessions. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  await db.insert(sessions).values({ id: tokenHash, userId, expiresAt });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

/** The stored id (token hash) of the session making this request, if any. */
export async function currentSessionId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token ? hashToken(token) : null;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  }
  store.delete(SESSION_COOKIE);
}

/** Sign out every other device; keeps the session making this request. */
export async function revokeOtherSessions(userId: string): Promise<void> {
  const keep = await currentSessionId();
  await db
    .delete(sessions)
    .where(
      keep
        ? and(eq(sessions.userId, userId), ne(sessions.id, keep))
        : eq(sessions.userId, userId),
    );
}

/** Drop sessions past their expiry so the table does not grow forever. */
export async function purgeExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date().toISOString()));
}

export { hashToken };
