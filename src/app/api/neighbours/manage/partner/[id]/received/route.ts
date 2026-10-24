import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { needs, pledges } from "@/db/schema";
import { csvRow } from "@/lib/csv";
import { showPledgeCode } from "@/lib/neighbours";
import { partnerReadGate } from "@/lib/neighbours-gate";

export const dynamic = "force-dynamic";

/**
 * Everything received for this partner's needs, as CSV, for its own
 * accounts: each payment marked received, and what was given at the office.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await partnerReadGate((await params).id);
  if (gate.response) return gate.response;
  const { partner } = gate;
  const [received, all] = await Promise.all([
    db
      .select({ pledge: pledges, need: needs })
      .from(pledges)
      .innerJoin(needs, eq(pledges.needId, needs.id))
      .where(and(eq(needs.partnerId, partner.id), eq(pledges.status, "received")))
      .orderBy(desc(pledges.receivedAt)),
    db.select().from(needs).where(eq(needs.partnerId, partner.id)),
  ]);
  const viaPledges = new Map<string, number>();
  for (const { pledge, need } of received) {
    viaPledges.set(need.id, (viaPledges.get(need.id) ?? 0) + (pledge.received ?? pledge.amount));
  }
  const lines = [
    csvRow(["date received", "need", "zakat or charity", "code", "amount", "currency", "from"]),
    ...received.map(({ pledge, need }) =>
      csvRow([
        (pledge.receivedAt ?? "").slice(0, 10),
        need.title,
        need.zakat ? "zakat" : "charity",
        showPledgeCode(pledge.code),
        (pledge.received ?? pledge.amount).toFixed(2),
        partner.currency,
        pledge.name,
      ]),
    ),
    // Money that reached a need without a promise, at the office.
    ...all
      .map((need) => ({ need, office: Math.round((need.received - (viaPledges.get(need.id) ?? 0)) * 100) / 100 }))
      .filter((r) => r.office > 0)
      .map(({ need, office }) =>
        csvRow(["", need.title, need.zakat ? "zakat" : "charity", "at the office", office.toFixed(2), partner.currency, ""]),
      ),
  ];
  return new Response(`${lines.join("\r\n")}\r\n`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${partner.slug}-received.csv"`,
      "cache-control": "no-store",
    },
  });
}
