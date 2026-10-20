"use client";

import Link from "next/link";
import {
  IconBalance,
  IconBank,
  IconBox,
  IconCar,
  IconCash,
  IconFridge,
  IconOwed,
  IconReceipt,
  IconShelf,
  IconShop,
} from "@/components/icons";
import { CurrencySelect, useVisitorCurrency } from "@/components/public/VisitorCurrency";
import { useMetalPrices } from "@/components/public/useMetalPrices";
import { BalanceScale } from "@/components/public/Visuals";
import { useMyDraft } from "@/components/public/useMyDraft";
import { MoneyInput } from "@/components/ZakatCalculator";
import { formatMoney } from "@/lib/money";

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

/** The shop's figures are the visitor's own figures: the same ones the calculator keeps. */
type ShopField = "business" | "cash" | "bank" | "receivables" | "debts";

const FIELDS: { key: ShopField; label: string; hint: string; Icon: typeof IconBox; minus?: boolean }[] = [
  {
    key: "business",
    label: "Goods on the shelves and in storage",
    hint: "What they would sell for today. Count once, on the same day each year.",
    Icon: IconBox,
  },
  { key: "cash", label: "Cash: in the till and at home", hint: "", Icon: IconCash },
  { key: "bank", label: "Bank: the shop’s account and your own", hint: "Leave out any interest the bank paid.", Icon: IconBank },
  {
    key: "receivables",
    label: "Money customers owe you",
    hint: "Only what you expect to be paid. Leave out debts you may never get back.",
    Icon: IconOwed,
  },
  {
    key: "debts",
    label: "What you owe now: suppliers and other debts due",
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
 * Zakat for a small shop, in pictures: what counts and what does not, then
 * the figures. They are the visitor's own figures, shared with the
 * calculator and My zakat, so the answer is their whole zakat, shop
 * included, and nothing is counted twice.
 */
export default function ShopPlanner() {
  const [visitorCurrency, setVisitorCurrency] = useVisitorCurrency();
  const { draft, outcome, started, update } = useMyDraft(visitorCurrency);
  const currency = draft.currency;
  const prices = useMetalPrices(currency);
  const money = (n: number) => formatMoney(n, currency, INTL);
  const { result, needsPrices } = outcome;
  const nisab = result.nisab;
  const value = (key: ShopField) => (key === "debts" ? draft.debts : (draft.amounts[key] ?? ""));
  const set = (key: ShopField, v: string) =>
    update(key === "debts" ? { debts: v } : { amounts: { ...draft.amounts, [key]: v } });
  // Other things already entered elsewhere (gold, shares…), counted in the same answer.
  const SHOP = new Set<string>(["business_inventory", "cash", "bank", "receivables"]);
  const others = outcome.lines.filter((l) => !SHOP.has(l.category));

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
          <CurrencySelect
            value={currency}
            onChange={(c) => {
              setVisitorCurrency(c);
              // Another currency's prices would be wrong: today's are fetched for the new one.
              update({ currency: c, goldPrice: "", silverPrice: "", pricesAsOf: null });
            }}
            label="Currency"
          />
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
                  value={value(key)}
                  onChange={(v) => set(key, v)}
                  intl={INTL}
                  decimal={draft.decimal ?? "."}
                />
                {hint ? <p className="mt-1 text-xs leading-relaxed text-sage">{hint}</p> : null}
              </div>
            </div>
          ))}
        </div>
        {others.length ? (
          <div className="border-s-2 border-brass ps-3 text-sm">
            <p className="font-medium text-ink">Also counted, from your other answers</p>
            <ul className="mt-1 space-y-0.5 text-sage">
              {others.map((l) => (
                <li key={l.key} className="flex justify-between gap-3">
                  <span>{l.label}</span>
                  <span className="nums">{money(l.amount * l.zakatablePortion)}</span>
                </li>
              ))}
            </ul>
            <Link href="/calculator" className="mt-1 inline-block font-medium text-pine hover:underline">
              Change these in the calculator
            </Link>
          </div>
        ) : null}
        <fieldset>
          <legend className="label mb-1.5">Nisab</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["silver", "gold"] as const).map((s) => (
              <label
                key={s}
                className={
                  "flex cursor-pointer gap-3 border px-3 py-2.5 transition " +
                  (draft.standard === s ? "border-pine bg-pine/5" : "border-mist hover:border-sage")
                }
              >
                <input
                  type="radio"
                  name="shop-nisab"
                  checked={draft.standard === s}
                  onChange={() => update({ standard: s })}
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

      {started && !needsPrices ? (
        <section className="card p-5 sm:p-6" aria-labelledby="shop-result" aria-live="polite">
          <BalanceScale
            net={result.netZakatable}
            nisab={nisab}
            money={money}
            labels={{ you: "All you own, less debts", nisab: "Nisab" }}
          />
          <h2 id="shop-result" className="mt-4 text-center font-serif text-3xl text-ink">
            {result.isDue ? (
              <>
                Your zakat: <span className="text-pine nums">{money(result.zakatDue)}</span>
              </>
            ) : (
              "Below the nisab: no zakat this year"
            )}
          </h2>
          <p className="mt-2 text-center text-sm text-sage">
            {result.isDue
              ? "This is all your zakat, your shop included. Most scholars ask for it in money; the Hanafi school also allows giving goods from the shop at their value."
              : "Count again on the same day next Islamic year."}
          </p>
          <p className="mt-4 text-center">
            <Link href="/my" className="font-medium text-pine hover:underline">
              Saved in My zakat: track what you give →
            </Link>
          </p>
        </section>
      ) : null}
    </div>
  );
}
