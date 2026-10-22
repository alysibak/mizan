"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CurrencySelect, useVisitorCurrency } from "@/components/public/VisitorCurrency";
import ShareButton, { type ShareLabels } from "@/components/public/ShareButton";
import { MoneyInput } from "@/components/ZakatCalculator";
import { IconOpenHand, IconOwed } from "@/components/icons";
import { CALC_STORAGE_KEY, emptyDraft, parseAmount, parseDraft } from "@/lib/calculator";
import { readStoredValue, setStoredValue, useHydrated, useStoredValue } from "@/lib/client-store";
import { hawlCalendar } from "@/lib/ics";
import { formatMoney } from "@/lib/money";
import {
  DEBTS_KEY,
  debtTotals,
  dueState,
  leftOn,
  newNote,
  noteText,
  parseDebts,
  payPart,
  serializeDebts,
  type DebtKind,
  type DebtNote,
} from "@/lib/debts";

const INTL = "en-CA";

/**
 * Who owes you, and who you owe, written down in seconds: two big buttons,
 * an amount, and a note ready to send to the other person. Kept on this
 * phone only; sending the note is the visitor's own choice.
 */
export default function DebtsHelper({ share }: { share: ShareLabels }) {
  const hydrated = useHydrated();
  const [currency, setCurrency] = useVisitorCurrency();
  const notes = parseDebts(useStoredValue(DEBTS_KEY));
  const save = (next: DebtNote[]) => setStoredValue(DEBTS_KEY, serializeDebts(next));
  const [adding, setAdding] = useState<DebtKind | null>(null);
  const [justSaved, setJustSaved] = useState<string | null>(null);
  const [changingCurrency, setChangingCurrency] = useState(false);
  const money = (n: number) => formatMoney(n, currency, INTL);
  const totals = debtTotals(notes);
  const today = new Date();
  const open = notes.filter((n) => leftOn(n) > 0);
  const settled = notes.filter((n) => leftOn(n) <= 0);
  const saved = notes.find((n) => n.id === justSaved) ?? null;

  function update(id: string, change: (n: DebtNote) => DebtNote | null) {
    save(
      notes.flatMap((n) => {
        if (n.id !== id) return [n];
        const changed = change(n);
        return changed ? [changed] : [];
      }),
    );
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="debts-add" className="space-y-4">
        <h2 id="debts-add" className="sr-only">
          Write it down
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <BigChoice
            on={adding === "lent"}
            label="Someone owes me"
            Icon={IconOwed}
            onClick={() => {
              setAdding("lent");
              setJustSaved(null);
            }}
          />
          <BigChoice
            on={adding === "borrowed"}
            label="I owe someone"
            Icon={IconOpenHand}
            onClick={() => {
              setAdding("borrowed");
              setJustSaved(null);
            }}
          />
        </div>

        {adding ? (
          <AddForm
            kind={adding}
            currency={currency}
            onCancel={() => setAdding(null)}
            onSave={(fields) => {
              const { id, ...rest } = fields;
              const note = newNote({ kind: adding, ...rest }, new Date(), id);
              save([note, ...notes]);
              setAdding(null);
              setJustSaved(note.id);
            }}
          />
        ) : null}

        {saved ? (
          <div className="border-2 border-pine/40 bg-pine/5 p-4" role="status">
            <p className="font-serif text-xl text-ink">Written down.</p>
            <p className="mt-1 text-base text-sage">
              Send it to {saved.who || "them"} too, so you both remember the same thing.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <ShareButton
                label={`Send it to ${saved.who || "them"}`}
                text={noteText(saved, money)}
                path="/debts"
                labels={share}
              />
              {saved.due ? <RemindButton note={saved} money={money} /> : null}
            </div>
          </div>
        ) : null}

        {hydrated ? (
          <p className="text-sm text-sage">
            Amounts in {currency}.{" "}
            <button
              type="button"
              className="text-pine underline underline-offset-2"
              onClick={() => setChangingCurrency((c) => !c)}
              aria-expanded={changingCurrency}
            >
              Change
            </button>{" "}
            · It stays on this phone.
          </p>
        ) : null}
        {changingCurrency ? (
          <div className="max-w-xs">
            <CurrencySelect value={currency} onChange={setCurrency} label="Currency" />
          </div>
        ) : null}
      </section>

      {open.length ? (
        <section aria-labelledby="debts-open" className="space-y-3">
          <h2 id="debts-open" className="font-serif text-2xl text-ink">
            Not paid back yet
          </h2>
          <p className="flex flex-wrap gap-x-6 gap-y-1 text-base">
            {totals.owedToYou > 0 ? (
              <span>
                Owed to you: <strong className="nums text-pine">{money(totals.owedToYou)}</strong>
              </span>
            ) : null}
            {totals.youOwe > 0 ? (
              <span>
                You owe: <strong className="nums text-ink">{money(totals.youOwe)}</strong>
              </span>
            ) : null}
          </p>
          <ul className="space-y-3">
            {open.map((n) => (
              <NoteCard key={n.id} note={n} money={money} currency={currency} today={today} share={share} update={update} />
            ))}
          </ul>
        </section>
      ) : null}

      {totals.owedToYou > 0 || totals.youOwe > 0 ? (
        <ForZakat owedToYou={totals.owedToYou} youOwe={totals.youOwe} currency={currency} money={money} />
      ) : null}

      {settled.length ? (
        <details className="border-t border-mist pt-4">
          <summary className="cursor-pointer text-base font-medium text-pine">
            Paid back or forgiven ({settled.length})
          </summary>
          <ul className="mt-3 divide-y divide-mist border-y border-mist">
            {settled.map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 text-ink">
                  {n.kind === "lent" ? `${n.who || "Someone"} owed you` : `You owed ${n.who || "someone"}`}{" "}
                  <span className="nums">{money(parseAmount(n.amount, "."))}</span>
                  <span className="text-sage"> · {n.status === "forgiven" ? "forgiven" : "paid back"}</span>
                </span>
                <button
                  type="button"
                  className="shrink-0 text-sage hover:text-danger"
                  aria-label={`Remove the note about ${n.who || "this"}`}
                  onClick={() => update(n.id, () => null)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function BigChoice({
  on,
  label,
  Icon,
  onClick,
}: {
  on: boolean;
  label: string;
  Icon: (p: { className?: string }) => React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={
        "flex min-h-[112px] flex-col items-center justify-center gap-2 border-2 px-3 py-4 text-center transition " +
        (on ? "border-pine bg-pine/10" : "border-pine/30 bg-surface hover:border-pine")
      }
    >
      <Icon className="h-9 w-9 text-pine" />
      <span className="text-lg font-medium leading-snug text-ink">{label}</span>
    </button>
  );
}

function AddForm({
  kind,
  currency,
  onSave,
  onCancel,
}: {
  kind: DebtKind;
  currency: string;
  onSave: (fields: { id: string; who: string; amount: string; due: string }) => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [who, setWho] = useState("");
  const [due, setDue] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Straight to the amount: the one thing that must be typed.
  useEffect(() => {
    document.getElementById("debt-amount")?.focus();
  }, [kind]);

  return (
    <form
      className="card space-y-4 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!(parseAmount(amount, ".") > 0)) {
          setError("Type how much, for example 5000.");
          return;
        }
        onSave({ id: `d${Date.now().toString(36)}`, who, amount: String(parseAmount(amount, ".")), due });
      }}
    >
      <MoneyInput id="debt-amount" label="How much?" currency={currency} value={amount} onChange={setAmount} intl={INTL} decimal="." />
      <div>
        <label className="label mb-1.5" htmlFor="debt-who">
          {kind === "lent" ? "Who owes you? (optional)" : "Who do you owe? (optional)"}
        </label>
        <input
          id="debt-who"
          className="field"
          autoComplete="off"
          maxLength={60}
          placeholder="e.g. Uncle Ahmed"
          value={who}
          onChange={(e) => setWho(e.target.value)}
        />
      </div>
      <details>
        <summary className="cursor-pointer text-sm text-pine">Add a pay-back date (optional)</summary>
        <div className="mt-2 max-w-xs">
          <label className="label mb-1.5" htmlFor="debt-due">
            To be paid back by
          </label>
          <input id="debt-due" type="date" className="field" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
      </details>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary px-6 py-3 text-base">
          Write it down
        </button>
        <button type="button" className="text-sm text-sage hover:text-ink" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function NoteCard({
  note,
  money,
  currency,
  today,
  share,
  update,
}: {
  note: DebtNote;
  money: (n: number) => string;
  currency: string;
  today: Date;
  share: ShareLabels;
  update: (id: string, change: (n: DebtNote) => DebtNote | null) => void;
}) {
  const [paying, setPaying] = useState(false);
  const [part, setPart] = useState("");
  const [forgiving, setForgiving] = useState(false);
  const state = dueState(note, today);
  const left = leftOn(note);
  const whole = parseAmount(note.amount, ".");
  const title = note.kind === "lent" ? `${note.who || "Someone"} owes you` : `You owe ${note.who || "someone"}`;

  return (
    <li className={"border p-4 " + (note.kind === "lent" ? "border-pine/30 bg-surface" : "border-mist bg-surface")}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-base font-medium text-ink">{title}</p>
        <p className="font-serif text-2xl text-ink nums">{money(left)}</p>
      </div>
      <p className="mt-1 text-sm text-sage">
        {left < whole ? `${money(whole - left)} paid back of ${money(whole)} · ` : ""}
        Written {note.made}
        {note.due ? (
          <>
            {" · "}
            <span className={state === "late" ? "font-medium text-danger" : state === "soon" ? "font-medium text-warn" : ""}>
              {state === "late" ? `was due ${note.due}` : `due ${note.due}`}
            </span>
          </>
        ) : null}
      </p>

      {paying ? (
        <form
          className="mt-3 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const amount = parseAmount(part, ".");
            if (amount > 0) update(note.id, (n) => payPart(n, amount));
            setPaying(false);
            setPart("");
          }}
        >
          <div className="min-w-0 flex-1">
            <MoneyInput
              id={`pay-${note.id}`}
              label="How much was paid back?"
              currency={currency}
              value={part}
              onChange={setPart}
              intl={INTL}
              decimal="."
            />
          </div>
          <button type="submit" className="btn-primary">
            Save
          </button>
          <button type="button" className="text-sm text-sage" onClick={() => setPaying(false)}>
            Cancel
          </button>
        </form>
      ) : forgiving ? (
        <div className="mt-3 border-s-2 border-brass ps-3">
          <p className="text-sm text-ink">
            “If the one who owes is in hardship, give him time until it eases; and to let it go as charity is better for
            you, if only you knew” (Quran 2:280).
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={() => update(note.id, (n) => ({ ...n, status: "forgiven" }))}
            >
              Forgive the {money(left)} left
            </button>
            <button type="button" className="text-sm text-sage" onClick={() => setForgiving(false)}>
              Not now
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => update(note.id, (n) => ({ ...n, paid: n.amount, status: "paid" }))}
          >
            All paid back
          </button>
          <button type="button" className="btn-ghost" onClick={() => setPaying(true)}>
            Some paid back
          </button>
          {note.kind === "lent" ? (
            <button type="button" className="btn-ghost" onClick={() => setForgiving(true)}>
              Forgive it
            </button>
          ) : null}
          {note.due ? <RemindButton note={note} money={money} /> : null}
          <ShareButton label="Send the note" text={noteText(note, money)} path="/debts" labels={share} />
        </div>
      )}
    </li>
  );
}

/** A calendar reminder on the pay-back day. */
function RemindButton({ note, money }: { note: DebtNote; money: (n: number) => string }) {
  function remind() {
    const ics = hawlCalendar({
      dueDay: note.due,
      calendarLabel: "lunar",
      uid: `debt-${note.id}`,
      summary:
        note.kind === "lent"
          ? `${note.who || "Someone"} is due to pay you back`
          : `Pay back ${note.who || "the money you borrowed"}`,
      description: `${noteText(note, money)} Open Mizan: ${new URL("/debts", window.location.origin)}`,
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "pay-back-reminder.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoking at once can cancel the download in Safari and Firefox.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <button type="button" className="btn-ghost" onClick={remind}>
      Remind me on {note.due}
    </button>
  );
}

/** What the notes mean for zakat, and a tap to use them in this year's figures. */
function ForZakat({
  owedToYou,
  youOwe,
  currency,
  money,
}: {
  owedToYou: number;
  youOwe: number;
  currency: string;
  money: (n: number) => string;
}) {
  const [done, setDone] = useState(false);
  const draft = parseDraft(readStoredValue(CALC_STORAGE_KEY));
  const otherCurrency = draft && draft.currency !== currency ? draft.currency : null;

  function use() {
    const d = draft ?? emptyDraft(currency, ".");
    const decimal = d.decimal === "," ? "," : ".";
    const asTyped = (n: number) => (decimal === "," ? String(n).replace(".", ",") : String(n));
    setStoredValue(
      CALC_STORAGE_KEY,
      JSON.stringify({ ...d, amounts: { ...d.amounts, receivables: asTyped(owedToYou) }, debts: asTyped(youOwe) }),
    );
    setDone(true);
  }

  return (
    <section aria-labelledby="debts-zakat" className="border border-mist bg-paper/60 p-4">
      <h2 id="debts-zakat" className="font-serif text-xl text-ink">
        For your zakat
      </h2>
      <p className="mt-1 text-base text-sage">
        {owedToYou > 0 ? `Money you expect back (${money(owedToYou)}) usually counts. ` : ""}
        {youOwe > 0 ? `Money you must pay back (${money(youOwe)}) is taken off.` : ""}
      </p>
      {otherCurrency ? (
        <p className="mt-2 text-sm text-sage">Your zakat figures are in {otherCurrency}, so add these yourself.</p>
      ) : done ? (
        <p className="mt-2 text-sm font-medium text-pine" role="status">
          Added to your zakat figures.{" "}
          <Link href="/guide" className="underline underline-offset-2">
            See your zakat
          </Link>
        </p>
      ) : (
        <button type="button" className="btn-ghost mt-3" onClick={use}>
          Use these in my zakat
        </button>
      )}
    </section>
  );
}
