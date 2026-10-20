/**
 * Moving to a new phone without an account. The old phone makes a short code,
 * seals everything Mizan keeps with a key made from it, and leaves the sealed
 * copy with the server under a hash of the code. The new phone types the code
 * (or scans it), fetches the copy once, and opens it. The server never sees
 * the code or the figures.
 */

/** No 0/O or 1/I, so a code read aloud or copied by hand comes out right. */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const CODE_LENGTH = 8;
/** How long a sealed copy waits for the new phone. */
export const MOVE_MINUTES = 30;
/** The most a sealed copy may weigh, in characters. */
export const MAX_SEALED = 600_000;

/** A fresh code. 32 symbols from bytes masked to 5 bits, so every symbol is equally likely. */
export function makeCode(random: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  return Array.from(random(CODE_LENGTH), (b) => ALPHABET[b & 31]).join("");
}

/** A code as typed: any case, spaces or dashes. Null if it cannot be one. */
export function readCode(input: string): string | null {
  const code = input.toUpperCase().replace(/[\s-]/g, "");
  return code.length === CODE_LENGTH && [...code].every((c) => ALPHABET.includes(c)) ? code : null;
}

/** "K7P4QX2M" as "K7P4-QX2M", easier to read out. */
export function showCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

const encoder = new TextEncoder();

async function hash(text: string): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(text)));
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const s = atob(text);
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

/** Where the sealed copy is kept: a hash of the code, so the code itself never leaves the phone. */
export async function moveId(code: string): Promise<string> {
  return Array.from(await hash(`mizan-move-id:${code}`), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function keyFor(code: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", await hash(`mizan-move-key:${code}`), "AES-GCM", false, ["encrypt", "decrypt"]);
}

/** The text sealed with the code, as "v1.<iv>.<ciphertext>". */
export async function seal(code: string, plain: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const body = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await keyFor(code), encoder.encode(plain));
  return `v1.${toBase64(iv)}.${toBase64(new Uint8Array(body))}`;
}

/** The text back, or null if the code is wrong or the copy was changed. */
export async function unseal(code: string, sealed: string): Promise<string | null> {
  const [v, iv, body] = sealed.split(".");
  if (v !== "v1" || !iv || !body) return null;
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(iv) },
      await keyFor(code),
      fromBase64(body),
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

/** A sealed copy as the server accepts it. */
export function isSealed(v: unknown): v is string {
  return typeof v === "string" && v.length <= MAX_SEALED && /^v1\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/.test(v);
}

export function isMoveId(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{64}$/.test(v);
}
