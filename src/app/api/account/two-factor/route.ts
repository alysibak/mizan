import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { renderSVG } from "uqr";
import { db } from "@/db";
import { loginChallenges, users } from "@/db/schema";
import { confirmPassword, errorJson, readJson, recordFailedPassword, writableUser } from "@/lib/api";
import { SITE_NAME } from "@/lib/site";
import { groupSecret, newTotpSecret, otpauthUri, verifyTotp } from "@/lib/totp";
import {
  firstIssue,
  twoFactorConfirmSchema,
  twoFactorDisableSchema,
} from "@/lib/validation";

const WRONG_CODE = "That code is not right. Check the time on your phone and try again.";

/** Start setting up: a new secret, as a QR code and as text. */
export async function POST() {
  const { user, response } = await writableUser();
  if (response) return response;
  if (user.totpSecret) return errorJson("Two-step sign-in is already on.", 409);

  const secret = newTotpSecret();
  await db.update(users).set({ totpPendingSecret: secret }).where(eq(users.id, user.id));
  const uri = otpauthUri({ secret, account: user.email, issuer: SITE_NAME });
  return NextResponse.json({
    secret: groupSecret(secret),
    uri,
    qr: renderSVG(uri, { border: 2, whiteColor: "#ffffff", blackColor: "#000000" }),
  });
}

/** Finish setting up with a first code from the app. */
export async function PUT(request: Request) {
  const { user, response } = await writableUser();
  if (response) return response;
  const parsed = twoFactorConfirmSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson(firstIssue(parsed.error), 400);
  if (!user.totpPendingSecret) return errorJson("Start again: the setup has expired.", 400);

  const step = verifyTotp(user.totpPendingSecret, parsed.data.code);
  if (step === null) return errorJson(WRONG_CODE, 400);
  await db
    .update(users)
    .set({ totpSecret: user.totpPendingSecret, totpPendingSecret: null, totpLastStep: step })
    .where(eq(users.id, user.id));
  return NextResponse.json({ ok: true });
}

/** Turn it off: needs the password and a current code. */
export async function DELETE(request: Request) {
  const { user, response } = await writableUser();
  if (response) return response;
  const parsed = twoFactorDisableSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson(firstIssue(parsed.error), 400);
  if (!user.totpSecret) return NextResponse.json({ ok: true });

  const refused = await confirmPassword(user, parsed.data.password);
  if (refused) return refused;
  const step = verifyTotp(user.totpSecret, parsed.data.code, { lastUsedStep: user.totpLastStep });
  if (step === null) {
    await recordFailedPassword(user.id);
    return errorJson(WRONG_CODE, 403);
  }
  await db.batch([
    db
      .update(users)
      .set({ totpSecret: null, totpPendingSecret: null, totpLastStep: null })
      .where(eq(users.id, user.id)),
    db.delete(loginChallenges).where(eq(loginChallenges.userId, user.id)),
  ]);
  return NextResponse.json({ ok: true });
}
