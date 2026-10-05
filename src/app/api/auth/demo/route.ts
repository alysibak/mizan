import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, purgeExpiredSessions } from "@/lib/auth";
import { demoEmail } from "@/lib/demo";
import { errorJson } from "@/lib/api";
import { LIMITS, overLimit, tooManyRequests } from "@/lib/rate-limit";

/**
 * Sign into the shared read-only demo account, when this deployment has one
 * (DEMO_EMAIL, seeded with `npm run db:seed`). No password: the account
 * refuses every change, so there is nothing to protect but its contents.
 */
export async function POST(request: Request) {
  const email = demoEmail();
  if (!email) return errorJson("There is no demo on this server.", 404);
  if (await overLimit(request, LIMITS.login)) return tooManyRequests(LIMITS.login);

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) return errorJson("The demo is not set up on this server.", 404);

  await purgeExpiredSessions();
  // A short session: a visitor who looked around once should find the
  // landing page again tomorrow, not the demo.
  await createSession(user.id, 1);
  return NextResponse.json({ ok: true });
}
