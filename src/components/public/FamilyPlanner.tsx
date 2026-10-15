"use client";

import { IconChild, IconUsers } from "@/components/icons";
import { CurrencySelect, useVisitorCurrency } from "@/components/public/VisitorCurrency";
import { BalanceScale } from "@/components/public/Visuals";
import { MoneyInput } from "@/components/ZakatCalculator";
import { parseAmount } from "@/lib/calculator";
import { setStoredValue, useStoredValue } from "@/lib/client-store";
import { useMetalPrices } from "@/components/public/useMetalPrices";
import { familyZakat } from "@/lib/family";
import { KARAT_PURITY, TOLA_GRAMS, usesTola } from "@/lib/metals";
import { formatMoney } from "@/lib/money";

const INTL = "en-CA";
const KEY = "mizan-family-v1";
const MAX_PEOPLE = 12;
const GOLD_KARATS = KARAT_PURITY.filter((k) => k.purity !== 0.925);

type Relation = "me" | "spouse" | "son" | "daughter" | "mother" | "father" | "other";

const RELATIONS: { key: Relation; label: string; child?: boolean }[] = [
  { key: "me", label: "Me" },
  { key: "spouse", label: "Wife or husband" },
  { key: "son", label: "Son", child: true },
  { key: "daughter", label: "Daughter", child: true },
  { key: "mother", label: "Mother" },
  { key: "father", label: "Father" },
  { key: "other", label: "Someone else" },
];
const LABEL = Object.fromEntries(RELATIONS.map((r) => [r.key, r.label])) as Record<Relation, string>;
/** How each is named inside a sentence when no name was typed. */
const SAY: Record<Relation, string> = {
  me: "you",
  spouse: "your wife or husband",
  son: "your son",
  daughter: "your daughter",
  mother: "your mother",
  father: "your father",
  other: "this person",
};
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const and = (items: string[]) => new Intl.ListFormat("en", { type: "conjunction" }).format(items);

interface Member {
  id: string;
  who: Relation;
  name: string;
  cash: string;
  gold: string;
  purity: string;
  debts: string;
}

interface Family {
  members: Member[];
  standard: "silver" | "gold";
  unit: "g" | "tola" | null;
}

const text = (x: unknown, max = 40) => (typeof x === "string" ? x.slice(0, max) : "");

function newMember(who: Relation, n: number): Member {
  return { id: `${who}-${n}`, who, name: "", cash: "", gold: "", purity: "0.916", debts: "" };
}

const START: Family = { members: [newMember("me", 0)], standard: "silver", unit: null };

/** What this browser kept, or a family of one if nothing (or nonsense) was. */
function parseFamily(raw: string | null): Family {
  if (!raw) return START;
  try {
    const v = JSON.parse(raw) as Partial<Family>;
    const members = Array.isArray(v.members)
      ? v.members.slice(0, MAX_PEOPLE).map((m, i) => ({
          id: text(m?.id) || `p-${i}`,
          who: RELATIONS.some((r) => r.key === m?.who) ? (m.who as Relation) : "other",
          name: text(m?.name),
          cash: text(m?.cash),
          gold: text(m?.gold),
          purity: GOLD_KARATS.some((k) => String(k.purity) === m?.purity) ? (m.purity as string) : "0.916",
          debts: text(m?.debts),
        }))
      : [];
    return {
      members: members.length ? members : START.members,
      standard: v.standard === "gold" ? "gold" : "silver",
      unit: v.unit === "g" || v.unit === "tola" ? v.unit : null,
    };
  } catch {
    return START;
  }
}

/**
 * Zakat for a household, one person at a time: each person's cash, gold, and
 * debts against the nisab on their own, with a scale each, and a warning
 * when adding everyone together would give the wrong answer. Kept in this
 * browser only.
 */
