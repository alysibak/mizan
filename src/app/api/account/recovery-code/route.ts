import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { deleteAccountSchema, firstIssue } from "@/lib/validation";
import { verifyPassword } from "@/lib/auth";
import { generateRecoveryCode, hashRecoveryCode } from "@/lib/recovery-code";

/**
 * Make a new recovery code (replacing any old one). The code is returned once
 * and only its hash is kept, so it cannot be shown again.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Same shape as delete: just the current password.
  const parsed = deleteAccountSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "That password is not right" }, { status: 403 });
  }

  const code = generateRecoveryCode();
  await db
    .update(users)
    .set({ recoveryCodeHash: hashRecoveryCode(code) })
    .where(eq(users.id, user.id));
  return NextResponse.json({ code });
}
