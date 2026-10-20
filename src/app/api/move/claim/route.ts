import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { phoneMoves } from "@/db/schema";
import { errorJson, readJson } from "@/lib/api";
import { isMoveId } from "@/lib/move";
import { LIMITS, overLimit, tooManyRequests } from "@/lib/rate-limit";

/**
 * Collect a sealed copy, once. A POST rather than a GET, so a link preview or
 * a prefetch can never use it up before the new phone does.
 */
export async function POST(request: Request) {
  if (await overLimit(request, LIMITS.moveFetch)) return tooManyRequests(LIMITS.moveFetch);
  const body = (await readJson(request)) as { id?: unknown } | null;
  if (!body || !isMoveId(body.id)) return errorJson("Check the code and try again.", 400);
  const [row] = await db
    .delete(phoneMoves)
    .where(and(eq(phoneMoves.id, body.id), gt(phoneMoves.expiresAt, new Date().toISOString())))
    .returning({ sealed: phoneMoves.sealed });
  if (!row) {
    return errorJson("That code has run out or was already used. Make a new one on your old phone.", 404);
  }
  return NextResponse.json({ sealed: row.sealed }, { headers: { "Cache-Control": "no-store" } });
}
