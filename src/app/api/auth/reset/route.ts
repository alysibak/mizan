import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { consumeEmailToken } from "@/lib/email-tokens";
import { createSession, hashPassword } from "@/lib/auth";
import { firstIssue, resetPasswordSchema } from "@/lib/validation";
import { errorJson, readJson } from "@/lib/api";
import { LIMITS, overLimit, tooManyRequests } from "@/lib/rate-limit";

/**
 * Set a new password from an emailed link. The link is used up, every
 * session is signed out, and this browser is signed in.
 */
export async function POST(request: Request) {
  if (await overLimit(request, LIMITS.recover)) return tooManyRequests(LIMITS.recover);
  const parsed = resetPasswordSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson(firstIssue(parsed.error), 400);
  const { token, newPassword } = parsed.data;

  // Hash first: the token is only spent once the new password is ready.
  const passwordHash = await hashPassword(newPassword);
  const userId = await consumeEmailToken(token, "reset");
  if (!userId) {
    return errorJson("This link has expired or was already used. Ask for a new one.", 400);
  }

  await db.batch([
    db
      .update(users)
      .set({
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId)),
    db.delete(sessions).where(eq(sessions.userId, userId)),
  ]);
  await createSession(userId);
  return NextResponse.json({ ok: true });
}
