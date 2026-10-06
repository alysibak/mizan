import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { firstIssue, recoverSchema } from "@/lib/validation";
import { createSession, hashPassword } from "@/lib/auth";
import { recoveryCodeMatches } from "@/lib/recovery-code";
import { revokeSignInTokens } from "@/lib/one-time-tokens";
import { isLocked } from "@/lib/login-throttle";
import { errorJson, lockedResponse, readJson, recordFailedPassword } from "@/lib/api";
import { isDemoUser } from "@/lib/demo";
import { LIMITS, overLimit, tooManyRequests } from "@/lib/rate-limit";

const WRONG = "That email and recovery code do not match";

/**
 * Reset a forgotten password with the one-time recovery code. The code is
 * used up, every session is signed out, and this browser is signed in. The
 * code is the way back in after losing the authenticator too, so it also
 * turns two-step sign-in off, to be set up again on the new phone.
 */
export async function POST(request: Request) {
  if (await overLimit(request, LIMITS.recover)) return tooManyRequests(LIMITS.recover);
  const parsed = recoverSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson(firstIssue(parsed.error), 400);
  const { email, code, newPassword } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || isDemoUser(user)) return errorJson(WRONG, 401);
  if (isLocked(user.lockedUntil)) return lockedResponse();

  if (!recoveryCodeMatches(code, user.recoveryCodeHash)) {
    // Shares the sign-in failure counter, so codes cannot be guessed either.
    await recordFailedPassword(user.id);
    return errorJson(WRONG, 401);
  }

  const passwordHash = await hashPassword(newPassword);
  await db.batch([
    db
      .update(users)
      .set({
        passwordHash,
        recoveryCodeHash: null,
        totpSecret: null,
        totpPendingSecret: null,
        totpLastStep: null,
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id)),
    db.delete(sessions).where(eq(sessions.userId, user.id)),
    revokeSignInTokens(user.id),
  ]);
  await createSession(user.id);
  return NextResponse.json({ ok: true, twoFactorOff: Boolean(user.totpSecret) });
}
