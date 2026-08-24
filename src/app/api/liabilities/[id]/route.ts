import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { liabilities } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const [row] = await db
    .delete(liabilities)
    .where(and(eq(liabilities.id, id), eq(liabilities.userId, user.id)))
    .returning({ id: liabilities.id });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
