import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { yearSnapshots } from "@/db/schema";
import { signedInUser, writableUser } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { user, response } = await signedInUser();
  if (response) return response;
  const { id } = await params;
  const [row] = await db
    .select()
    .from(yearSnapshots)
    .where(and(eq(yearSnapshots.id, id), eq(yearSnapshots.userId, user.id)))
    .limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { user, response } = await writableUser();
  if (response) return response;
  const { id } = await params;
  const [row] = await db
    .delete(yearSnapshots)
    .where(and(eq(yearSnapshots.id, id), eq(yearSnapshots.userId, user.id)))
    .returning({ id: yearSnapshots.id });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
