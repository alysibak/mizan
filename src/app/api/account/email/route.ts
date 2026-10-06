import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { emailEnabled, emailLink, sendEmail } from "@/lib/email";
import { VERIFY_LINK_HOURS, verifyEmailMessage } from "@/lib/email-content";
import { createToken } from "@/lib/one-time-tokens";
import { emailRemindersSchema, firstIssue } from "@/lib/validation";
import { errorJson, readJson, writableUser } from "@/lib/api";
import { LIMITS, overLimit, tooManyRequests } from "@/lib/rate-limit";

const EMAIL_OFF = "This server does not send email.";

/** Send a link that confirms the account's address. */
export async function POST(request: Request) {
  const { user, response } = await writableUser();
  if (response) return response;
  if (!emailEnabled()) return errorJson(EMAIL_OFF, 404);
  if (user.emailVerifiedAt) return NextResponse.json({ ok: true, verified: true });
  if (await overLimit(request, LIMITS.emailLink)) return tooManyRequests(LIMITS.emailLink);

  const token = await createToken(user.id, "verify", VERIFY_LINK_HOURS * 60);
  const sent = await sendEmail(
    verifyEmailMessage({
      to: user.email,
      name: user.name,
      link: emailLink(`/api/auth/verify-email?token=${token}`),
    }),
  );
  if (!sent) return errorJson("The email could not be sent. Try again later.", 502);
  return NextResponse.json({ ok: true, verified: false });
}

/** Turn hawl reminders on or off. On needs a confirmed address. */
export async function PUT(request: Request) {
  const { user, response } = await writableUser();
  if (response) return response;
  if (!emailEnabled()) return errorJson(EMAIL_OFF, 404);
  const parsed = emailRemindersSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson(firstIssue(parsed.error), 400);
  const { reminders } = parsed.data;
  if (reminders && !user.emailVerifiedAt) {
    return errorJson("Confirm your email first.", 400);
  }
  await db.update(settings).set({ emailReminders: reminders }).where(eq(settings.userId, user.id));
  return NextResponse.json({ ok: true, reminders });
}
