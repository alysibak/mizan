import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { needs, partnerMembers } from "@/db/schema";
import { errorJson, readJson } from "@/lib/api";
import { THANKS_MAX, canPublish, cleanText, expiryFrom, privacyProblem, readMoney, readNeed, sqlTime } from "@/lib/neighbours";
import { needGate } from "@/lib/neighbours-gate";
import { logEvent } from "@/lib/neighbours-store";
import { formatMoney } from "@/lib/money";

/**
 * What a partner member does to a need: change it, check and list it, take it
 * off the list or put it back, give it more time, add money given at the
 * office, close it with a thank-you, or remove it.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await needGate((await params).id);
  if (gate.response) return gate.response;
  const { user, partner, need } = gate;
  if (!need) return errorJson("Not found", 404);
  const body = ((await readJson(request)) ?? {}) as Record<string, unknown>;
  const now = new Date();
  const done = async (action: string, set: Partial<typeof needs.$inferInsert>) => {
    await db.update(needs).set(set).where(eq(needs.id, need.id));
    await logEvent(need.id, user.name, action);
    return NextResponse.json({ ok: true });
  };
  if (need.status === "removed") return errorJson("This need was removed.", 409);

  switch (body.action) {
    case "edit": {
      if (need.status === "closed") return errorJson("A closed need cannot be changed.", 409);
      const read = readNeed(body);
      if ("error" in read) return errorJson(read.error, 400);
      // A listed need that changes is checked again, so no one changes one alone.
      const recheck = partner.twoPerson && need.status === "open";
      return done(recheck ? "Changed it; it waits for a check" : "Changed it", {
        ...read.need,
        createdBy: user.id,
        ...(recheck ? { status: "draft", approvedBy: null } : {}),
      });
    }
    case "publish": {
      if (need.status !== "draft") return errorJson("It is already listed.", 409);
      const [members] = await db
        .select({ n: count() })
        .from(partnerMembers)
        .where(eq(partnerMembers.partnerId, partner.id));
      const may = canPublish({ twoPerson: partner.twoPerson, members: members?.n ?? 0, createdBy: need.createdBy, userId: user.id });
      if (!may.ok) return errorJson(may.why, 409);
      return done("Checked it and listed it", {
        status: "open",
        approvedBy: user.id,
        paused: false,
        publishedAt: sqlTime(now),
        expiresAt: expiryFrom(now, need.days),
      });
    }
    case "pause":
      return done("Took it off the list", { paused: true });
    case "resume":
      return done("Put it back on the list", { paused: false });
    case "extend": {
      if (need.status !== "open") return errorJson("Only a listed need can be given more time.", 409);
      return done(`Gave it ${need.days} more days`, { expiresAt: expiryFrom(now, need.days) });
    }
    case "received": {
      const amount = readMoney(body.amount);
      if (amount === null) return errorJson("Enter the amount that arrived.", 400);
      return done(`Noted ${formatMoney(amount, partner.currency)} given at the office`, {
        received: Math.round((need.received + amount) * 100) / 100,
      });
    }
    case "close": {
      const thanks = cleanText(body.thanks, THANKS_MAX).replace(/\n/g, " ");
      const problem = thanks ? privacyProblem(thanks) : null;
      if (problem) return errorJson(problem, 400);
      return done(need.received >= need.amount ? "Closed it: met" : "Closed it", {
        status: "closed",
        closedAt: sqlTime(now),
        thanks: thanks || null,
      });
    }
    case "remove":
      return done("Removed it", { status: "removed" });
    default:
      return errorJson("Unknown action", 400);
  }
}
