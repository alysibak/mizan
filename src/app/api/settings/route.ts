import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import { settingsSchema } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getUserSettings(user.id));
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const values = {
    ...parsed.data,
    currency: parsed.data.currency.toUpperCase(),
    hawlStartDate: parsed.data.hawlStartDate || null,
    updatedAt: new Date().toISOString(),
  };

  await db
    .insert(settings)
    .values({ userId: user.id, ...values })
    .onConflictDoUpdate({ target: settings.userId, set: values });

  return NextResponse.json({ ok: true });
}
