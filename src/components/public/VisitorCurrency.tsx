"use client";

import Link from "next/link";
import {
  readStoredValue,
  setStoredValue,
  useHydrated,
  useStoredValue,
} from "@/lib/client-store";
import {
  CALC_CURRENCIES,
  CALC_STORAGE_KEY,
  currencyForLocale,
  parseDraft,
} from "@/lib/calculator";
import { currencyName } from "@/lib/currencies";

const KEY = "mizan-visitor-currency";

/**
 * The currency a visitor without an account works in: the one they last
 * picked on a tool, else the calculator's, else their browser region's. Kept
 * in this browser only. USD during the server render.
 */
export function useVisitorCurrency(): [string, (code: string) => void] {
  const hydrated = useHydrated();
  const picked = useStoredValue(KEY);
  let currency = "USD";
  if (picked && /^[A-Z]{3}$/.test(picked)) currency = picked;
  else if (hydrated) {
    currency =
      parseDraft(readStoredValue(CALC_STORAGE_KEY))?.currency ??
      currencyForLocale(navigator.language);
  }
  return [currency, (code) => setStoredValue(KEY, code)];
}

export function CurrencySelect({
  value,
  onChange,
  id = "tool-currency",
}: {
  value: string;
  onChange: (code: string) => void;
  id?: string;
}) {
  const known = (CALC_CURRENCIES as readonly string[]).includes(value);
  return (
    <div>
      <label className="label mb-1.5" htmlFor={id}>
        Currency
      </label>
      <select
        id={id}
        className="field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {known ? null : <option value={value}>{value}</option>}
        {CALC_CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {code} · {currencyName(code)}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Where a signed-in tool offers "Record on Give", a visitor gets this. */
export function KeepRecordNudge({ what }: { what: string }) {
  return (
    <p className="text-sm leading-relaxed text-sage">
      <Link href="/register" className="font-medium text-pine hover:underline">
        Open a free ledger
      </Link>{" "}
      to keep {what} on record beside your zakat, with a statement at the end of
      the year.
    </p>
  );
}
