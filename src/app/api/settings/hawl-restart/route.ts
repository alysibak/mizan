import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import { firstIssue, isoDaySchema } from "@/lib/validation";
import { userTodayIso } from "@/lib/today";

const bodySchema = z.object({ date: isoDaySchema });

/**
 * Restart the ledger hawl from the day wealth climbed back to nisab, for those
 * who follow the view that a dip below nisab mid-year breaks the hawl.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }

  const current = await getUserSettings(user.id);
  const { date } = parsed.data;
  if (current.hawlStartDate && date <= current.hawlStartDate) {
    return NextResponse.json(
      { error: `Pick a day after the current start (${current.hawlStartDate}).` },
      { status: 400 },
    );
  }
  if (date > userTodayIso(current.timezone)) {
    return NextResponse.json({ error: "That day has not happened yet." }, { status: 400 });
  }

  await db
    .update(settings)
    .set({ hawlStartDate: date, updatedAt: new Date().toISOString() })
    .where(eq(settings.userId, user.id));
  return NextResponse.json({ ok: true, hawlStartDate: date });
}
