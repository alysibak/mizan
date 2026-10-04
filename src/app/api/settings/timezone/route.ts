import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { firstIssue, timeZoneSchema } from "@/lib/validation";

const bodySchema = z.object({ timezone: timeZoneSchema });

/** Record the browser's time zone so the server counts days as the user does. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  await db
    .update(settings)
    .set({ timezone: parsed.data.timezone })
    .where(eq(settings.userId, user.id));
  return NextResponse.json({ ok: true });
}
