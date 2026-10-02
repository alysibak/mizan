import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { loginSchema } from "@/lib/validation";
import {
  verifyPassword,
  createSession,
  equalizeTiming,
  purgeExpiredSessions,
} from "@/lib/auth";
import {
  MAX_FAILED_LOGINS,
  LOCKOUT_MINUTES,
  isLocked,
  lockoutUntil,
} from "@/lib/login-throttle";

const WRONG = "Email or password is incorrect";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
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
    return NextResponse.json({ error: WRONG }, { status: 401 });
  }

  if (isLocked(user.lockedUntil)) {
    return NextResponse.json(
      {
        error: `Too many attempts. Try again in ${LOCKOUT_MINUTES} minutes.`,
      },
      { status: 429 },
    );
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    // Count in SQL so parallel attempts cannot overwrite each other's tally.
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
