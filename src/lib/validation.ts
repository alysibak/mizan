import { z } from "zod";
import { CATEGORIES } from "./categories";

const categoryKeys = Object.keys(CATEGORIES) as [string, ...string[]];

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const assetSchema = z.object({
  category: z.enum(categoryKeys),
  label: z.string().trim().min(1, "Give this asset a name").max(120),
  amount: z.coerce.number().min(0, "Amount cannot be negative"),
  zakatablePortion: z.coerce.number().min(0).max(1).default(1),
});

export const liabilitySchema = z.object({
  label: z.string().trim().min(1, "Name this liability").max(120),
  amount: z.coerce.number().min(0, "Amount cannot be negative"),
  deductible: z.coerce.boolean().default(true),
});

export const givingSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than zero"),
  type: z.enum(["zakat", "sadaqah"]).default("sadaqah"),
  recipient: z.string().trim().max(120).optional(),
  note: z.string().trim().max(400).optional(),
  date: z.string().min(1, "Pick a date"),
});

export const settingsSchema = z.object({
  currency: z.string().trim().min(3).max(3),
  nisabStandard: z.enum(["gold", "silver"]),
  calendarBasis: z.enum(["lunar", "solar"]),
  goldPricePerGram: z.coerce.number().positive("Enter a gold price"),
  silverPricePerGram: z.coerce.number().positive("Enter a silver price"),
  hawlStartDate: z.string().optional().nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AssetInput = z.infer<typeof assetSchema>;
export type LiabilityInput = z.infer<typeof liabilitySchema>;
export type GivingInput = z.infer<typeof givingSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
