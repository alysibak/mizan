import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { loginSchema } from "@/lib/validation";
import {
  verifyPassword,
  createSession,
  equalizeTiming,
  purgeExpiredSessions,
} from "@/lib/auth";
import { isLocked } from "@/lib/login-throttle";
import { errorJson, lockedResponse, readJson, recordFailedPassword } from "@/lib/api";
import { LIMITS, overLimit, tooManyRequests } from "@/lib/rate-limit";
import { createToken } from "@/lib/one-time-tokens";
import { CHALLENGE_MINUTES } from "@/lib/totp";

const WRONG = "Email or password is incorrect";

export async function POST(request: Request) {
  if (await overLimit(request, LIMITS.login)) return tooManyRequests(LIMITS.login);
  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson("Invalid input", 400);
  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Same response, and the same bcrypt cost, whether the email is unknown or
  // the password is wrong.
  if (!user) {
    await equalizeTiming(password);
    return errorJson(WRONG, 401);
  }

  if (isLocked(user.lockedUntil)) return lockedResponse();

  if (!(await verifyPassword(password, user.passwordHash))) {
    await recordFailedPassword(user.id);
    return errorJson(WRONG, 401);
  }

  // With two-step sign-in, the password alone does not sign in, and does not
  // clear the failure count either: otherwise each right password would buy
  // a fresh round of guesses at the code.
  if (user.totpSecret) {
    // Several devices may be signing in at once, so earlier tickets stay live.
    const ticket = await createToken(user.id, "login", CHALLENGE_MINUTES, { replace: false });
    return NextResponse.json({ twoFactor: true, ticket });
  }

  await db
    .update(users)
    .set({
      lastLoginAt: new Date().toISOString(),
      failedLoginCount: 0,
      lockedUntil: null,
    })
    .where(eq(users.id, user.id));

  await purgeExpiredSessions();
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
