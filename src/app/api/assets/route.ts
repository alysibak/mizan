import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import { assetSchema, firstIssue } from "@/lib/validation";
import { normalizeWeight } from "@/lib/asset-write";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(assets)
    .where(eq(assets.userId, user.id))
    .orderBy(desc(assets.createdAt));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = assetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }

  const prices = await getUserSettings(user.id);
  const [row] = await db
    .insert(assets)
    .values({
      userId: user.id,
      ...parsed.data,
      ...normalizeWeight(parsed.data, prices),
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
