import { NextResponse } from "next/server";
import { db } from "@/db";
import { needs } from "@/db/schema";
import { errorJson, readJson } from "@/lib/api";
import { readNeed } from "@/lib/neighbours";
import { partnerGate } from "@/lib/neighbours-gate";
import { logEvent } from "@/lib/neighbours-store";

/** A partner member writes a need. It waits, unlisted, until it is checked and listed. */
export async function POST(request: Request) {
  const body = (await readJson(request)) as Record<string, unknown> | null;
  const gate = await partnerGate(body?.partnerId);
  if (gate.response) return gate.response;
  const read = readNeed(body);
  if ("error" in read) return errorJson(read.error, 400);
  const { need } = read;
  const [made] = await db
    .insert(needs)
    .values({
      partnerId: gate.partner.id,
      kind: need.kind,
      title: need.title,
      story: need.story,
      amount: need.amount,
      zakat: need.zakat,
      days: need.days,
      createdBy: gate.user.id,
    })
    .returning({ id: needs.id });
  await logEvent(made.id, gate.user.name, "Wrote it");
  return NextResponse.json({ id: made.id }, { status: 201 });
}
