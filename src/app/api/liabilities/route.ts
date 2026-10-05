import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { liabilities } from "@/db/schema";
import { firstIssue, liabilitySchema } from "@/lib/validation";
import { errorJson, overRowLimit, readJson, signedInUser, writableUser } from "@/lib/api";

export async function GET() {
  const { user, response } = await signedInUser();
  if (response) return response;
  const rows = await db
    .select()
    .from(liabilities)
    .where(eq(liabilities.userId, user.id))
    .orderBy(desc(liabilities.createdAt));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { user, response } = await writableUser();
  if (response) return response;
  const parsed = liabilitySchema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson(firstIssue(parsed.error), 400);
  const full = await overRowLimit("liabilities", user.id);
  if (full) return full;
  const [row] = await db
    .insert(liabilities)
    .values({ userId: user.id, ...parsed.data })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
