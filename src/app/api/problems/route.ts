import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { problemReports } from "@/db/schema";
import { errorJson, readJson, signedInUser } from "@/lib/api";
import { isAdmin } from "@/lib/admin";
import { readProblem } from "@/lib/problems";
import { LIMITS, overLimit, tooManyRequests } from "@/lib/rate-limit";

/** "Report a problem" from any page: kept for whoever runs Mizan to read on the admin page. */
export async function POST(request: Request) {
  if (await overLimit(request, LIMITS.problem)) return tooManyRequests(LIMITS.problem);
  const read = readProblem(await readJson(request));
  if ("error" in read) return errorJson(read.error, 400);
  await db.insert(problemReports).values(read.problem);
  return NextResponse.json({ ok: true }, { status: 201 });
}

/** The operator marks a report done, or open again. */
export async function PATCH(request: Request) {
  const gate = await signedInUser();
  if (gate.response) return gate.response;
  if (!isAdmin(gate.user)) return errorJson("Not found", 404);
  const b = ((await readJson(request)) ?? {}) as Record<string, unknown>;
  if (typeof b.id !== "string" || (b.status !== "open" && b.status !== "done")) return errorJson("Not found", 404);
  await db.update(problemReports).set({ status: b.status }).where(eq(problemReports.id, b.id));
  return NextResponse.json({ ok: true });
}
