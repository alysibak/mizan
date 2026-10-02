import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { firstIssue, recoverSchema } from "@/lib/validation";
import { createSession, hashPassword } from "@/lib/auth";
import { recoveryCodeMatches } from "@/lib/recovery-code";
import { MAX_FAILED_LOGINS, LOCKOUT_MINUTES, isLocked, lockoutUntil } from "@/lib/login-throttle";
import { LIMITS, overLimit, tooManyRequests } from "@/lib/rate-limit";

const WRONG = "That email and recovery code do not match";

/**
 * Reset a forgotten password with the one-time recovery code. The code is
 * used up, every session is signed out, and this browser is signed in.
 */
export async function POST(request: Request) {
  if (await overLimit(request, LIMITS.recover)) return tooManyRequests(LIMITS.recover);
  const parsed = recoverSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  const { email, code, newPassword } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return NextResponse.json({ error: WRONG }, { status: 401 });
  if (isLocked(user.lockedUntil)) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${LOCKOUT_MINUTES} minutes.` },
      { status: 429 },
    );
  }

  if (!recoveryCodeMatches(code, user.recoveryCodeHash)) {
    // Shares the sign-in failure counter, so codes cannot be guessed either.
    const reachesLimit = sql`${users.failedLoginCount} + 1 >= ${MAX_FAILED_LOGINS}`;
    await db
      .update(users)
      .set({
        failedLoginCount: sql`CASE WHEN ${reachesLimit} THEN 0 ELSE ${users.failedLoginCount} + 1 END`,
        lockedUntil: sql`CASE WHEN ${reachesLimit} THEN ${lockoutUntil()} ELSE ${users.lockedUntil} END`,
      })
      .where(eq(users.id, user.id));
    return NextResponse.json({ error: WRONG }, { status: 401 });
  }

  const passwordHash = await hashPassword(newPassword);
  await db.batch([
    db
      .update(users)
      .set({
        passwordHash,
        recoveryCodeHash: null,
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id)),
    db.delete(sessions).where(eq(sessions.userId, user.id)),
  ]);
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
