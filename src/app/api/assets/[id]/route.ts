import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { getUserSettings } from "@/lib/session";
import { assetSchema, firstIssue } from "@/lib/validation";
import { normalizeAsset } from "@/lib/asset-write";
import { errorJson, readJson, writableUser } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { user, response } = await writableUser();
  if (response) return response;
  const { id } = await params;

  const parsed = assetSchema.partial().safeParse(await readJson(request));
  if (!parsed.success) return errorJson(firstIssue(parsed.error), 400);
  if (Object.keys(parsed.data).length === 0) return errorJson("Nothing to update", 400);

  const [existing] = await db
    .select()
    .from(assets)
    .where(and(eq(assets.id, id), eq(assets.userId, user.id)))
    .limit(1);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Value a weighed holding from the merged record, so changing only the
  // weight, purity, or category still lands on a consistent amount.
  const prices = await getUserSettings(user.id);
  const merged = { ...existing, ...parsed.data };

  // The where clause scopes the update to rows this user owns.
  const [row] = await db
    .update(assets)
    .set({ ...parsed.data, ...normalizeAsset(merged, prices, prices.currency) })
    .where(and(eq(assets.id, id), eq(assets.userId, user.id)))
    .returning();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { user, response } = await writableUser();
  if (response) return response;
  const { id } = await params;

  const [row] = await db
    .delete(assets)
    .where(and(eq(assets.id, id), eq(assets.userId, user.id)))
    .returning({ id: assets.id });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
