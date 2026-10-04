import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import {
  assets,
  givingRecords,
  liabilities,
  sessions,
  settings,
  users,
  yearSnapshots,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { deleteAccountSchema, firstIssue } from "@/lib/validation";
import { SESSION_COOKIE, verifyPassword } from "@/lib/auth";

/**
 * Permanently delete the account and everything in it. Child rows are
 * removed explicitly in one transaction rather than relying on the database
 * having foreign-key cascades switched on.
 */
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "That password is not right" }, { status: 403 });
  }

  await db.batch([
    db.delete(assets).where(eq(assets.userId, user.id)),
    db.delete(liabilities).where(eq(liabilities.userId, user.id)),
    db.delete(givingRecords).where(eq(givingRecords.userId, user.id)),
    db.delete(yearSnapshots).where(eq(yearSnapshots.userId, user.id)),
    db.delete(settings).where(eq(settings.userId, user.id)),
    db.delete(sessions).where(eq(sessions.userId, user.id)),
    db.delete(users).where(eq(users.id, user.id)),
  ]);

  (await cookies()).delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
