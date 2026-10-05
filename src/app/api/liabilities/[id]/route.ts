import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { liabilities } from "@/db/schema";
import { firstIssue, liabilitySchema } from "@/lib/validation";
import { errorJson, readJson, writableUser } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { user, response } = await writableUser();
  if (response) return response;
  const { id } = await params;
  const parsed = liabilitySchema.partial().safeParse(await readJson(request));
  if (!parsed.success) return errorJson(firstIssue(parsed.error), 400);
  if (Object.keys(parsed.data).length === 0) return errorJson("Nothing to update", 400);
  const [row] = await db
    .update(liabilities)
    .set(parsed.data)
    .where(and(eq(liabilities.id, id), eq(liabilities.userId, user.id)))
    .returning();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { user, response } = await writableUser();
  if (response) return response;
  const { id } = await params;
  const [row] = await db
    .delete(liabilities)
    .where(and(eq(liabilities.id, id), eq(liabilities.userId, user.id)))
    .returning({ id: liabilities.id });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
