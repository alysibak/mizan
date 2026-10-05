import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { deleteAccountSchema, firstIssue } from "@/lib/validation";
import { generateRecoveryCode, hashRecoveryCode } from "@/lib/recovery-code";
import { confirmPassword, errorJson, readJson, writableUser } from "@/lib/api";

/**
 * Make a new recovery code (replacing any old one). The code is returned once
 * and only its hash is kept, so it cannot be shown again.
 */
export async function POST(request: Request) {
  const { user, response } = await writableUser();
  if (response) return response;

  // Same shape as delete: just the current password.
  const parsed = deleteAccountSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson(firstIssue(parsed.error), 400);
  const refused = await confirmPassword(user, parsed.data.password);
  if (refused) return refused;

  const code = generateRecoveryCode();
  await db
    .update(users)
    .set({ recoveryCodeHash: hashRecoveryCode(code) })
    .where(eq(users.id, user.id));
  return NextResponse.json({ code });
}
