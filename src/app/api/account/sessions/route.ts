import { NextResponse } from "next/server";
import { revokeOtherSessions } from "@/lib/auth";
import { writableUser } from "@/lib/api";

/** Sign out every device except this one. */
export async function DELETE() {
  // The demo is shared: one visitor must not sign out everyone else.
  const { user, response } = await writableUser();
  if (response) return response;
  await revokeOtherSessions(user.id);
  return NextResponse.json({ ok: true });
}
