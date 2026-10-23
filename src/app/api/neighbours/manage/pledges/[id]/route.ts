import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { needs, pledges } from "@/db/schema";
import { errorJson, readJson } from "@/lib/api";
import { readMoney, showPledgeCode, sqlTime } from "@/lib/neighbours";
import { needGate } from "@/lib/neighbours-gate";
import { logEvent, tellGiver } from "@/lib/neighbours-store";
import { formatMoney } from "@/lib/money";

/**
 * The partner marks a promise received when the money arrives (the giver
 * then hears it arrived), cancels one that never will, or undoes a mistake.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  if (!/^[0-9a-f-]{36}$/.test(id)) return errorJson("Not found", 404);
  const [pledge] = await db.select().from(pledges).where(eq(pledges.id, id)).limit(1);
  if (!pledge) return errorJson("Not found", 404);
  const gate = await needGate(pledge.needId);
  if (gate.response) return gate.response;
  const { user, partner, need } = gate;
  if (!need) return errorJson("Not found", 404);
  const body = ((await readJson(request)) ?? {}) as Record<string, unknown>;
  const money = (n: number) => formatMoney(n, partner.currency);
  const code = showPledgeCode(pledge.code);

  switch (body.action) {
    case "received": {
      if (pledge.status === "received") return errorJson("It is already marked received.", 409);
      const amount = body.amount === undefined ? pledge.amount : readMoney(body.amount);
      if (amount === null) return errorJson("Enter the amount that arrived.", 400);
      await db
        .update(pledges)
        .set({ status: "received", received: amount, receivedAt: sqlTime(new Date()) })
        .where(eq(pledges.id, pledge.id));
      await db.update(needs).set({ received: sql`round(${needs.received} + ${amount}, 2)` }).where(eq(needs.id, need.id));
      await logEvent(need.id, user.name, `Received ${money(amount)} (${code})`);
      await tellGiver(pledge.contact, [
        `Your ${money(amount)} for “${need.title}” reached ${partner.name}, and it is being passed on.`,
        need.thanks ? `From ${partner.name}: ${need.thanks}` : "",
      ].filter(Boolean));
      return NextResponse.json({ ok: true });
    }
    case "cancel": {
      if (pledge.status !== "pledged") return errorJson("Only a promise still waiting can be cancelled.", 409);
      await db.update(pledges).set({ status: "cancelled" }).where(eq(pledges.id, pledge.id));
      await logEvent(need.id, user.name, `Cancelled a promise (${code})`);
      return NextResponse.json({ ok: true });
    }
    case "undo": {
      if (pledge.status !== "received") return errorJson("Only a received promise can be undone.", 409);
      const back = pledge.received ?? pledge.amount;
      await db.update(pledges).set({ status: "pledged", received: null, receivedAt: null }).where(eq(pledges.id, pledge.id));
      await db
        .update(needs)
        .set({ received: sql`max(0, round(${needs.received} - ${back}, 2))` })
        .where(eq(needs.id, need.id));
      await logEvent(need.id, user.name, `Undid “received” (${code})`);
      return NextResponse.json({ ok: true });
    }
    default:
      return errorJson("Unknown action", 400);
  }
}
