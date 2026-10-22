import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings, users, type User } from "@/db/schema";
import { createSession, purgeExpiredSessions } from "@/lib/auth";
import { GOOGLE_COOKIE, exchangeCode, googleConfig, readIdToken, type GoogleIdentity, type GoogleStart } from "@/lib/google";
import { createToken } from "@/lib/one-time-tokens";
import { LIMITS, overLimit } from "@/lib/rate-limit";
import { safeNextPath } from "@/lib/redirect";
import { siteUrl } from "@/lib/site";
import { DEFAULT_SETTINGS } from "@/lib/session";
import { CHALLENGE_MINUTES } from "@/lib/totp";

function readStart(raw: string | undefined): GoogleStart | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Partial<GoogleStart>;
    return typeof s.state === "string" && typeof s.nonce === "string" && typeof s.verifier === "string"
      ? { state: s.state, nonce: s.nonce, verifier: s.verifier, next: typeof s.next === "string" ? s.next : "" }
      : null;
  } catch {
    return null;
  }
}

/**
 * The account for this Google sign-in: the one already linked to it, else
 * the one with the same email (Google has confirmed the address, so it is
 * linked now), else a new one with no password. Null if the email belongs
 * to an account linked to a different Google account.
 */
async function accountFor(who: GoogleIdentity): Promise<{ user: User; isNew: boolean } | null> {
  const [linked] = await db.select().from(users).where(eq(users.googleSub, who.sub)).limit(1);
  if (linked) return { user: linked, isNew: false };

  const now = new Date().toISOString();
  const [byEmail] = await db.select().from(users).where(eq(users.email, who.email)).limit(1);
  if (byEmail) {
    if (byEmail.googleSub) return null;
    await db
      .update(users)
      .set({ googleSub: who.sub, emailVerifiedAt: byEmail.emailVerifiedAt ?? now })
      .where(eq(users.id, byEmail.id));
    return { user: { ...byEmail, googleSub: who.sub }, isNew: false };
  }

  const userId = randomUUID();
  // User and settings land together or not at all. A race with another
  // first sign-in fails on the unique email and is sent back to try again.
  await db.batch([
    db.insert(users).values({
      id: userId,
      email: who.email,
      name: who.name,
      passwordHash: "",
      googleSub: who.sub,
      emailVerifiedAt: now,
      lastLoginAt: now,
    }),
    db.insert(settings).values({ userId, ...DEFAULT_SETTINGS, setupComplete: false }),
  ]);
  const [created] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return created ? { user: created, isNew: true } : null;
}

/** Google sends the person back here with a code, or with an error. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  // Google came back to the address in redirectUri(); stay on it.
  const site = siteUrl();
  const store = await cookies();
  const start = readStart(store.get(GOOGLE_COOKIE)?.value);
  store.delete({ name: GOOGLE_COOKIE, path: "/api/auth/google" });

  const back = (why: string) => NextResponse.redirect(new URL(`/login?google=${why}`, site));
  const config = googleConfig();
  if (!config) return NextResponse.redirect(new URL("/login", site));
  // Pressing "Cancel" on Google's page is not a failure: just back to sign-in.
  if (url.searchParams.get("error")) return NextResponse.redirect(new URL("/login", site));
  if (await overLimit(request, LIMITS.google)) return back("busy");

  const code = url.searchParams.get("code");
  if (!start || !code || url.searchParams.get("state") !== start.state) return back("failed");

  const idToken = await exchangeCode(code, start);
  const who = idToken ? readIdToken(idToken, { clientId: config.clientId, nonce: start.nonce }) : null;
  if (!who) return back("failed");

  const found = await accountFor(who).catch(() => null);
  if (!found) return back("taken");
  const { user, isNew } = found;
  const next = safeNextPath(start.next, isNew ? "/begin" : "/dashboard");

  // Google stands in for the password, not for the authenticator app.
  if (user.totpSecret) {
    const ticket = await createToken(user.id, "login", CHALLENGE_MINUTES, { replace: false });
    const to = new URL("/login", site);
    to.searchParams.set("ticket", ticket);
    if (start.next) to.searchParams.set("next", start.next);
    return NextResponse.redirect(to);
  }

  if (!isNew) {
    await db
      .update(users)
      .set({ lastLoginAt: new Date().toISOString(), failedLoginCount: 0, lockedUntil: null })
      .where(eq(users.id, user.id));
  }
  await purgeExpiredSessions();
  await createSession(user.id);
  return NextResponse.redirect(new URL(next, site));
}
