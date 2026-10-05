import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { givingRecords } from "@/db/schema";
import { firstIssue, givingSchema } from "@/lib/validation";
import { errorJson, overRowLimit, readJson, signedInUser, writableUser } from "@/lib/api";

export async function GET() {
  const { user, response } = await signedInUser();
  if (response) return response;
  const rows = await db
    .select()
    .from(givingRecords)
    .where(eq(givingRecords.userId, user.id))
    .orderBy(desc(givingRecords.date), desc(givingRecords.createdAt));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { user, response } = await writableUser();
  if (response) return response;
  const parsed = givingSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson(firstIssue(parsed.error), 400);
  const full = await overRowLimit("giving", user.id);
  if (full) return full;
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
