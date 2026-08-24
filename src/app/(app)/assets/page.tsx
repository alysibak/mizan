import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assets, liabilities } from "@/db/schema";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import AssetManager from "@/components/AssetManager";

export default async function AssetsPage() {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);

  const [assetRows, liabilityRows] = await Promise.all([
    db.select().from(assets).where(eq(assets.userId, user.id)).orderBy(desc(assets.createdAt)),
    db.select().from(liabilities).where(eq(liabilities.userId, user.id)).orderBy(desc(liabilities.createdAt)),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="label text-brass">Accounting</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Assets and liabilities</h1>
        <p className="mt-2 text-sm text-sage">
          Record what you own and what you owe. Mizan applies the zakatable
          portion for each category as you go.
        </p>
      </header>

      <AssetManager
        assets={assetRows}
        liabilities={liabilityRows}
        currency={settings.currency}
      />
    </div>
  );
}
