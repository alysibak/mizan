import { sql } from "drizzle-orm";
import { sqliteTable, text, real, integer, index } from "drizzle-orm/sqlite-core";
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
  // Consecutive failed sign-ins; reset on success. See lib/login-throttle.ts.
  failedLoginCount: integer("failed_login_count").notNull().default(0),
  // Sign-in is refused until this time after too many failures.
  lockedUntil: text("locked_until"),
  // SHA-256 of the one-time recovery code, if the user made one.
  recoveryCodeHash: text("recovery_code_hash"),
  // When the user followed a confirmation link sent to their address. Reset
  // links and reminders only ever go to a confirmed address.
  emailVerifiedAt: text("email_verified_at"),
  // Two-step sign-in: the authenticator-app secret once confirmed, the one
  // being set up, and the last 30-second step whose code was accepted (so a
  // code cannot be replayed).
  totpSecret: text("totp_secret"),
  totpPendingSecret: text("totp_pending_secret"),
  totpLastStep: integer("totp_last_step"),
  createdAt: now(),
});

// Between a correct password and a correct authenticator code. Holds the
// SHA-256 of a short-lived ticket the browser presents with the code.
export const loginChallenges = sqliteTable(
  "login_challenges",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    createdAt: now(),
  },
  (t) => [index("login_challenges_user_idx").on(t.userId)],
);

// One-time links sent by email: confirm the address, or reset the password.
// Only the SHA-256 of the token is stored; each is deleted when used.
export const emailTokens = sqliteTable(
  "email_tokens",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: text("purpose").notNull(), // 'verify' | 'reset'
    expiresAt: text("expires_at").notNull(),
    createdAt: now(),
  },
  (t) => [index("email_tokens_user_idx").on(t.userId)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    // Stores the SHA-256 hash of the session token, never the token itself.
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    createdAt: now(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

// One settings row per user. Nisab prices are stored locally and edited by the
// user, so the app never depends on a paid metals API to function.
export const settings = sqliteTable(
  "settings",
  {
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
    // IANA time zone from the user's browser, so "today" is their today.
    timezone: text("timezone"),
    // 'tabular' (arithmetic) or 'umalqura' (Saudi Umm al-Qura tables).
    hijriCalendar: text("hijri_calendar").notNull().default("tabular"),
    // SHA-256 of the secret in the user's calendar-feed URL, if enabled.
    calendarTokenHash: text("calendar_token_hash"),
    // Opted in to an email a week before the hawl day and on the day.
    emailReminders: integer("email_reminders", { mode: "boolean" }).notNull().default(false),
    // The last reminder sent, as "<due day>:week" or "<due day>:day", so a
    // daily run sends each one once.
    reminderSentFor: text("reminder_sent_for"),
    // The column is named created_at for historical reasons; it holds the time
    // of the last settings save.
    updatedAt: text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
  },
  // Calendar apps poll the feed by token hash; without an index each poll
  // would scan every user's settings.
  (t) => [index("settings_calendar_token_idx").on(t.calendarTokenHash)],
);

export const assets = sqliteTable(
  "assets",
  {
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
    // Metal holdings entered by weight. When grams is set, amount is
    // recomputed from the settings price for `metal` whenever prices are saved.
    grams: real("grams"),
    purity: real("purity"),
    metal: text("metal"), // "gold" | "silver"
    // Holdings kept in another currency: the figure in that currency and the
    // user's rate to the base currency. amount holds the converted value.
    foreignCurrency: text("foreign_currency"),
    foreignAmount: real("foreign_amount"),
    fxRate: real("fx_rate"),
    createdAt: now(),
  },
  (t) => [index("assets_user_idx").on(t.userId)],
);

export const liabilities = sqliteTable(
  "liabilities",
  {
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
  },
  (t) => [index("liabilities_user_idx").on(t.userId)],
);

export const givingRecords = sqliteTable(
  "giving_records",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: real("amount").notNull(),
    type: text("type").notNull().default("sadaqah"), // see lib/giving.ts
    /** Optional classical recipient category for zakat entries (see lib/asnaf.ts). */
    asnaf: text("asnaf"),
    recipient: text("recipient"),
    note: text("note"),
    date: text("date").notNull(), // ISO date string (YYYY-MM-DD)
    createdAt: now(),
  },
  (t) => [index("giving_records_user_date_idx").on(t.userId, t.date)],
);

/** Frozen reckoning for a closed year — JSON payload, no live feeds. */
export const yearSnapshots = sqliteTable(
  "year_snapshots",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    takenAt: text("taken_at").notNull(),
    currency: text("currency").notNull(),
    payload: text("payload").notNull(),
    createdAt: now(),
  },
  (t) => [index("year_snapshots_user_idx").on(t.userId)],
);

/** Fixed-window counters for per-IP limits on sign-up, sign-in, and recovery. */
export const authAttempts = sqliteTable("auth_attempts", {
  key: text("key").primaryKey(), // scope + hashed IP
  windowStart: text("window_start").notNull(),
  count: integer("count").notNull(),
});

export type User = typeof users.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type Liability = typeof liabilities.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type GivingRecord = typeof givingRecords.$inferSelect;
export type YearSnapshot = typeof yearSnapshots.$inferSelect;
