import { NextResponse, after } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { oneTimeTokens, users } from "@/db/schema";
import { emailEnabled, emailLink, sendEmail } from "@/lib/email";
import { RESET_LINK_MINUTES, resetEmailMessage } from "@/lib/email-content";
import { createToken } from "@/lib/one-time-tokens";
import { firstIssue, resetRequestSchema } from "@/lib/validation";
import { errorJson, readJson } from "@/lib/api";
import { isDemoUser } from "@/lib/demo";
import { LIMITS, overLimit, tooManyRequests } from "@/lib/rate-limit";

/** At most one reset email per account in this many minutes. */
const COOLDOWN_MINUTES = 2;

/**
 * Email a password-reset link. The answer is the same whether or not the
 * address has an account, so this cannot be used to find out who does.
 * Links go only to addresses the owner has confirmed.
 */
export async function POST(request: Request) {
  if (!emailEnabled()) return errorJson("This server does not send email.", 404);
  if (await overLimit(request, LIMITS.emailLink)) return tooManyRequests(LIMITS.emailLink);
  const parsed = resetRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson(firstIssue(parsed.error), 400);

  // The lookup and the send happen after the response, so how long the
  // answer takes says nothing about whether the address has an account.
  const email = parsed.data.email;
  after(async () => {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !user.emailVerifiedAt || isDemoUser(user)) return;
    // A link sent in the last couple of minutes still expires well after
    // this; a fresh token would only mean another email in the same inbox.
    const recentFloor = new Date(
      Date.now() + (RESET_LINK_MINUTES - COOLDOWN_MINUTES) * 60_000,
    ).toISOString();
    const [recent] = await db
      .select({ tokenHash: oneTimeTokens.tokenHash })
      .from(oneTimeTokens)
      .where(
        and(
          eq(oneTimeTokens.userId, user.id),
          eq(oneTimeTokens.purpose, "reset"),
          gt(oneTimeTokens.expiresAt, recentFloor),
        ),
      )
      .limit(1);
    if (recent) return;
    const token = await createToken(user.id, "reset", RESET_LINK_MINUTES);
    await sendEmail(resetEmailMessage({ to: user.email, link: emailLink(`/reset?token=${token}`) }));
  });
  return NextResponse.json({ ok: true });
}
