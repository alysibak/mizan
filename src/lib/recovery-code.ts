import { createHash, randomInt, timingSafeEqual } from "crypto";

// Crockford-style alphabet: no 0/O or 1/I/L to misread when copied by hand.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const GROUPS = 4;
const GROUP_LENGTH = 5;

/** A fresh code like "K7M2Q-9XRTB-4HZ8W-PD3NA" (~98 bits of randomness). */
export function generateRecoveryCode(): string {
  const groups: string[] = [];
  for (let g = 0; g < GROUPS; g++) {
    let group = "";
    for (let i = 0; i < GROUP_LENGTH; i++) group += ALPHABET[randomInt(ALPHABET.length)];
    groups.push(group);
  }
  return groups.join("-");
}

/** Ignore case, spaces, and dashes, so a hand-copied code still matches. */
export function normalizeRecoveryCode(input: string): string {
  return input.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

/**
 * The stored form. A plain hash is enough: the code is random and long, so
 * there is nothing to guess from it the way there is with a password.
 */
export function hashRecoveryCode(code: string): string {
  return createHash("sha256").update(`mizan-recovery:${normalizeRecoveryCode(code)}`).digest("hex");
}

export function recoveryCodeMatches(code: string, storedHash: string | null): boolean {
  if (!storedHash) return false;
  const a = Buffer.from(hashRecoveryCode(code), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
