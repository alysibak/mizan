import type { ZakatResult } from "@/lib/zakat";

export interface SnapshotAsset {
  category: string;
  label: string;
  amount: number;
  zakatablePortion: number;
}

export interface SnapshotLiability {
  label: string;
  amount: number;
  deductible: boolean;
}

export interface SnapshotPayload {
  version: 1;
    settings: {
      currency: string;
      nisabStandard: string;
      calendarBasis: string;
      goldPricePerGram: number;
      silverPricePerGram: number;
      hawlStartDate: string | null;
      madhhab?: string;
    };
  assets: SnapshotAsset[];
  liabilities: SnapshotLiability[];
  result: Pick<
    ZakatResult,
    | "grossZakatable"
    | "deductibleLiabilities"
    | "netZakatable"
    | "nisab"
    | "goldNisab"
    | "silverNisab"
    | "rate"
    | "basis"
    | "zakatDue"
    | "isDue"
    | "marginToNisab"
  >;
  givingYtd: {
    year: number;
    zakat: number;
    sadaqah: number;
    purification: number;
    /** Present on freezes after payment-window honesty pass. */
    windowKind?: "hawl" | "gregorian";
    windowStart?: string;
    windowEnd?: string;
    windowLabel?: string;
  };
  /** Optional letter sealed for next year’s self. */
  letterToNextYear?: string | null;
};

export function parseSnapshotPayload(raw: string): SnapshotPayload | null {
  try {
    const data = JSON.parse(raw) as SnapshotPayload;
    if (data?.version !== 1 || !data.result) return null;
    return data;
  } catch {
    return null;
  }
}
