import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { revokeOtherSessions } from "@/lib/auth";

/** Sign out every device except this one. */
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await revokeOtherSessions(user.id);
  return NextResponse.json({ ok: true });
}
