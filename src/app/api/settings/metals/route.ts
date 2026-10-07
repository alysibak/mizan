import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getUserSettings } from "@/lib/session";
import { firstIssue, metalPricesSchema } from "@/lib/validation";
import { assetRevaluations } from "@/lib/asset-revalue";
import { errorJson, readJson, writableUser } from "@/lib/api";

/**
 * Save today's gold and silver prices, and nothing else: the one-tap update
 * offered when the saved prices have gone stale. Holdings entered by weight
 * follow in the same write.
 */
export async function PUT(request: Request) {
  const { user, response } = await writableUser();
  if (response) return response;
  const parsed = metalPricesSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson(firstIssue(parsed.error), 400);

  const current = await getUserSettings(user.id);
  const now = new Date().toISOString();
  await db.batch([
    db
      .update(settings)
      .set({ ...parsed.data, metalsUpdatedAt: now, updatedAt: now })
      .where(eq(settings.userId, user.id)),
    ...(await assetRevaluations(user.id, parsed.data, current.currency)),
  ]);
  return NextResponse.json({ ok: true });
}
