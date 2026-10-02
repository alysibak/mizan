import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assets, liabilities } from "@/db/schema";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import { parseMadhhab } from "@/lib/madhhab";
import { CATEGORIES } from "@/lib/categories";
import AssetManager from "@/components/AssetManager";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; label?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);
  const params = await searchParams;
  const initialCategory =
    params.category && Object.hasOwn(CATEGORIES, params.category)
      ? params.category
      : undefined;
  const initialLabel = params.label?.trim().slice(0, 120) || undefined;

  const [assetRows, liabilityRows] = await Promise.all([
    db.select().from(assets).where(eq(assets.userId, user.id)).orderBy(desc(assets.createdAt)),
    db.select().from(liabilities).where(eq(liabilities.userId, user.id)).orderBy(desc(liabilities.createdAt)),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="label text-brass">Ledger</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">What you hold</h1>
        <p className="mt-2 text-sm text-sage">
          Assets and debts — including metals by weight, money owed to you, and
          trade inventory. Import a CSV, then correct categories before they
          enter the reckoning.
        </p>
      </header>

      <AssetManager
        key={`${initialCategory ?? "default"}-${initialLabel ?? ""}`}
        assets={assetRows}
        liabilities={liabilityRows}
        currency={settings.currency}
        madhhab={parseMadhhab(settings.madhhab)}
        goldPricePerGram={settings.goldPricePerGram}
        silverPricePerGram={settings.silverPricePerGram}
        initialCategory={initialCategory}
        initialLabel={initialLabel}
      />
    </div>
  );
}
