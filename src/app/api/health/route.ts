import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

/** The commit this server was built from, where the host says (Vercel does). */
const COMMIT = (process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT ?? "").slice(0, 7) || null;

/**
 * Liveness/readiness for reverse proxies and container orchestrators, and
 * which commit is live, so a deploy can be checked from outside.
 */
export async function GET() {
  try {
    await db.run(sql`SELECT 1`);
    return NextResponse.json({ ok: true, commit: COMMIT });
  } catch {
    return NextResponse.json({ ok: false, commit: COMMIT }, { status: 503 });
  }
}
