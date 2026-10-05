import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { errorJson, readJson, writableUser } from "@/lib/api";
import { firstIssue, timeZoneSchema } from "@/lib/validation";

const bodySchema = z.object({ timezone: timeZoneSchema });

/** Record the browser's time zone so the server counts days as the user does. */
export async function POST(request: Request) {
  const { user, response } = await writableUser();
  if (response) return response;
  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson(firstIssue(parsed.error), 400);
  await db
    .update(settings)
    .set({ timezone: parsed.data.timezone })
    .where(eq(settings.userId, user.id));
  return NextResponse.json({ ok: true });
}
