import "server-only";
import { and, eq, isNotNull, or } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { normalizeAsset } from "@/lib/asset-write";

/**
 * Writes that keep holdings in step with new metal prices or a new base
 * currency: a holding entered by weight follows the metal price, and one held
 * in a foreign currency that has become the base is a plain amount again.
 */
export async function assetRevaluations(
  userId: string,
  prices: { goldPricePerGram: number; silverPricePerGram: number },
  currency: string,
): Promise<BatchItem<"sqlite">[]> {
  const special = await db
    .select()
    .from(assets)
    .where(
      and(
        eq(assets.userId, userId),
        or(isNotNull(assets.grams), isNotNull(assets.foreignCurrency)),
      ),
    );
  const writes: BatchItem<"sqlite">[] = [];
  for (const asset of special) {
    const next = normalizeAsset(asset, prices, currency);
    const amount =
      asset.foreignCurrency && !next.foreignCurrency
        ? asset.foreignAmount ?? asset.amount // now held in the base currency
        : next.amount;
    if (amount !== asset.amount || next.foreignCurrency !== asset.foreignCurrency) {
      writes.push(
        db
          .update(assets)
          .set({ ...next, amount })
          .where(and(eq(assets.id, asset.id), eq(assets.userId, userId))),
      );
    }
  }
  return writes;
}
