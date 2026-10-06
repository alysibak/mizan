import "server-only";
import { NextResponse } from "next/server";
import { and, count, eq, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { assets, givingRecords, liabilities, users, yearSnapshots, type User } from "@/db/schema";
import { getCurrentUser } from "./session";
import { verifyPassword } from "./auth";
import { isDemoUser, DEMO_READ_ONLY } from "./demo";
import { LOCKOUT_MINUTES, MAX_FAILED_LOGINS, isLocked, lockoutUntil } from "./login-throttle";

export { MAX_BACKUP_BYTES, MAX_JSON_BYTES, readJson } from "./read-json";

export function errorJson(error: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ error }, { status, headers });
}

export const unauthorized = () => errorJson("Unauthorized", 401);

type Gate = { user: User; response?: undefined } | { user?: undefined; response: NextResponse };

/** The signed-in user, or a 401 to return. */
export async function signedInUser(): Promise<Gate> {
  const user = await getCurrentUser();
  return user ? { user } : { response: unauthorized() };
}

/**
 * The signed-in user allowed to change data, or the response to return:
 * 401 when signed out, 403 for the shared read-only demo account.
 */
export async function writableUser(): Promise<Gate> {
  const gate = await signedInUser();
  if (gate.user && isDemoUser(gate.user)) {
    return { response: errorJson(DEMO_READ_ONLY, 403) };
  }
  return gate;
}

/** Count one more failed password for this account, locking it at the limit. */
export async function recordFailedPassword(userId: string): Promise<void> {
  // Counted in SQL so parallel attempts cannot overwrite each other's tally.
  const reachesLimit = sql`${users.failedLoginCount} + 1 >= ${MAX_FAILED_LOGINS}`;
  await db
    .update(users)
    .set({
      failedLoginCount: sql`CASE WHEN ${reachesLimit} THEN 0 ELSE ${users.failedLoginCount} + 1 END`,
      lockedUntil: sql`CASE WHEN ${reachesLimit} THEN ${lockoutUntil()} ELSE ${users.lockedUntil} END`,
    })
    .where(eq(users.id, userId));
}

/**
 * Record that an authenticator code from `step` was used, only if no code
 * from that step or a later one was used before. Done as one conditional
 * update, so two requests racing with the same code cannot both succeed.
 */
export async function claimTotpStep(
  userId: string,
  step: number,
  alsoSet: Partial<typeof users.$inferInsert> = {},
): Promise<boolean> {
  const rows = await db
    .update(users)
    .set({ ...alsoSet, totpLastStep: step })
    .where(
      and(eq(users.id, userId), or(isNull(users.totpLastStep), lt(users.totpLastStep, step))),
    )
    .returning({ id: users.id });
  return rows.length > 0;
}

export function lockedResponse() {
  return errorJson(`Too many attempts. Try again in ${LOCKOUT_MINUTES} minutes.`, 429, {
    "Retry-After": String(LOCKOUT_MINUTES * 60),
  });
}

/**
 * Re-check the password before a sensitive change (new password, recovery
 * code, deleting the account). Wrong answers share the sign-in failure
 * counter, so a stolen session cannot be used to guess the password.
 * Returns the error response to send, or null when the password is right.
 */
export async function confirmPassword(
  user: User,
  password: string,
  wrong = "That password is not right",
): Promise<NextResponse | null> {
  if (isLocked(user.lockedUntil)) return lockedResponse();
  if (await verifyPassword(password, user.passwordHash)) return null;
  await recordFailedPassword(user.id);
  return errorJson(wrong, 403);
}

/**
 * How many rows one account may keep. Generous for any household, small
 * enough that one account cannot fill a shared database.
 */
export const ROW_LIMITS = {
  assets: 2000,
  liabilities: 2000,
  giving: 20_000,
  snapshots: 500,
} as const;

const TABLES = {
  assets,
  liabilities,
  giving: givingRecords,
  snapshots: yearSnapshots,
} as const;

/**
 * A 409 when adding `adding` rows would take the account past its limit for
 * that kind of record, otherwise null.
 */
export async function overRowLimit(
  kind: keyof typeof ROW_LIMITS,
  userId: string,
  adding = 1,
): Promise<NextResponse | null> {
  const table = TABLES[kind];
  const [row] = await db.select({ n: count() }).from(table).where(eq(table.userId, userId));
  const limit = ROW_LIMITS[kind];
  if ((row?.n ?? 0) + adding <= limit) return null;
  return errorJson(
    `This account has reached its limit of ${limit.toLocaleString("en")} ${kind === "giving" ? "giving records" : kind}. Remove some old entries first.`,
    409,
  );
}
