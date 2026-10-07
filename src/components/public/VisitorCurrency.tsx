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
  VISITOR_CURRENCY_KEY as KEY,
  currencyForLocale,
  parseDraft,
} from "@/lib/calculator";
import { currencyName } from "@/lib/currencies";
import { LOCALE_INFO, type Locale } from "@/i18n/config";

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

/**
 * Every currency as "Pakistani rupee (PKR)", in alphabetical order of the
 * name in the page's language: people know their money by its name sooner
 * than by its code.
 */
export function CurrencyOptions({ value, locale = "en" }: { value: string; locale?: Locale }) {
  const intl = LOCALE_INFO[locale].intl;
  const options = CALC_CURRENCIES.map((code) => ({ code, name: currencyName(code, locale) }));
  options.sort((a, b) => a.name.localeCompare(b.name, intl));
  const known = (CALC_CURRENCIES as readonly string[]).includes(value);
  return (
    <>
      {known ? null : <option value={value}>{value}</option>}
      {options.map(({ code, name }) => (
        <option key={code} value={code}>
          {name === code ? code : `${name} (${code})`}
        </option>
      ))}
    </>
  );
}

export function CurrencySelect({
  value,
  onChange,
  id = "tool-currency",
  label = "Currency",
  locale = "en",
}: {
  value: string;
  onChange: (code: string) => void;
  id?: string;
  label?: string;
  locale?: Locale;
}) {
  return (
    <div>
      <label className="label mb-1.5" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <CurrencyOptions value={value} locale={locale} />
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
