import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import ForgiveDebtTool from "@/components/ForgiveDebtTool";

export default async function ForgivePage() {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);
  const rows = await db.select().from(assets).where(eq(assets.userId, user.id));
  const receivables = rows
    .filter((a) => a.category === "receivables" && a.amount > 0)
    .map((a) => ({ id: a.id, label: a.label, amount: a.amount }));

  return (
    <ForgiveDebtTool currency={settings.currency} receivables={receivables} />
  );
}
