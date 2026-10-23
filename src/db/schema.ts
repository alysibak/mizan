import { sql } from "drizzle-orm";
import { sqliteTable, text, real, integer, index, primaryKey } from "drizzle-orm/sqlite-core";
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
  // Empty for an account made with Google, which has no password until one
  // is set in Settings.
  passwordHash: text("password_hash").notNull(),
  // The Google account's stable id ("sub"), once signed in with Google.
  googleSub: text("google_sub").unique(),
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

// One-time tokens: links sent by email (confirm the address, reset the
// password) and the sign-in ticket between a right password and a right
// authenticator code. Only the SHA-256 of each is stored; each is deleted
// when used. (The table name predates the sign-in tickets.)
export const oneTimeTokens = sqliteTable(
  "email_tokens",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: text("purpose").notNull(), // see lib/one-time-tokens.ts
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

/**
 * A phone's kept figures on their way to a new phone: sealed in the browser
 * with a key made from a short code the server never sees, found by a hash of
 * that code, read once, and gone after half an hour.
 */
export const phoneMoves = sqliteTable(
  "phone_moves",
  {
    id: text("id").primaryKey(), // hash of the code, not the code
    sealed: text("sealed").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: now(),
  },
  (t) => [index("phone_moves_expires_idx").on(t.expiresAt)],
);

/**
 * "Was this easy?" at the end of a task: the answer, an optional line, and
 * which page. Nothing ties it to a person: no account, no address, no amounts.
 */
export const feedback = sqliteTable(
  "feedback",
  {
    id: id(),
    page: text("page").notNull(),
    easy: integer("easy", { mode: "boolean" }).notNull(),
    note: text("note"),
    locale: text("locale").notNull(),
    createdAt: now(),
  },
  (t) => [index("feedback_created_idx").on(t.createdAt)],
);

/** How many reached each step of the main journey each day, and nothing else. */
export const journeyCounts = sqliteTable(
  "journey_counts",
  {
    day: text("day").notNull(),
    step: text("step").notNull(),
    count: integer("count").notNull(),
  },
  (t) => [primaryKey({ columns: [t.day, t.step] })],
);

/**
 * Mizan Neighbours: a mosque or community group that checks needs near it
 * and passes on what is given. Mizan never holds the money: givers pay the
 * partner, using the details it publishes here.
 */
export const partners = sqliteTable("partners", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  /** Who they are and how they check each need, in their own words. */
  about: text("about").notNull().default(""),
  /** How to pay them: bank or mobile money details, or "at the office". */
  howToGive: text("how_to_give").notNull().default(""),
  /** The office's public phone or email, for givers' questions. */
  contact: text("contact").notNull().default(""),
  currency: text("currency").notNull().default("USD"),
  /** A need written by one member is checked and listed by another. */
  twoPerson: integer("two_person", { mode: "boolean" }).notNull().default(true),
  status: text("status").notNull().default("active"), // "active" | "paused"
  /** Made-up partner and needs, shown only when Neighbours is in demo mode. */
  example: integer("example", { mode: "boolean" }).notNull().default(false),
  createdAt: now(),
});

export const partnerMembers = sqliteTable(
  "partner_members",
  {
    partnerId: text("partner_id")
      .notNull()
      .references(() => partners.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // "lead" | "member"
    createdAt: now(),
  },
  (t) => [primaryKey({ columns: [t.partnerId, t.userId] }), index("partner_members_user_idx").on(t.userId)],
);

/**
 * A need, as the partner checked it: what is needed, never who needs it.
 * `received` is everything that reached the partner for it, through Mizan
 * pledges or given at the office.
 */
export const needs = sqliteTable(
  "needs",
  {
    id: id(),
    partnerId: text("partner_id")
      .notNull()
      .references(() => partners.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // see lib/neighbours.ts
    title: text("title").notNull(),
    story: text("story").notNull().default(""),
    amount: real("amount").notNull(),
    received: real("received").notNull().default(0),
    /** Whether zakat may go to it, as the partner's scholar decided. */
    zakat: integer("zakat", { mode: "boolean" }).notNull(),
    status: text("status").notNull().default("draft"), // "draft" | "open" | "closed" | "removed"
    /** Off the list for a check: by hand, or by reports from visitors. */
    paused: integer("paused", { mode: "boolean" }).notNull().default(false),
    /** How many days it is listed for once published. */
    days: integer("days").notNull().default(30),
    createdBy: text("created_by"),
    approvedBy: text("approved_by"),
    publishedAt: text("published_at"),
    expiresAt: text("expires_at"),
    closedAt: text("closed_at"),
    /** A line from the partner to everyone who gave, once it is met. */
    thanks: text("thanks"),
    createdAt: now(),
  },
  (t) => [index("needs_partner_status_idx").on(t.partnerId, t.status)],
);

/**
 * A giver's promise. The code goes on their payment so the partner can match
 * it; name and contact are optional and cleared some weeks after it settles.
 */
export const pledges = sqliteTable(
  "pledges",
  {
    id: id(),
    needId: text("need_id")
      .notNull()
      .references(() => needs.id, { onDelete: "cascade" }),
    code: text("code").notNull().unique(),
    amount: real("amount").notNull(),
    /** What actually arrived, once the partner marks it received. */
    received: real("received"),
    name: text("name"),
    contact: text("contact"),
    status: text("status").notNull().default("pledged"), // "pledged" | "received" | "cancelled"
    receivedAt: text("received_at"),
    createdAt: now(),
  },
  (t) => [index("pledges_need_idx").on(t.needId)],
);

/** "Something wrong with this?" from a visitor, for the partner to look at. */
export const needReports = sqliteTable(
  "need_reports",
  {
    id: id(),
    needId: text("need_id")
      .notNull()
      .references(() => needs.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    note: text("note"),
    status: text("status").notNull().default("open"), // "open" | "dismissed" | "upheld"
    createdAt: now(),
  },
  (t) => [index("need_reports_need_idx").on(t.needId)],
);

/** What happened to a need and who did it, so a partner can account for it. */
export const needEvents = sqliteTable(
  "need_events",
  {
    id: id(),
    needId: text("need_id")
      .notNull()
      .references(() => needs.id, { onDelete: "cascade" }),
    /** The member's name at the time, or "A visitor". */
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    createdAt: now(),
  },
  (t) => [index("need_events_need_idx").on(t.needId)],
);

/** "Report a problem" from any page: what kind, where, and what they said. */
export const problemReports = sqliteTable(
  "problem_reports",
  {
    id: id(),
    kind: text("kind").notNull(),
    page: text("page").notNull(),
    note: text("note").notNull(),
    /** Only if they chose to leave a way to reach them. */
    contact: text("contact"),
    locale: text("locale").notNull(),
    status: text("status").notNull().default("open"), // "open" | "done"
    createdAt: now(),
  },
  (t) => [index("problem_reports_created_idx").on(t.createdAt)],
);

export type User = typeof users.$inferSelect;
export type Partner = typeof partners.$inferSelect;
export type Need = typeof needs.$inferSelect;
export type Pledge = typeof pledges.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type Liability = typeof liabilities.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type GivingRecord = typeof givingRecords.$inferSelect;
export type YearSnapshot = typeof yearSnapshots.$inferSelect;
