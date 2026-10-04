import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { givingRecords } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { firstIssue, givingSchema } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db
    .select()
    .from(givingRecords)
    .where(eq(givingRecords.userId, user.id))
    .orderBy(desc(givingRecords.date), desc(givingRecords.createdAt));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = givingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  const data = {
    ...parsed.data,
    // Asnaf tags describe zakat recipients only.
    asnaf: parsed.data.type === "zakat" ? parsed.data.asnaf ?? null : null,
  };
  const [row] = await db
    .insert(givingRecords)
    .values({ userId: user.id, ...data })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
