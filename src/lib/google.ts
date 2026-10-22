/**
 * "Continue with Google": OpenID Connect with the authorization code flow and
 * PKCE, by hand, so no auth service or SDK is needed. Off unless
 * GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set. The ID token comes
 * straight from Google's token endpoint over TLS, which OpenID Connect
 * accepts in place of checking its signature (Core 1.0, 3.1.3.7); its
 * issuer, audience, expiry and nonce are still checked.
 */
import { createHash, randomBytes } from "crypto";
import { siteUrl } from "./site";

const AUTHORIZE = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN = "https://oauth2.googleapis.com/token";
const ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);

/** The cookie that carries state, nonce and verifier through the round trip. */
export const GOOGLE_COOKIE = "mizan_google";
export const GOOGLE_COOKIE_MINUTES = 10;

export function googleConfig(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function googleEnabled(): boolean {
  return googleConfig() !== null;
}

export function redirectUri(): string {
  return new URL("/api/auth/google/callback", siteUrl()).toString();
}

const base64url = (b: Buffer) => b.toString("base64url");

/** What is kept between leaving for Google and coming back. */
export interface GoogleStart {
  state: string;
  nonce: string;
  verifier: string;
  /** Where to land after signing in: a path on this site. */
  next: string;
}

export function newGoogleStart(next: string): GoogleStart {
  return {
    state: base64url(randomBytes(24)),
    nonce: base64url(randomBytes(24)),
    verifier: base64url(randomBytes(48)),
    next,
  };
}

export function authorizeUrl(start: GoogleStart, clientId: string): string {
  const challenge = base64url(createHash("sha256").update(start.verifier).digest());
  const url = new URL(AUTHORIZE);
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state: start.state,
    nonce: start.nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return url.toString();
}

export interface GoogleIdentity {
  sub: string;
  email: string;
  name: string;
}

/**
 * The person an ID token names, or null when it is not for this site, has
 * expired, does not answer this sign-in, or has no confirmed email.
 */
export function readIdToken(
  idToken: string,
  expected: { clientId: string; nonce: string },
  now: Date = new Date(),
): GoogleIdentity | null {
  const payload = idToken.split(".")[1];
  if (!payload) return null;
  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!ISSUERS.has(String(claims.iss))) return null;
  if (!audience.includes(expected.clientId)) return null;
  if (typeof claims.exp !== "number" || claims.exp * 1000 < now.getTime()) return null;
  if (claims.nonce !== expected.nonce) return null;
  if (claims.email_verified !== true && claims.email_verified !== "true") return null;
  if (typeof claims.sub !== "string" || !claims.sub || typeof claims.email !== "string") return null;
  const email = claims.email.trim().toLowerCase();
  const name = typeof claims.name === "string" && claims.name.trim() ? claims.name.trim() : email.split("@")[0];
  return { sub: claims.sub, email, name: name.slice(0, 80) };
}

/** Trade the code Google sent back for the ID token. */
export async function exchangeCode(code: string, start: GoogleStart): Promise<string | null> {
  const config = googleConfig();
  if (!config) return null;
  const res = await fetch(TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
      code_verifier: start.verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!res?.ok) return null;
  const data = (await res.json().catch(() => null)) as { id_token?: unknown } | null;
  return typeof data?.id_token === "string" ? data.id_token : null;
}
