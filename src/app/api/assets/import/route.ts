import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import { assetSchema, firstIssue } from "@/lib/validation";
import { normalizeAsset } from "@/lib/asset-write";

const bodySchema = z.object({
  rows: z.array(assetSchema).min(1, "Nothing to import").max(200),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstIssue(parsed.error, "Invalid import") },
      { status: 400 },
    );
  }

  const prices = await getUserSettings(user.id);
  const inserted = await db
    .insert(assets)
    .values(
      parsed.data.rows.map((row) => ({
        userId: user.id,
        ...row,
        ...normalizeAsset(row, prices, prices.currency),
      })),
    )
    .returning({ id: assets.id });

  return NextResponse.json({ ok: true, count: inserted.length }, { status: 201 });
}
