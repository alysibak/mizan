import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { hashFeedToken, newFeedToken } from "@/lib/calendar-feed";

/** Turn on (or replace) the private calendar feed; the URL is shown once. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = newFeedToken();
  await db
    .update(settings)
    .set({ calendarTokenHash: hashFeedToken(token) })
    .where(eq(settings.userId, user.id));
  const origin = new URL(request.url).origin;
  return NextResponse.json({ url: `${origin}/api/calendar/${token}.ics` });
}

/** Turn the feed off; the old URL stops working. */
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await db
    .update(settings)
    .set({ calendarTokenHash: null })
    .where(eq(settings.userId, user.id));
  return NextResponse.json({ ok: true });
}
