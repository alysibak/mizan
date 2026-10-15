"use client";

import { useState } from "react";
import {
  IconBalance,
  IconBox,
  IconCar,
  IconCash,
  IconFridge,
  IconJar,
  IconOwed,
  IconReceipt,
  IconShelf,
  IconShop,
} from "@/components/icons";
import { CurrencySelect, useVisitorCurrency } from "@/components/public/VisitorCurrency";
import { useMetalPrices } from "@/components/public/useMetalPrices";
import { BalanceScale } from "@/components/public/Visuals";
import { MoneyInput } from "@/components/ZakatCalculator";
import { parseAmount } from "@/lib/calculator";
import { formatMoney } from "@/lib/money";
import { shopZakat, type ShopFigures } from "@/lib/shop";

const INTL = "en-CA";

const COUNTED = [
  { label: "Goods for sale", Icon: IconBox },
  { label: "Cash in the till and bank", Icon: IconCash },
  { label: "Money customers owe you", Icon: IconOwed },
];
const NOT_COUNTED = [
  { label: "The shop itself", Icon: IconShop },
  { label: "Shelves and counters", Icon: IconShelf },
  { label: "Fridges and machines", Icon: IconFridge },
  { label: "Scales and tools", Icon: IconBalance },
  { label: "Your van or bike", Icon: IconCar },
];

const FIELDS: { key: keyof ShopFigures; label: string; hint: string; Icon: typeof IconBox; minus?: boolean }[] = [
  {
    key: "stock",
    label: "Goods on the shelves and in storage",
    hint: "What they would sell for today. Count once, on the same day each year.",
    Icon: IconBox,
  },
  { key: "cash", label: "Cash in the till and the shop’s bank account", hint: "", Icon: IconCash },
  {
    key: "owedToYou",
    label: "Money customers owe you",
    hint: "Only what you expect to be paid. Leave out debts you may never get back.",
    Icon: IconOwed,
  },
  {
    key: "personal",
    label: "Your own savings outside the shop",
    hint: "The nisab is for you, not the shop, so your savings count with it.",
    Icon: IconJar,
  },
  {
    key: "owedBySuppliers",
    label: "What you owe suppliers, due now",
    hint: "Taken off.",
    Icon: IconReceipt,
    minus: true,
  },
];

function Tile({ label, Icon, counted }: { label: string; Icon: typeof IconBox; counted: boolean }) {
  return (
    <li className="flex flex-col items-center gap-1.5 text-center">
      <span
        className={
          "relative flex h-14 w-14 items-center justify-center rounded-full border " +
          (counted ? "border-pine/40 bg-pine/5 text-pine" : "border-mist bg-paper text-sage")
        }
      >
        <Icon className="h-7 w-7" />
        <span
          className={
            "absolute -bottom-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-surface " +
            (counted ? "bg-pine" : "bg-danger")
          }
        >
          {counted ? "✓" : "✕"}
        </span>
      </span>
      <span className="text-xs leading-snug text-ink">{label}</span>
    </li>
  );
}

/**
 * Zakat for a small shop, in pictures: what counts and what does not, the
 * figures, and a scale against the nisab. Nothing is stored or sent.
 */
export default function ShopPlanner() {
  const [currency, setCurrency] = useVisitorCurrency();
  const [values, setValues] = useState<Record<keyof ShopFigures, string>>({
    stock: "",
    cash: "",
    owedToYou: "",
    personal: "",
    owedBySuppliers: "",
  });
  const [standard, setStandard] = useState<"silver" | "gold">("silver");
  const prices = useMetalPrices(currency);
  const nisab = prices.nisab[standard];
  const money = (n: number) => formatMoney(n, currency, INTL);
  const figures = Object.fromEntries(
    Object.entries(values).map(([k, v]) => [k, parseAmount(v, ".")]),
  ) as unknown as ShopFigures;
  const result = shopZakat(figures, nisab);

  return (
    <div className="space-y-6">
      <section className="card p-5 sm:p-6" aria-labelledby="shop-what">
        <h2 id="shop-what" className="font-serif text-2xl text-ink">
          What counts, and what does not
        </h2>
        <p className="mt-1 text-sm text-sage">
          What you sell, and the money it brings in, is counted. What you use to run the shop is not.
        </p>
        <ul className="mt-5 grid grid-cols-3 gap-3" aria-label="Counted">
          {COUNTED.map((t) => (
            <Tile key={t.label} {...t} counted />
          ))}
        </ul>
        <ul className="mt-5 grid grid-cols-3 gap-3 border-t border-mist pt-5 sm:grid-cols-5" aria-label="Not counted">
          {NOT_COUNTED.map((t) => (
            <Tile key={t.label} {...t} counted={false} />
          ))}
        </ul>
      </section>

      <section className="card space-y-5 p-5 sm:p-6" aria-labelledby="shop-figures">
        <h2 id="shop-figures" className="font-serif text-2xl text-ink">
          Your shop’s figures
        </h2>
        <div className="sm:max-w-xs">
          <CurrencySelect value={currency} onChange={setCurrency} label="Currency" />
        </div>
        <div className="space-y-4">
          {FIELDS.map(({ key, label, hint, Icon, minus }) => (
            <div key={key} className="flex items-start gap-3">
              <span
                className={
                  "mt-6 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border " +
                  (minus ? "border-danger/40 text-danger" : "border-pine/30 bg-pine/5 text-pine")
                }
                aria-hidden
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <MoneyInput
                  id={`shop-${key}`}
                  label={label}
                  currency={currency}
                  value={values[key]}
                  onChange={(v) => setValues((old) => ({ ...old, [key]: v }))}
                  intl={INTL}
                  decimal="."
                />
                {hint ? <p className="mt-1 text-xs leading-relaxed text-sage">{hint}</p> : null}
              </div>
            </div>
          ))}
        </div>
        <fieldset>
          <legend className="label mb-1.5">Nisab</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["silver", "gold"] as const).map((s) => (
              <label
                key={s}
                className={
                  "flex cursor-pointer gap-3 border px-3 py-2.5 transition " +
                  (standard === s ? "border-pine bg-pine/5" : "border-mist hover:border-sage")
                }
              >
                <input
                  type="radio"
                  name="shop-nisab"
                  checked={standard === s}
                  onChange={() => setStandard(s)}
                  className="mt-1 accent-[rgb(var(--c-pine))]"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">{s === "silver" ? "Silver (595 g)" : "Gold (85 g)"}</span>
                  <span className="block text-xs text-sage nums">
                    {prices.gold !== null
                      ? money(prices.nisab[s])
                      : prices.failed
                        ? "Today’s price could not be loaded"
                        : "Loading today’s price…"}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      {result.counted > 0 && nisab > 0 ? (
        <section className="card p-5 sm:p-6" aria-labelledby="shop-result" aria-live="polite">
          <BalanceScale net={result.net} nisab={nisab} money={money} labels={{ you: "Your shop, less debts", nisab: "Nisab" }} />
          <h2 id="shop-result" className="mt-4 text-center font-serif text-3xl text-ink">
            {result.due ? (
              <>
                Your zakat: <span className="text-pine nums">{money(result.zakat)}</span>
              </>
            ) : (
              "Below the nisab: no zakat this year"
            )}
          </h2>
          <p className="mt-2 text-center text-sm text-sage">
            {result.due
              ? "2.5% of what is counted, less what you owe suppliers. Most scholars ask for it in money; the Hanafi school also allows giving goods from the shop at their value."
              : "Count again on the same day next Islamic year."}
          </p>
        </section>
      ) : null}
    </div>
  );
}
