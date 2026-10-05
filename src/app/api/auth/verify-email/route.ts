import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { consumeEmailToken } from "@/lib/email-tokens";

export const dynamic = "force-dynamic";

function to(location: string) {
  // A relative Location stays on whatever host the visitor is on.
  return new Response(null, { status: 303, headers: { Location: location } });
}

/** The link in a confirmation email: mark the address confirmed. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const userId = await consumeEmailToken(token, "verify");
  if (!userId) return to("/settings?email=expired#email");
  await db
    .update(users)
    .set({ emailVerifiedAt: new Date().toISOString() })
    .where(eq(users.id, userId));
  return to("/settings?email=confirmed#email");
}
