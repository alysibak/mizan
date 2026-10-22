import { describe, expect, it } from "vitest";
import { authorizeUrl, newGoogleStart, readIdToken } from "./google";

const CLIENT = "client-123.apps.googleusercontent.com";
const NOW = new Date("2026-10-22T12:00:00Z");

/** An ID token as Google's token endpoint returns it; the signature is not read. */
function token(claims: Record<string, unknown>): string {
  const part = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${part({ alg: "RS256" })}.${part(claims)}.signature`;
}

const good = {
  iss: "https://accounts.google.com",
  aud: CLIENT,
  exp: NOW.getTime() / 1000 + 600,
  nonce: "n1",
  sub: "1234567890",
  email: "Amina@Example.com",
  email_verified: true,
  name: "Amina Khan",
};

describe("readIdToken", () => {
  it("reads who signed in, with the email in lower case", () => {
    expect(readIdToken(token(good), { clientId: CLIENT, nonce: "n1" }, NOW)).toEqual({
      sub: "1234567890",
      email: "amina@example.com",
      name: "Amina Khan",
    });
  });

  it("refuses a token for another site, another sign-in, or past its time", () => {
    const expected = { clientId: CLIENT, nonce: "n1" };
    expect(readIdToken(token({ ...good, aud: "someone-else" }), expected, NOW)).toBeNull();
    expect(readIdToken(token({ ...good, iss: "https://evil.example" }), expected, NOW)).toBeNull();
    expect(readIdToken(token({ ...good, nonce: "other" }), expected, NOW)).toBeNull();
    expect(readIdToken(token({ ...good, exp: NOW.getTime() / 1000 - 1 }), expected, NOW)).toBeNull();
  });

  it("refuses an email Google has not confirmed", () => {
    const expected = { clientId: CLIENT, nonce: "n1" };
    expect(readIdToken(token({ ...good, email_verified: false }), expected, NOW)).toBeNull();
    expect(readIdToken(token({ ...good, email: undefined }), expected, NOW)).toBeNull();
  });

  it("refuses something that is not a token at all", () => {
    expect(readIdToken("not-a-token", { clientId: CLIENT, nonce: "n1" }, NOW)).toBeNull();
    expect(readIdToken("a.%%%.b", { clientId: CLIENT, nonce: "n1" }, NOW)).toBeNull();
  });

  it("falls back to the start of the email when Google gives no name", () => {
    const who = readIdToken(token({ ...good, name: "" }), { clientId: CLIENT, nonce: "n1" }, NOW);
    expect(who?.name).toBe("amina");
  });
});

describe("authorizeUrl", () => {
  it("asks Google for the account picker with PKCE, state and nonce", () => {
    const start = newGoogleStart("/my");
    const url = new URL(authorizeUrl(start, CLIENT));
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("client_id")).toBe(CLIENT);
    expect(url.searchParams.get("state")).toBe(start.state);
    expect(url.searchParams.get("nonce")).toBe(start.nonce);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).not.toBe(start.verifier);
    expect(url.searchParams.get("redirect_uri")).toMatch(/\/api\/auth\/google\/callback$/);
  });
});
