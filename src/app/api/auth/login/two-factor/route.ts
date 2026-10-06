import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, purgeExpiredSessions } from "@/lib/auth";
import { isLocked } from "@/lib/login-throttle";
import { errorJson, lockedResponse, readJson, recordFailedPassword } from "@/lib/api";
import { LIMITS, overLimit, tooManyRequests } from "@/lib/rate-limit";
import { verifyTotp } from "@/lib/totp";
import { challengeUser, endLoginChallenge } from "@/lib/two-factor";
import { firstIssue, twoFactorLoginSchema } from "@/lib/validation";

/** The second step of signing in: the code from the authenticator app. */
export async function POST(request: Request) {
  if (await overLimit(request, LIMITS.login)) return tooManyRequests(LIMITS.login);
  const parsed = twoFactorLoginSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson(firstIssue(parsed.error), 400);
  const { ticket, code } = parsed.data;

  // `restart`: the browser goes back to the password step.
  const expired = () =>
    NextResponse.json({ error: "That took too long. Sign in again.", restart: true }, { status: 401 });
  const userId = await challengeUser(ticket);
  if (!userId) return expired();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.totpSecret) return expired();
  if (isLocked(user.lockedUntil)) return lockedResponse();

  const step = verifyTotp(user.totpSecret, code, { lastUsedStep: user.totpLastStep });
  if (step === null) {
    // Shares the password's failure count and lockout.
    await recordFailedPassword(user.id);
    return errorJson("That code is not right. Check the time on your phone and try again.", 401);
  }

  await endLoginChallenge(ticket);
  await db
    .update(users)
    .set({
      totpLastStep: step,
      lastLoginAt: new Date().toISOString(),
      failedLoginCount: 0,
      lockedUntil: null,
    })
    .where(eq(users.id, user.id));
  await purgeExpiredSessions();
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
