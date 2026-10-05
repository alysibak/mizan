import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { getUserSettings } from "@/lib/session";
import { assetSchema, firstIssue } from "@/lib/validation";
import { normalizeAsset } from "@/lib/asset-write";
import { errorJson, overRowLimit, readJson, writableUser } from "@/lib/api";

const bodySchema = z.object({
  rows: z.array(assetSchema).min(1, "Nothing to import").max(200),
});

export async function POST(request: Request) {
  const { user, response } = await writableUser();
  if (response) return response;

  const parsed = bodySchema.safeParse(await readJson(request, 512 * 1024));
  if (!parsed.success) return errorJson(firstIssue(parsed.error, "Invalid import"), 400);
  const full = await overRowLimit("assets", user.id, parsed.data.rows.length);
  if (full) return full;

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
