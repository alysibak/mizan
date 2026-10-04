import { createHash, randomBytes } from "crypto";

/** The secret part of a calendar-feed URL. Only its hash is stored. */
export function newFeedToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashFeedToken(token: string): string {
  return createHash("sha256").update(`mizan-feed:${token}`).digest("hex");
}
