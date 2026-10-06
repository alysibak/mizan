import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import {
  assets,
  emailTokens,
  givingRecords,
  liabilities,
  loginChallenges,
  sessions,
  settings,
  users,
  yearSnapshots,
} from "@/db/schema";
import { deleteAccountSchema, firstIssue } from "@/lib/validation";
import { SESSION_COOKIE } from "@/lib/auth";
import { confirmPassword, errorJson, readJson, writableUser } from "@/lib/api";

/**
 * Permanently delete the account and everything in it. Child rows are
 * removed explicitly in one transaction rather than relying on the database
 * having foreign-key cascades switched on.
 */
export async function DELETE(request: Request) {
  const { user, response } = await writableUser();
  if (response) return response;

  const parsed = deleteAccountSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson(firstIssue(parsed.error), 400);
  const refused = await confirmPassword(user, parsed.data.password);
  if (refused) return refused;

  await db.batch([
    db.delete(assets).where(eq(assets.userId, user.id)),
    db.delete(liabilities).where(eq(liabilities.userId, user.id)),
    db.delete(givingRecords).where(eq(givingRecords.userId, user.id)),
    db.delete(yearSnapshots).where(eq(yearSnapshots.userId, user.id)),
    db.delete(emailTokens).where(eq(emailTokens.userId, user.id)),
    db.delete(loginChallenges).where(eq(loginChallenges.userId, user.id)),
    db.delete(settings).where(eq(settings.userId, user.id)),
    db.delete(sessions).where(eq(sessions.userId, user.id)),
    db.delete(users).where(eq(users.id, user.id)),
  ]);

  (await cookies()).delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
