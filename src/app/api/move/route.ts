import { NextResponse } from "next/server";
import { lt } from "drizzle-orm";
import { db } from "@/db";
import { phoneMoves } from "@/db/schema";
import { errorJson, readJson } from "@/lib/api";
import { MAX_SEALED, MOVE_MINUTES, isMoveId, isSealed } from "@/lib/move";
import { LIMITS, overLimit, tooManyRequests } from "@/lib/rate-limit";

/**
 * Leave a sealed copy for a new phone. No account: the copy is sealed in the
 * browser with a key the server never sees, kept under a hash of the code,
 * and gone after half an hour or once collected.
 */
export async function POST(request: Request) {
  if (await overLimit(request, LIMITS.moveSend)) return tooManyRequests(LIMITS.moveSend);
  const body = (await readJson(request, MAX_SEALED + 1024)) as { id?: unknown; sealed?: unknown } | null;
  if (!body || !isMoveId(body.id) || !isSealed(body.sealed)) {
    return errorJson("That copy could not be read. Please try again.", 400);
  }
  const now = new Date();
  // Copies nobody collected are no use to anyone.
  await db.delete(phoneMoves).where(lt(phoneMoves.expiresAt, now.toISOString()));
  const expiresAt = new Date(now.getTime() + MOVE_MINUTES * 60_000).toISOString();
  const [row] = await db
    .insert(phoneMoves)
    .values({ id: body.id, sealed: body.sealed, expiresAt })
    .onConflictDoNothing()
    .returning({ id: phoneMoves.id });
  if (!row) return errorJson("Please make a new code.", 409);
  return NextResponse.json({ expiresAt }, { status: 201 });
}
