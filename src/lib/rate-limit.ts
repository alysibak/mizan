import "server-only";
import { createHash } from "crypto";
import { lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { authAttempts } from "@/db/schema";

export interface LimitRule {
  /** Separate counters per action, e.g. "register". */
  scope: string;
  /** Requests allowed per window. */
  limit: number;
  windowSeconds: number;
}

export const LIMITS = {
  register: { scope: "register", limit: 5, windowSeconds: 60 * 60 },
  login: { scope: "login", limit: 30, windowSeconds: 15 * 60 },
  recover: { scope: "recover", limit: 10, windowSeconds: 60 * 60 },
  // Its own bucket: demo clicks must not use up anyone's sign-in attempts.
  demo: { scope: "demo", limit: 30, windowSeconds: 15 * 60 },
} satisfies Record<string, LimitRule>;

/**
 * The caller's IP. On Vercel and behind a reverse proxy the platform sets
 * x-forwarded-for; the first entry is the client. Without a proxy the header
 * can be forged, which only lets a client spread its own attempts thinner —
 * the per-account lockout still applies.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Count one attempt for this IP and report whether it is over the limit.
 * Fixed windows in the database: no shared cache to run, works on
 * serverless. IPs are stored only as salted hashes.
 */
export async function overLimit(request: Request, rule: LimitRule): Promise<boolean> {
  const ipHash = createHash("sha256")
    .update(`mizan-rate:${clientIp(request)}`)
    .digest("hex")
    .slice(0, 32);
  const key = `${rule.scope}:${ipHash}`;
  const now = new Date();
  const nowIso = now.toISOString();
  const windowFloor = new Date(now.getTime() - rule.windowSeconds * 1000).toISOString();

  const [row] = await db
    .insert(authAttempts)
    .values({ key, windowStart: nowIso, count: 1 })
    .onConflictDoUpdate({
      target: authAttempts.key,
      set: {
        count: sql`CASE WHEN ${authAttempts.windowStart} < ${windowFloor} THEN 1 ELSE ${authAttempts.count} + 1 END`,
        windowStart: sql`CASE WHEN ${authAttempts.windowStart} < ${windowFloor} THEN ${nowIso} ELSE ${authAttempts.windowStart} END`,
      },
    })
    .returning({ count: authAttempts.count });

  // Old counters are useless; drop them now and then so the table stays tiny.
  if (Math.random() < 0.05) {
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    await db.delete(authAttempts).where(lt(authAttempts.windowStart, dayAgo));
  }

  return (row?.count ?? 0) > rule.limit;
}

export function tooManyRequests(rule: LimitRule) {
  const minutes = Math.ceil(rule.windowSeconds / 60);
  return Response.json(
    { error: `Too many attempts from this network. Try again in ${minutes} minutes.` },
    { status: 429, headers: { "Retry-After": String(rule.windowSeconds) } },
  );
}
