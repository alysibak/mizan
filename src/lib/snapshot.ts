import { z } from "zod";

const num = z.number().finite();

const snapshotAssetSchema = z.object({
  category: z.string().max(40),
  label: z.string().max(200),
  amount: num,
  zakatablePortion: num,
});

const snapshotLiabilitySchema = z.object({
  label: z.string().max(200),
  amount: num,
  deductible: z.boolean(),
});

/**
 * A frozen reckoning. Parsed with a schema, not a cast, because payloads also
 * arrive through backup restore and must not be able to break the pages that
 * render them.
 */
export const snapshotPayloadSchema = z.object({
  version: z.literal(1),
  settings: z.object({
    currency: z.string().max(3),
    nisabStandard: z.string().max(10),
    calendarBasis: z.string().max(10),
    goldPricePerGram: num,
    silverPricePerGram: num,
    hawlStartDate: z.string().max(10).nullable(),
    madhhab: z.string().max(20).optional(),
  }),
  assets: z.array(snapshotAssetSchema).max(2000),
  liabilities: z.array(snapshotLiabilitySchema).max(2000),
  result: z.object({
    grossZakatable: num,
    deductibleLiabilities: num,
    netZakatable: num,
    nisab: num,
    goldNisab: num,
    silverNisab: num,
    rate: num,
    basis: z.enum(["lunar", "solar"]),
    zakatDue: num,
    isDue: z.boolean(),
    marginToNisab: num,
  }),
  givingYtd: z.object({
    year: z.number().int(),
    zakat: num,
    sadaqah: num,
    purification: num,
    /** Present on freezes since Zakat al-Fitr was tracked separately. */
    fitr: num.optional(),
    /** Present on freezes after payment-window honesty pass. */
    windowKind: z.enum(["hawl", "gregorian"]).optional(),
    /** The cycle this freeze closed (hawl start or 1 Jan). Newer freezes only. */
    cycleStart: z.string().max(10).optional(),
    windowStart: z.string().max(10).optional(),
    windowEnd: z.string().max(10).optional(),
    windowLabel: z.string().max(80).optional(),
  }),
  /** Optional letter sealed for next year’s self. */
  letterToNextYear: z.string().max(2000).nullish(),
});

export type SnapshotPayload = z.infer<typeof snapshotPayloadSchema>;
export type SnapshotAsset = SnapshotPayload["assets"][number];
export type SnapshotLiability = SnapshotPayload["liabilities"][number];

export function parseSnapshotPayload(raw: string): SnapshotPayload | null {
  try {
    const parsed = snapshotPayloadSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
