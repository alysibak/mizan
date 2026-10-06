import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import {
  assets,
  givingRecords,
  liabilities,
  oneTimeTokens,
  sessions,
  settings,
  users,
  yearSnapshots,
} from "@/db/schema";
import { deleteAccountSchema, firstIssue } from "@/lib/validation";
import { SESSION_COOKIE } from "@/lib/auth";
import { SIGNED_IN_HINT } from "@/lib/constants";
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
    db.delete(oneTimeTokens).where(eq(oneTimeTokens.userId, user.id)),
    db.delete(settings).where(eq(settings.userId, user.id)),
    db.delete(sessions).where(eq(sessions.userId, user.id)),
    db.delete(users).where(eq(users.id, user.id)),
  ]);

  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(SIGNED_IN_HINT);
  return NextResponse.json({ ok: true });
}
