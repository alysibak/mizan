import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { assetSchema } from "@/lib/validation";

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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const [row] = await db
    .insert(assets)
    .values({ userId: user.id, ...parsed.data })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
