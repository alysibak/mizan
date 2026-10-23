import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { needReports, needs } from "@/db/schema";
import { errorJson, readJson } from "@/lib/api";
import { needGate } from "@/lib/neighbours-gate";
import { logEvent } from "@/lib/neighbours-store";

/** The partner answers a report: nothing wrong, or remove the need. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  if (!/^[0-9a-f-]{36}$/.test(id)) return errorJson("Not found", 404);
  const [report] = await db.select().from(needReports).where(eq(needReports.id, id)).limit(1);
  if (!report) return errorJson("Not found", 404);
  const gate = await needGate(report.needId);
  if (gate.response) return gate.response;
  const { user, need } = gate;
  if (!need) return errorJson("Not found", 404);
  const body = ((await readJson(request)) ?? {}) as Record<string, unknown>;

  if (body.action === "dismiss") {
    await db.update(needReports).set({ status: "dismissed" }).where(eq(needReports.id, report.id));
    await logEvent(need.id, user.name, "Looked at a report: nothing wrong");
    return NextResponse.json({ ok: true });
  }
  if (body.action === "uphold") {
    await db
      .update(needReports)
      .set({ status: "upheld" })
      .where(and(eq(needReports.needId, need.id), eq(needReports.status, "open")));
    await db.update(needs).set({ status: "removed" }).where(eq(needs.id, need.id));
    await logEvent(need.id, user.name, "Agreed with a report and removed it");
    return NextResponse.json({ ok: true });
  }
  return errorJson("Unknown action", 400);
}
