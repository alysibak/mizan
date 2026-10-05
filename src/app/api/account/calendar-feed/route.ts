import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { writableUser } from "@/lib/api";
import { publicOrigin } from "@/lib/site";
import { hashFeedToken, newFeedToken } from "@/lib/calendar-feed";

/** Turn on (or replace) the private calendar feed; the URL is shown once. */
export async function POST(request: Request) {
  const { user, response } = await writableUser();
  if (response) return response;
  const token = newFeedToken();
  await db
    .update(settings)
    .set({ calendarTokenHash: hashFeedToken(token) })
    .where(eq(settings.userId, user.id));
  const origin = publicOrigin(request);
  return NextResponse.json({ url: `${origin}/api/calendar/${token}.ics` });
}

/** Turn the feed off; the old URL stops working. */
export async function DELETE() {
  const { user, response } = await writableUser();
  if (response) return response;
  await db
    .update(settings)
    .set({ calendarTokenHash: null })
    .where(eq(settings.userId, user.id));
  return NextResponse.json({ ok: true });
}
