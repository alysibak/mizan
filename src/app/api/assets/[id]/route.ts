import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { assetSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = assetSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // The where clause scopes the update to rows this user owns.
  const [row] = await db
    .update(assets)
    .set(parsed.data)
    .where(and(eq(assets.id, id), eq(assets.userId, user.id)))
    .returning();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const [row] = await db
    .delete(assets)
    .where(and(eq(assets.id, id), eq(assets.userId, user.id)))
    .returning({ id: assets.id });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
