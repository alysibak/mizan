"use client";

import { useEffect, useState } from "react";
import { useHydrated } from "@/lib/client-store";
import { NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS } from "@/lib/nisab";

type Fetched = { currency: string; gold: number; silver: number } | { currency: string; error: true };

export interface MetalPrices {
  /** Per gram of pure metal, in `currency`; null until loaded or if it failed. */
  gold: number | null;
  silver: number | null;
  /** The two nisabs in money, or 0 while unknown. */
  nisab: { silver: number; gold: number };
  failed: boolean;
}

/** Today's gold and silver prices in a currency, fetched in the browser. */
export function useMetalPrices(currency: string): MetalPrices {
  const hydrated = useHydrated();
  const [fetched, setFetched] = useState<Fetched | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    let current = true;
    fetch(`/api/metals?currency=${encodeURIComponent(currency)}`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((data: { goldPricePerGram?: number; silverPricePerGram?: number } | null) => {
        if (!current) return;
        setFetched(
          data?.goldPricePerGram && data.silverPricePerGram
            ? { currency, gold: data.goldPricePerGram, silver: data.silverPricePerGram }
            : { currency, error: true },
        );
      });
    return () => {
      current = false;
    };
  }, [currency, hydrated]);

  const known = fetched && fetched.currency === currency && !("error" in fetched) ? fetched : null;
  return {
    gold: known?.gold ?? null,
    silver: known?.silver ?? null,
    nisab: known
      ? { silver: NISAB_SILVER_GRAMS * known.silver, gold: NISAB_GOLD_GRAMS * known.gold }
      : { silver: 0, gold: 0 },
    failed: Boolean(fetched && fetched.currency === currency && "error" in fetched),
  };
}
