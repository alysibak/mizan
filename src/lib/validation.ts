import { z } from "zod";
import { CATEGORIES } from "./categories";
import { ASNAF_KEYS } from "./asnaf";
import { GIVING_TYPES } from "./giving";
import { MADHHABS } from "./madhhab";
import { isIsoDay } from "./dates";
import { isValidTimeZone } from "./today";
import { toCents } from "./money";

const categoryKeys = Object.keys(CATEGORIES) as [string, ...string[]];

/** Largest single figure accepted. Keeps sums finite and catches typos. */
export const MAX_AMOUNT = 1e12;

// Form posts send numbers as strings, and an empty field as "". Treat "" as
// missing rather than letting z.coerce turn it into 0.
function numeric(schema: z.ZodNumber) {
  return z.preprocess((v) => {
    if (typeof v === "string") {
      const t = v.trim();
      return t === "" ? undefined : Number(t);
    }
    return v;
  }, schema);
}

// Money is stored to the cent, so 10.005 is saved as 10.01.
const amount = (message: string) =>
  numeric(
    z
      .number({ required_error: message, invalid_type_error: message })
      .finite(message)
      .min(0, "Amount cannot be negative")
      .max(MAX_AMOUNT, "That amount is too large"),
  ).transform(toCents);

const positive = (message: string, max = MAX_AMOUNT) =>
  numeric(
    z
      .number({ required_error: message, invalid_type_error: message })
      .finite(message)
      .positive(message)
      .max(max, "That figure is too large"),
  );

const positiveCents = (message: string) =>
  positive(message).transform(toCents).refine((v) => v > 0, message);

// z.coerce.boolean() turns the string "false" into true.
const boolish = z.preprocess((v) => {
  if (v === "true" || v === "on" || v === "1" || v === 1) return true;
  if (v === "false" || v === "off" || v === "0" || v === 0) return false;
  return v;
}, z.boolean());

/** Required calendar day, YYYY-MM-DD. */
export const isoDaySchema = z
  .string()
  .trim()
  .refine(isIsoDay, "Use a real date (YYYY-MM-DD)");

/** Optional calendar day; "" and null both mean "not set". */
const optionalDay = z
  .union([isoDaySchema, z.literal("")])
  .nullish()
  .transform((v) => v || null);

/** Optional free text; blank becomes null so the database never stores "". */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

// Unlike the day/text helpers, an omitted timestamp stays undefined so a
// partial settings save does not clear it.
const optionalTimestamp = z
  .union([z.string().datetime({ offset: true }), z.literal("")])
  .nullish()
  .transform((v) => (v === "" ? null : v));

export const timeZoneSchema = z
  .string()
  .trim()
  .max(64)
  .refine(isValidTimeZone, "Unknown time zone");

export const currencySchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{3}$/, "Use a three-letter currency code")
  .transform((v) => v.toUpperCase());

// bcrypt only reads the first 72 bytes of a password.
const newPassword = z
  .string()
  .min(8, "Use at least 8 characters")
  .refine(
    (v) => new TextEncoder().encode(v).length <= 72,
    "Use at most 72 characters",
  );

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().max(254).email("Enter a valid email"),
  password: newPassword,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email("Enter a valid email"),
  password: z.string().min(1, "Enter your password").max(1000),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password").max(1000),
  newPassword,
});

export const recoverSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email("Enter a valid email"),
  code: z.string().trim().min(10, "Enter your recovery code").max(64),
  newPassword,
});

export const resetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email("Enter a valid email"),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(20, "This link is incomplete").max(64),
  newPassword,
});

export const emailRemindersSchema = z.object({
  reminders: z.boolean(),
});

const totpCode = z
  .string()
  .transform((v) => v.replace(/\s/g, ""))
  .pipe(z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your app"));

export const twoFactorLoginSchema = z.object({
  ticket: z.string().trim().min(20).max(64),
  code: totpCode,
});

export const twoFactorConfirmSchema = z.object({
  password: z.string().min(1, "Enter your password").max(1000),
  code: totpCode,
});

export const twoFactorDisableSchema = z.object({
  password: z.string().min(1, "Enter your password").max(1000),
  code: totpCode,
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password").max(1000),
});

export const assetSchema = z.object({
  category: z.enum(categoryKeys),
  label: z.string().trim().min(1, "Give this asset a name").max(120),
  amount: amount("Enter the value"),
  zakatablePortion: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    numeric(
      z
        .number({ invalid_type_error: "Use a portion from 0 to 1" })
        .finite()
        .min(0, "Use a portion from 0 to 1")
        .max(1, "Use a portion from 0 to 1"),
    ).default(1),
  ),
  hawlStartDate: optionalDay,
  note: optionalText(400),
  /** Weight in grams, for gold, silver, and jewellery valued from settings prices. */
  grams: numeric(z.number().finite().positive().max(1e7)).nullish(),
  /** Fineness 0..1 (e.g. 0.916 for 22k). Used with grams. */
  purity: numeric(z.number().finite().positive().max(1)).nullish(),
  /** Which price a weighed jewellery holding follows. */
  metal: z.enum(["gold", "silver"]).nullish(),
  /** A holding kept in another currency, converted at the user's own rate. */
  foreignCurrency: z
    .union([currencySchema, z.literal("")])
    .nullish()
    .transform((v) => v || null),
  foreignAmount: z
    .preprocess((v) => (v === "" ? null : v), amount("Enter the amount").nullish()),
  /** Units of the base currency for one unit of the foreign currency. */
  fxRate: numeric(z.number().finite().positive("Enter the exchange rate").max(1e7)).nullish(),
});

export const liabilitySchema = z.object({
  label: z.string().trim().min(1, "Name this liability").max(120),
  amount: amount("Enter the amount"),
  deductible: boolish.default(true),
});

export const givingSchema = z.object({
  amount: positiveCents("Enter an amount greater than zero"),
  type: z.enum(GIVING_TYPES).default("sadaqah"),
  asnaf: z.enum(ASNAF_KEYS).nullish(),
  recipient: optionalText(120),
  note: optionalText(400),
  date: isoDaySchema,
});

/** Today's metal prices, saved in one tap from the balance page. */
export const metalPricesSchema = z.object({
  goldPricePerGram: positive("Enter a gold price", 1e7),
  silverPricePerGram: positive("Enter a silver price", 1e7),
});

export const settingsSchema = z.object({
  currency: currencySchema,
  nisabStandard: z.enum(["gold", "silver"]),
  calendarBasis: z.enum(["lunar", "solar"]),
  goldPricePerGram: positive("Enter a gold price", 1e7),
  silverPricePerGram: positive("Enter a silver price", 1e7),
  hawlStartDate: optionalDay,
  madhhab: z.enum(MADHHABS).default("general"),
  setupComplete: z.boolean().optional(),
  trustedAckAt: optionalTimestamp,
  metalsUpdatedAt: optionalTimestamp,
  /** Reconfirm metal prices without changing the numbers (clears aged stale). */
  touchMetals: z.boolean().optional(),
  /** Omitted means "leave as is", so older clients keep working. */
  hijriCalendar: z.enum(["tabular", "umalqura"]).optional(),
  timezone: timeZoneSchema.optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AssetInput = z.infer<typeof assetSchema>;
export type LiabilityInput = z.infer<typeof liabilitySchema>;
export type GivingInput = z.infer<typeof givingSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;

/** First human-readable message from a failed parse. */
export function firstIssue(error: z.ZodError, fallback = "Invalid input"): string {
  return error.issues[0]?.message ?? fallback;
}
