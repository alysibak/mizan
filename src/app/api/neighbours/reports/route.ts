import { NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { needReports, needs } from "@/db/schema";
import { errorJson, readJson } from "@/lib/api";
import { REPORTS_TO_PAUSE, cleanText, isReportReason, kindLabel } from "@/lib/neighbours";
import { logEvent, publicNeed, tellMembers } from "@/lib/neighbours-store";
import { LIMITS, overLimit, tooManyRequests } from "@/lib/rate-limit";

/**
 * "Something wrong with this?" Goes to the partner; enough reports take the
 * need off the list until someone there has looked.
 */
export async function POST(request: Request) {
  if (await overLimit(request, LIMITS.needReport)) return tooManyRequests(LIMITS.needReport);
  const body = (await readJson(request)) as { needId?: unknown; reason?: unknown; note?: unknown } | null;
  if (!body || typeof body.needId !== "string" || !isReportReason(body.reason)) {
    return errorJson("Choose what is wrong.", 400);
  }
  const found = await publicNeed(body.needId);
  if (!found) return errorJson("That need was not found.", 404);
  await db.insert(needReports).values({ needId: found.need.id, reason: body.reason, note: cleanText(body.note, 300) || null });
  await logEvent(found.need.id, "A visitor", "Reported a problem");

  const [open] = await db
    .select({ n: count() })
    .from(needReports)
    .where(and(eq(needReports.needId, found.need.id), eq(needReports.status, "open")));
  const pause = (open?.n ?? 0) >= REPORTS_TO_PAUSE && !found.need.paused;
  if (pause) {
    await db.update(needs).set({ paused: true }).where(eq(needs.id, found.need.id));
    await logEvent(found.need.id, "Mizan", `Taken off the list after ${REPORTS_TO_PAUSE} reports`);
  }
  await tellMembers(found.partner.id, "A need was reported on Mizan Neighbours", [
    `A visitor reported “${found.need.title}” (${kindLabel(found.need.kind).toLowerCase()}).`,
    pause ? "It has been taken off the list until you look at it." : "Please look at it on your desk.",
  ]);
  return NextResponse.json({ ok: true, paused: pause }, { status: 201 });
}