export default function FamilyPlanner() {
  const [currency, setCurrency] = useVisitorCurrency();
  const family = parseFamily(useStoredValue(KEY));
  const save = (next: Family) => setStoredValue(KEY, JSON.stringify(next));
  const prices = useMetalPrices(currency);
  const known = prices.gold !== null;
  const nisab = prices.nisab[family.standard];
  const unit = family.unit ?? (usesTola(currency) ? "tola" : "g");
  const money = (n: number) => formatMoney(n, currency, INTL);
  const amount = (s: string) => parseAmount(s, ".");

  const result = familyZakat(
    family.members.map((m) => ({
      cash: amount(m.cash),
      goldGrams: amount(m.gold) * (unit === "tola" ? TOLA_GRAMS : 1),
      goldPurity: Number(m.purity),
      debts: amount(m.debts),
    })),
    prices.gold ?? 0,
    nisab,
  );
  const nameOf = (m: Member) => m.name.trim() || LABEL[m.who];
  const say = (m: Member) => m.name.trim() || SAY[m.who];
  const isYou = (m: Member) => !m.name.trim() && m.who === "me";

  function change(id: string, patch: Partial<Member>) {
    save({ ...family, members: family.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  }
  function add(who: Relation) {
    if (family.members.length >= MAX_PEOPLE) return;
    const n = Math.max(0, ...family.members.map((m) => Number(m.id.split("-").pop()) || 0)) + 1;
    save({ ...family, members: [...family.members, newMember(who, n)] });
  }
  function remove(id: string) {
    save({ ...family, members: family.members.filter((m) => m.id !== id) });
  }

  const hasChild = family.members.some((m) => RELATIONS.find((r) => r.key === m.who)?.child);
  const owing = family.members.filter((_, i) => result.people[i].due);
  const underAlone = family.members.filter((_, i) => result.people[i].net > 0 && !result.people[i].due);

  return (
    <div className="space-y-6">
      <section className="card space-y-4 p-5 sm:p-6" aria-labelledby="family-prices">
        <h2 id="family-prices" className="sr-only">
          Currency and nisab
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <CurrencySelect value={currency} onChange={setCurrency} label="Currency" />
          <fieldset>
            <legend className="label mb-1.5">Weigh gold in</legend>
            <div className="flex gap-2">
              {(["g", "tola"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  aria-pressed={unit === u}
                  onClick={() => save({ ...family, unit: u })}
                  className={
                    "min-h-[44px] flex-1 border px-3 text-sm transition " +
                    (unit === u ? "border-pine bg-pine/5 font-medium text-pine" : "border-mist text-ink hover:border-sage")
                  }
                >
                  {u === "g" ? "grams" : "tola"}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        <fieldset>
          <legend className="label mb-1.5">Nisab</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["silver", "gold"] as const).map((s) => (
              <label
                key={s}
                className={
                  "flex cursor-pointer gap-3 border px-3 py-2.5 transition " +
                  (family.standard === s ? "border-pine bg-pine/5" : "border-mist hover:border-sage")
                }
              >
                <input
                  type="radio"
                  name="family-nisab"
                  checked={family.standard === s}
                  onChange={() => save({ ...family, standard: s })}
                  className="mt-1 accent-[rgb(var(--c-pine))]"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">
                    {s === "silver" ? "Silver (595 g)" : "Gold (85 g)"}
                  </span>
                  <span className="block text-xs text-sage nums">
                    {known
                      ? money(prices.nisab[s])
                      : prices.failed
                        ? "Today’s price could not be loaded"
                        : "Loading today’s price…"}
                    {s === "silver" ? " · the lower, more cautious one" : ""}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <p className="text-sm leading-relaxed text-sage">
        Put each person’s own things on their own card: a wife’s jewellery and mahr are hers, a son’s savings are
        his. Count gold jewellery too if you follow the Hanafi school; most other scholars leave out jewellery that
        is worn.
      </p>

      <ul className="grid gap-4 sm:grid-cols-2">
        {family.members.map((m, i) => {
          const r = result.people[i];
          const child = RELATIONS.find((x) => x.key === m.who)?.child;
          const Icon = child ? IconChild : IconUsers;
          return (
            <li key={m.id} className="card flex flex-col gap-3 p-4" aria-label={nameOf(m)}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-pine/30 bg-pine/5 text-pine" aria-hidden>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <label htmlFor={`${m.id}-name`} className="block text-xs text-sage">
                    {LABEL[m.who]}
                  </label>
                  <input
                    id={`${m.id}-name`}
                    type="text"
                    autoComplete="off"
                    placeholder={m.who === "me" ? "Your name (optional)" : "Name (optional)"}
                    className="w-full border-0 border-b border-mist bg-transparent px-0 py-0.5 text-base font-medium text-ink focus:border-pine focus:outline-none focus:ring-0"
                    value={m.name}
                    onChange={(e) => change(m.id, { name: e.target.value.slice(0, 40) })}
                  />
                </div>
                {family.members.length > 1 ? (
                  <button
                    type="button"
                    className="flex h-10 w-10 shrink-0 items-center justify-center text-xl text-sage hover:text-ink"
                    onClick={() => remove(m.id)}
                    aria-label={`Remove ${nameOf(m)}`}
                  >
                    ×
                  </button>
                ) : null}
              </div>
              <MoneyInput
                id={`${m.id}-cash`}
                label="Cash and savings"
                currency={currency}
                value={m.cash}
                onChange={(v) => change(m.id, { cash: v })}
                intl={INTL}
                decimal="."
              />
              <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2">
                <div>
                  <label className="label mb-1.5" htmlFor={`${m.id}-gold`}>
                    Gold, in {unit === "g" ? "grams" : "tola"}
                  </label>
                  <input
                    id={`${m.id}-gold`}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0"
                    className="field nums"
                    value={m.gold}
                    onChange={(e) => change(m.id, { gold: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label mb-1.5" htmlFor={`${m.id}-purity`}>
                    Karat
                  </label>
                  <select
                    id={`${m.id}-purity`}
                    className="field px-2 text-sm"
                    value={m.purity}
                    onChange={(e) => change(m.id, { purity: e.target.value })}
                  >
                    {GOLD_KARATS.map((k) => (
                      <option key={k.purity} value={String(k.purity)}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <MoneyInput
                id={`${m.id}-debts`}
                label="Debts due now"
                currency={currency}
                value={m.debts}
                onChange={(v) => change(m.id, { debts: v })}
                intl={INTL}
                decimal="."
              />
              {known && r.owns > 0 ? (
                <div className="mt-auto flex items-center gap-3 border-t border-mist pt-3" aria-live="polite">
                  <div className="w-28 shrink-0">
                    <BalanceScale net={r.net} nisab={nisab} money={money} labels={{ you: "Has", nisab: "Nisab" }} bare />
                  </div>
                  <p className="text-sm">
                    {r.due ? (
                      <>
                        <span className="block font-serif text-xl text-pine nums">{money(r.zakat)}</span>
                        <span className="text-sage">
                          {isYou(m) ? "You owe this, from your own money." : `${capital(say(m))} owes this, from their own money.`}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="block font-medium text-ink">Under the nisab</span>
                        <span className="text-sage">
                          Nothing to pay on what is {isYou(m) ? "yours" : "theirs"} alone.
                        </span>
                      </>
                    )}
                  </p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {family.members.length < MAX_PEOPLE ? (
        <div>
          <p className="label mb-2">Add someone</p>
          <div className="flex flex-wrap gap-2">
            {RELATIONS.filter((r) => r.key !== "me").map((r) => (
              <button
                key={r.key}
                type="button"
                className="flex min-h-[44px] items-center gap-2 border border-mist px-3 text-sm text-ink transition hover:border-pine"
                onClick={() => add(r.key)}
              >
                <span aria-hidden className="text-pine">
                  +
                </span>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {known && result.pooled > 0 ? (
        <section className="card space-y-3 p-5 sm:p-6" aria-labelledby="family-total" aria-live="polite">
          <h2 id="family-total" className="font-serif text-2xl text-ink">
            {result.total > 0 ? (
              <>
                Your family gives <span className="text-pine nums">{money(result.total)}</span>
              </>
            ) : (
              "No one in your family owes zakat"
            )}
          </h2>
          {owing.length ? (
            <ul className="space-y-1 text-sm">
              {owing.map((m) => {
                const i = family.members.indexOf(m);
                return (
                  <li key={m.id} className="flex justify-between gap-3 border-b border-mist py-1.5">
                    <span className="text-ink">{capital(say(m))}</span>
                    <span className="font-medium text-pine nums">{money(result.people[i].zakat)}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {result.poolingMisleads ? (
            <p className="border-s-2 border-brass ps-3 text-sm leading-relaxed text-ink">
              Added together, your family has <span className="nums">{money(result.pooled)}</span>, over the nisab.
              But zakat is counted for each person on what is theirs, and on their own,{" "}
              {and(underAlone.map(say))} {underAlone.length === 1 && !isYou(underAlone[0]) ? "is" : "are"} under the
              nisab.
            </p>
          ) : null}
          <p className="text-xs leading-relaxed text-sage">
            Each person pays from their own money. Someone else, a husband or a father, can pay it for them as a
            gift, with their knowledge.
          </p>
          {hasChild ? (
            <p className="text-xs leading-relaxed text-sage">
              A child’s own money: most scholars say zakat is due on it, paid by the parent from the child’s money.
              The Hanafi school says it is not due until the child is grown.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
