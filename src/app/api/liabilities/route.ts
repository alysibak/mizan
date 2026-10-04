import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { liabilities } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { firstIssue, liabilitySchema } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db
    .select()
    .from(liabilities)
    .where(eq(liabilities.userId, user.id))
    .orderBy(desc(liabilities.createdAt));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = liabilitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  const [row] = await db
    .insert(liabilities)
    .values({ userId: user.id, ...parsed.data })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
