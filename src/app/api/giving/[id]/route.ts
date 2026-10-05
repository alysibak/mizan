import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { givingRecords } from "@/db/schema";
import { writableUser } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Ctx) {
  const { user, response } = await writableUser();
  if (response) return response;
  const { id } = await params;
  const [row] = await db
    .delete(givingRecords)
    .where(and(eq(givingRecords.id, id), eq(givingRecords.userId, user.id)))
    .returning({ id: givingRecords.id });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
