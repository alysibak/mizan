import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { givingRecords } from "@/db/schema";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import { asnafLabel } from "@/lib/asnaf";
import { givingTypeLabel } from "@/lib/giving";
import { csvRow } from "@/lib/csv";

export const dynamic = "force-dynamic";

/** Giving history as CSV, for receipts season or a spreadsheet of your own. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [settings, rows] = await Promise.all([
    getUserSettings(user.id),
    db
      .select()
      .from(givingRecords)
      .where(eq(givingRecords.userId, user.id))
      .orderBy(desc(givingRecords.date), desc(givingRecords.createdAt)),
  ]);

  const lines = [
    csvRow(["date", "type", "asnaf", "amount", "currency", "recipient", "note"]),
    ...rows.map((g) =>
      csvRow([
        g.date,
        givingTypeLabel(g.type),
        asnafLabel(g.asnaf),
        g.amount.toFixed(2),
        settings.currency,
        g.recipient,
        g.note,
      ]),
    ),
  ];

  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mizan-giving-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
