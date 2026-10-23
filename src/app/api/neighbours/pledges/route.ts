import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { pledges } from "@/db/schema";
import { errorJson, readJson } from "@/lib/api";
import { pledgeCode, readPledge, showPledgeCode } from "@/lib/neighbours";
import { logEvent, publicNeed, tellMembers } from "@/lib/neighbours-store";
import { formatMoney } from "@/lib/money";
import { LIMITS, overLimit, tooManyRequests } from "@/lib/rate-limit";

/**
 * "I'll give this": a promise that holds a share of a need for a week. Never
 * more than is still needed, so five people do not pay the same rent. The
 * giver pays the partner directly, with the code as the reference.
 */
export async function POST(request: Request) {
  if (await overLimit(request, LIMITS.pledge)) return tooManyRequests(LIMITS.pledge);
  const read = readPledge(await readJson(request));
  if ("error" in read) return errorJson(read.error, 400);
  const { pledge } = read;

  const found = await publicNeed(pledge.needId);
  if (!found) return errorJson("That need was not found.", 404);
  if (found.state !== "open") {
    return errorJson(
      found.state === "covered" ? "This need is fully promised already. Thank you." : "This need is no longer open.",
      409,
    );
  }
  if (pledge.amount > found.progress.room) {
    return errorJson(
      `Only ${formatMoney(found.progress.room, found.partner.currency)} is still needed. Please give that or less.`,
      409,
    );
  }

  // A fresh code, tried again in the unlikely case it is taken.
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = pledgeCode();
    const [taken] = await db.select({ id: pledges.id }).from(pledges).where(and(eq(pledges.code, code))).limit(1);
    if (taken) continue;
    await db.insert(pledges).values({
      needId: pledge.needId,
      code,
      amount: pledge.amount,
      name: pledge.name || null,
      contact: pledge.contact || null,
    });
    await logEvent(pledge.needId, "A visitor", `Promised ${formatMoney(pledge.amount, found.partner.currency)}`);
    await tellMembers(found.partner.id, "A new pledge on Mizan Neighbours", [
      `Someone promised ${formatMoney(pledge.amount, found.partner.currency)} for “${found.need.title}”.`,
      `Their code is ${showPledgeCode(code)}. Mark it received when the money arrives.`,
    ]);
    return NextResponse.json({ code }, { status: 201 });
  }
  return errorJson("Please try again.", 503);
}
