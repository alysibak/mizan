import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assets, liabilities, givingRecords } from "@/db/schema";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import { calculateZakat } from "@/lib/zakat";
import {
  duePhase,
  paymentWindow,
  sumZakatInWindow,
} from "@/lib/giving-window";
import EnvelopeTool from "@/components/EnvelopeTool";

export default async function EnvelopesPage() {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);

  const [assetRows, liabilityRows, givingRows] = await Promise.all([
    db.select().from(assets).where(eq(assets.userId, user.id)),
    db.select().from(liabilities).where(eq(liabilities.userId, user.id)),
    db.select().from(givingRecords).where(eq(givingRecords.userId, user.id)),
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

  const window = paymentWindow(settings.hawlStartDate);
  const paid = sumZakatInWindow(givingRows, window);
  const outstanding = Math.max(0, result.zakatDue - paid);
  const phase = duePhase({
    meetsNisab: result.isDue,
    hawlStartDate: settings.hawlStartDate,
  });
  const defaultTotal =
    phase === "payable" && outstanding > 0
      ? outstanding
      : result.isDue
        ? result.zakatDue
        : 0;

  return (
    <EnvelopeTool currency={settings.currency} defaultTotal={defaultTotal} />
  );
}
