import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { needs, partners, pledges } from "@/db/schema";
import { errorJson } from "@/lib/api";
import { pledgeHolds, readPledgeCode } from "@/lib/neighbours";
import { neighboursMode } from "@/lib/neighbours-store";
import { LIMITS, overLimit, tooManyRequests } from "@/lib/rate-limit";

/**
 * Where a promise stands, for the phone that made it: never the giver's name
 * or contact, only what they need to pay and to know it arrived.
 */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  if (neighboursMode() === "off") return errorJson("Not found", 404);
  if (await overLimit(request, LIMITS.pledgeLookup)) return tooManyRequests(LIMITS.pledgeLookup);
  const code = readPledgeCode((await params).code);
  if (!code) return errorJson("Not found", 404);
  const [row] = await db
    .select({ pledge: pledges, need: needs, partner: partners })
    .from(pledges)
    .innerJoin(needs, eq(pledges.needId, needs.id))
    .innerJoin(partners, eq(needs.partnerId, partners.id))
    .where(eq(pledges.code, code))
    .limit(1);
  if (!row) return errorJson("Not found", 404);
  const { pledge, need, partner } = row;
  const status =
    pledge.status === "received"
      ? "received"
      : pledge.status === "cancelled"
        ? "cancelled"
        : pledgeHolds(pledge, new Date())
          ? "pledged"
          : "lapsed";
  return NextResponse.json({
    code,
    status,
    amount: pledge.amount,
    received: pledge.received,
    receivedAt: pledge.receivedAt,
    createdAt: pledge.createdAt,
    need: { id: need.id, title: need.title, zakat: need.zakat, thanks: need.thanks },
    partner: { name: partner.name, slug: partner.slug, currency: partner.currency, howToGive: partner.howToGive, contact: partner.contact },
  });
}
