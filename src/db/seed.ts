// Seed a demo account so you can see Mizan working immediately.
// Run with: npm run db:seed
//
// This file talks to the database directly (no server-only modules), so it runs
// fine under tsx outside the Next.js runtime.

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { users, settings, assets, liabilities, givingRecords } from "./schema";

const DEMO_EMAIL = "demo@mizan.app";
const DEMO_PASSWORD = "mizan1234";

async function main() {
  // Start clean: removing the user cascades to all related rows.
  await db.delete(users).where(eq(users.email, DEMO_EMAIL));

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const [user] = await db
    .insert(users)
    .values({ email: DEMO_EMAIL, name: "Demo", passwordHash })
    .returning();

  const hawlStart = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  await db.insert(settings).values({
    userId: user.id,
    currency: "CAD",
    nisabStandard: "silver",
    calendarBasis: "lunar",
    goldPricePerGram: 90,
    silverPricePerGram: 1.05,
    hawlStartDate: hawlStart,
  });

  await db.insert(assets).values([
    { userId: user.id, category: "cash", label: "Cash on hand", amount: 1500 },
    { userId: user.id, category: "bank", label: "Chequing + savings", amount: 9500 },
    { userId: user.id, category: "gold", label: "Gold coins", amount: 3200 },
    { userId: user.id, category: "stocks_trading", label: "Active brokerage", amount: 6000 },
    {
      userId: user.id,
      category: "stocks_longterm",
      label: "Index funds (long-term)",
      amount: 12000,
      zakatablePortion: 0.3,
    },
  ]);

  await db.insert(liabilities).values([
    { userId: user.id, label: "Credit card balance", amount: 1800, deductible: true },
  ]);

  await db.insert(givingRecords).values([
    {
      userId: user.id,
      amount: 120,
      type: "sadaqah",
      recipient: "Local food bank",
      note: "Monthly",
      date: new Date().toISOString().slice(0, 10),
    },
    {
      userId: user.id,
      amount: 250,
      type: "zakat",
      recipient: "Relief fund",
      date: new Date().toISOString().slice(0, 10),
    },
  ]);

  console.log("Seeded demo account.");
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
