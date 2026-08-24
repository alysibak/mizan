import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { givingRecords } from "@/db/schema";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import { formatMoney } from "@/lib/money";
import GivingManager from "@/components/GivingManager";

export default async function GivingPage() {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);

  const rows = await db
    .select()
    .from(givingRecords)
    .where(eq(givingRecords.userId, user.id))
    .orderBy(desc(givingRecords.date));

  const totalSadaqah = rows
    .filter((r) => r.type === "sadaqah")
    .reduce((t, r) => t + r.amount, 0);
  const totalZakat = rows
    .filter((r) => r.type === "zakat")
    .reduce((t, r) => t + r.amount, 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="label text-brass">Sadaqah and zakat</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Your giving</h1>
        <p className="mt-2 text-sm text-sage">
          Keep a record of what you give. Zakat entries count toward what you owe
          on your dashboard.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-4">
          <p className="label">Total zakat given</p>
          <p className="mt-1 font-serif text-2xl text-pine nums">
            {formatMoney(totalZakat, settings.currency)}
          </p>
        </div>
        <div className="card p-4">
          <p className="label">Total sadaqah given</p>
          <p className="mt-1 font-serif text-2xl text-brass nums">
            {formatMoney(totalSadaqah, settings.currency)}
          </p>
        </div>
      </div>

      <GivingManager records={rows} currency={settings.currency} />
    </div>
  );
}
