import { NextResponse } from "next/server";
import { and, eq, gte, isNull } from "drizzle-orm";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { errorJson, readJson } from "@/lib/api";
import { NOTE_MAX, NOTE_MINUTES, readFeedback } from "@/lib/feedback";
import { LIMITS, overLimit, tooManyRequests } from "@/lib/rate-limit";

/**
 * "Was this easy?": the tap is kept at once, and a line can follow it. No
 * account, address or amount is kept with either.
 */
export async function POST(request: Request) {
  if (await overLimit(request, LIMITS.feedback)) return tooManyRequests(LIMITS.feedback);
  const input = readFeedback(await readJson(request, NOTE_MAX * 4 + 512));
  if (!input) return errorJson("That could not be read.", 400);

  if (input.kind === "answer") {
    const [row] = await db
      .insert(feedback)
      .values({ page: input.page, easy: input.easy, locale: input.locale })
      .returning({ id: feedback.id });
    return NextResponse.json({ id: row.id }, { status: 201 });
  }

  // A line joins its own tap, once, soon after: the id is only ever known to
  // the page that made it.
  const since = new Date(Date.now() - NOTE_MINUTES * 60_000).toISOString().replace("T", " ").slice(0, 19);
  const [row] = await db
    .update(feedback)
    .set({ note: input.note })
    .where(and(eq(feedback.id, input.id), isNull(feedback.note), gte(feedback.createdAt, since)))
    .returning({ id: feedback.id });
  if (!row) return errorJson("That could not be added.", 404);
  return NextResponse.json({ ok: true });
}
