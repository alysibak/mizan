import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { changePasswordSchema, firstIssue } from "@/lib/validation";
import { hashPassword, revokeOtherSessions } from "@/lib/auth";
import { confirmPassword, errorJson, readJson, writableUser } from "@/lib/api";

/** Change the password, then sign out every other device. */
export async function POST(request: Request) {
  const { user, response } = await writableUser();
  if (response) return response;

  const parsed = changePasswordSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson(firstIssue(parsed.error), 400);
  const refused = await confirmPassword(
    user,
    parsed.data.currentPassword,
    "Your current password is not right",
  );
  if (refused) return refused;

  await db
    .update(users)
    .set({
      passwordHash: await hashPassword(parsed.data.newPassword),
      failedLoginCount: 0,
      lockedUntil: null,
    })
    .where(eq(users.id, user.id));
  await revokeOtherSessions(user.id);

  return NextResponse.json({ ok: true });
}
