import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { getUserSettings } from "@/lib/session";
import { assetSchema, firstIssue } from "@/lib/validation";
import { normalizeAsset } from "@/lib/asset-write";
import { errorJson, overRowLimit, readJson, signedInUser, writableUser } from "@/lib/api";

export async function GET() {
  const { user, response } = await signedInUser();
  if (response) return response;

  const rows = await db
    .select()
    .from(assets)
    .where(eq(assets.userId, user.id))
    .orderBy(desc(assets.createdAt));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { user, response } = await writableUser();
  if (response) return response;

  const parsed = assetSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson(firstIssue(parsed.error), 400);
  const full = await overRowLimit("assets", user.id);
  if (full) return full;

  const prices = await getUserSettings(user.id);
  const [row] = await db
    .insert(assets)
    .values({
      userId: user.id,
      ...parsed.data,
      ...normalizeAsset(parsed.data, prices, prices.currency),
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
