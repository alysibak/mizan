import { NextResponse } from "next/server";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { assetSchema } from "@/lib/validation";
import { z } from "zod";

const bodySchema = z.object({
  rows: z.array(assetSchema).min(1, "Nothing to import").max(200),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid import" },
      { status: 400 },
    );
  }

  const inserted = await db
    .insert(assets)
    .values(parsed.data.rows.map((row) => ({ userId: user.id, ...row })))
    .returning({ id: assets.id });

  return NextResponse.json({ ok: true, count: inserted.length }, { status: 201 });
}
