import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assets, liabilities } from "@/db/schema";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import { calculateZakat } from "@/lib/zakat";
import WhatIfNisabTool from "@/components/WhatIfNisabTool";

export default async function WhatIfPage() {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);
  const [assetRows, liabilityRows] = await Promise.all([
    db.select().from(assets).where(eq(assets.userId, user.id)),
    db.select().from(liabilities).where(eq(liabilities.userId, user.id)),
  ]);

  const result = calculateZakat({
    assets: assetRows.map((a) => ({
      category: a.category,
      label: a.label,
      amount: a.amount,
      zakatablePortion: a.zakatablePortion,
    })),
    liabilities: liabilityRows.map((l) => ({
      label: l.label,
      amount: l.amount,
      deductible: l.deductible,
    })),
    prices: {
      goldPricePerGram: settings.goldPricePerGram,
      silverPricePerGram: settings.silverPricePerGram,
    },
    standard: settings.nisabStandard as "gold" | "silver",
    basis: settings.calendarBasis as "lunar" | "solar",
  });

  return (
    <WhatIfNisabTool
      currency={settings.currency}
      netZakatable={result.netZakatable}
      goldPricePerGram={settings.goldPricePerGram}
      silverPricePerGram={settings.silverPricePerGram}
      standard={settings.nisabStandard as "gold" | "silver"}
      basis={settings.calendarBasis as "lunar" | "solar"}
    />
  );
}
