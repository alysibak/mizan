// Seed the demo account so you can see Mizan working immediately.
// Run with: npm run db:seed
//
// Running it again resets the demo to a fresh state (its dates are relative to
// today). On a public server, set DEMO_EMAIL to the same address so the
// account is read-only and the "Try the demo" button signs visitors into it.
//
// This file talks to the database directly (no server-only modules), so it runs
// fine under tsx outside the Next.js runtime.

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  users,
  sessions,
  settings,
  assets,
  liabilities,
  givingRecords,
  yearSnapshots,
} from "./schema";

const DEMO_EMAIL = process.env.DEMO_EMAIL?.trim().toLowerCase() || "demo@mizan.app";
const DEMO_PASSWORD = "mizan1234";

const day = (offset: number) =>
  new Date(Date.now() + offset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

async function main() {
  // Start clean. Child rows are removed explicitly: SQLite only cascades when
  // foreign keys are switched on, which a plain connection does not do.
  const [old] = await db.select({ id: users.id }).from(users).where(eq(users.email, DEMO_EMAIL));
  if (old) {
    await db.batch([
      db.delete(assets).where(eq(assets.userId, old.id)),
      db.delete(liabilities).where(eq(liabilities.userId, old.id)),
      db.delete(givingRecords).where(eq(givingRecords.userId, old.id)),
      db.delete(yearSnapshots).where(eq(yearSnapshots.userId, old.id)),
      db.delete(settings).where(eq(settings.userId, old.id)),
      db.delete(sessions).where(eq(sessions.userId, old.id)),
      db.delete(users).where(eq(users.id, old.id)),
    ]);
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const now = new Date().toISOString();
  const [user] = await db
    .insert(users)
    .values({ email: DEMO_EMAIL, name: "Demo", passwordHash, lastLoginAt: now })
    .returning();

  // Close to the end of a lunar year, so the countdown and close path show.
  const hawlStart = day(-340);

  await db.insert(settings).values({
    userId: user.id,
    currency: "CAD",
    nisabStandard: "silver",
    calendarBasis: "lunar",
    // Illustrative prices, saved today, so the demo is not held at the
    // "confirm your starter prices" gate.
    goldPricePerGram: 148.5,
    silverPricePerGram: 1.85,
    metalsUpdatedAt: now,
    hawlStartDate: hawlStart,
    madhhab: "general",
    setupComplete: true,
    trustedAckAt: now,
    hijriCalendar: "tabular",
  });

  await db.insert(assets).values([
    { userId: user.id, category: "cash", label: "Cash on hand", amount: 1500 },
    { userId: user.id, category: "bank", label: "Chequing + savings", amount: 9500 },
    {
      userId: user.id,
      category: "gold",
      label: "Gold coins (20 g, 22k)",
      amount: 2720.52,
      grams: 20,
      purity: 0.916,
      metal: "gold",
    },
    {
      userId: user.id,
      category: "jewellery",
      label: "Wedding jewellery",
      amount: 4000,
      zakatablePortion: 0,
      note: "Worn regularly; counted per the school profile you choose.",
    },
    { userId: user.id, category: "stocks_trading", label: "Active brokerage", amount: 6000 },
    {
      userId: user.id,
      category: "stocks_longterm",
      label: "Index funds (long-term)",
      amount: 12000,
      zakatablePortion: 0.3,
    },
    {
      userId: user.id,
      category: "receivables",
      label: "Loan to my brother",
      amount: 800,
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
      date: day(-3),
    },
    {
      userId: user.id,
      amount: 250,
      type: "zakat",
      asnaf: "faqir",
      recipient: "Relief fund",
      date: day(-20),
    },
    {
      userId: user.id,
      amount: 60,
      type: "fitr",
      recipient: "Masjid fitr collection",
      note: "Household of four",
      date: day(-180),
    },
    {
      userId: user.id,
      amount: 18.4,
      type: "purification",
      recipient: "Charity",
      note: "Impermissible income from a fund",
      date: day(-60),
    },
  ]);

  console.log("Seeded demo account.");
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log("Set DEMO_EMAIL to this address on a public server to make it read-only.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
