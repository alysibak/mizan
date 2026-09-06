import { sql } from "drizzle-orm";
import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { randomUUID } from "crypto";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());

const now = () =>
  text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`);

export const users = sqliteTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  // Updated on every successful login (and set at registration).
  lastLoginAt: text("last_login_at"),
  createdAt: now(),
});

export const sessions = sqliteTable("sessions", {
  // Stores the SHA-256 hash of the session token, never the token itself.
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  createdAt: now(),
});

// One settings row per user. Nisab prices are stored locally and edited by the
// user, so the app never depends on a paid metals API to function.
export const settings = sqliteTable("settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  currency: text("currency").notNull().default("CAD"),
  nisabStandard: text("nisab_standard").notNull().default("silver"), // 'gold' | 'silver'
  calendarBasis: text("calendar_basis").notNull().default("lunar"), // 'lunar' | 'solar'
  goldPricePerGram: real("gold_price_per_gram").notNull().default(90),
  silverPricePerGram: real("silver_price_per_gram").notNull().default(1.05),
  // When gold/silver prices were last saved by the user (not settings.updatedAt).
  metalsUpdatedAt: text("metals_updated_at"),
  // Date the user's wealth last crossed nisab. Hawl (the lunar holding year)
  // is measured from here. Null until the user sets it. Per-asset dates may
  // also be set on individual holdings.
  hawlStartDate: text("hawl_start_date"),
  // School profile for default portions/notes. 'general' | 'hanafi' | ...
  madhhab: text("madhhab").notNull().default("general"),
  // False until the post-register Begin wizard is finished.
  setupComplete: integer("setup_complete", { mode: "boolean" }).notNull().default(true),
  // When the user acknowledged the estimate/trust notice during setup.
  trustedAckAt: text("trusted_ack_at"),
  updatedAt: now(),
});

export const assets = sqliteTable("assets", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // see lib/categories.ts
  label: text("label").notNull(),
  amount: real("amount").notNull(), // market value in the user's currency
  // Fraction of the value that is zakatable (0..1). Defaults to 1. Long-term
  // equity holdings, for example, are often zakatable on a partial basis.
  zakatablePortion: real("zakatable_portion").notNull().default(1),
  // Optional per-holding hawl start — reminder only today; payable math uses
  // settings.hawlStartDate. Falls back to that date when blank.
  hawlStartDate: text("hawl_start_date"),
  note: text("note"),
  createdAt: now(),
});

export const liabilities = sqliteTable("liabilities", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  amount: real("amount").notNull(),
  // Whether this debt is deductible from zakatable wealth. Immediate debts are
  // commonly deductible; the treatment of long-term debt varies by scholar.
  deductible: integer("deductible", { mode: "boolean" }).notNull().default(true),
  createdAt: now(),
});

export const givingRecords = sqliteTable("giving_records", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  type: text("type").notNull().default("sadaqah"), // 'zakat' | 'sadaqah' | 'purification'
  /** Optional classical recipient category for zakat entries (see lib/asnaf.ts). */
  asnaf: text("asnaf"),
  recipient: text("recipient"),
  note: text("note"),
  date: text("date").notNull(), // ISO date string (YYYY-MM-DD)
  createdAt: now(),
});

/** Frozen reckoning for a closed year — JSON payload, no live feeds. */
export const yearSnapshots = sqliteTable("year_snapshots", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  takenAt: text("taken_at").notNull(),
  currency: text("currency").notNull(),
  payload: text("payload").notNull(),
  createdAt: now(),
});

export type User = typeof users.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type Liability = typeof liabilities.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type GivingRecord = typeof givingRecords.$inferSelect;
export type YearSnapshot = typeof yearSnapshots.$inferSelect;
