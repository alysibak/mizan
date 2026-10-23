"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSignedIn } from "@/components/useSignedIn";
import InstallHint from "@/components/InstallHint";
import MovePhone, { MoveFromLink } from "@/components/public/MovePhone";
import { IconCheckCircle, IconQuestion } from "@/components/icons";
import { PAGE_ICONS } from "@/components/pageIcons";
import { useVisitorCurrency } from "@/components/public/VisitorCurrency";
import { useMyDraft } from "@/components/public/useMyDraft";
import { BalanceScale } from "@/components/public/Visuals";
import { MoneyInput } from "@/components/ZakatCalculator";
import { decimalMarkFor, parseAmount } from "@/lib/calculator";
import { readStoredValue, setStoredValue, useHydrated, useStoredState, useStoredValues } from "@/lib/client-store";
import { HIJRI_MONTHS, gregorianToHijri, ramadanStatus } from "@/lib/hijri";
import { daysCalendar } from "@/lib/ics";
import { formatMoney } from "@/lib/money";
import {
  MY_KEY,
  addPayment,
  backupFile,
  closeYear,
  daysUntil,
  draftAmount,
  hijriYearOf,
  monthlyPlan,
  nextZakatDay,
  overdueDays,
  parseMy,
  readBackup,
  removePayment,
  summaryText,
  todos,
  zakatDays,
  type MyZakat,
  type ZakatDay,
} from "@/lib/my-zakat";
import { PHONE_KEYS, phoneDues, phoneLines } from "@/lib/phone-features";

const INTL = "en-CA";
const longDate = (d: Date) =>
  d.toLocaleDateString(INTL, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const shortDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString(INTL, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString(INTL, { day: "numeric", month: "short", timeZone: "UTC" });
const isoToday = () => {
  const t = new Date();
  return new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate())).toISOString().slice(0, 10);
};

function download(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Card({ id, title, children, className = "" }: { id: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={"card scroll-mt-24 p-5 sm:p-6 " + className} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="font-serif text-2xl text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Send this year's figures to someone who can check them: the phone's own
 * share sheet, or WhatsApp elsewhere. Only on the visitor's tap.
 */
function SendSummary({ text }: { text: string }) {
  const link = "text-base font-medium text-pine hover:underline";
  if (typeof navigator.share === "function") {
    return (
      <button type="button" className={link} onClick={() => navigator.share({ title: "My zakat", text }).catch(() => undefined)}>
        Send to family or the imam
      </button>
    );
  }
  return (
    <a className={link} href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
      Send to family or the imam
    </a>
  );
}

/** Choosing the zakat day, or showing when it next comes round. */
function ZakatDayCard({ my, save }: { my: MyZakat; save: (next: MyZakat) => void }) {
  const [editing, setEditing] = useState(false);
  const [month, setMonth] = useState(my.zakatDay?.month ?? 9);
  const [day, setDay] = useState(my.zakatDay?.day ?? 1);
  const today = new Date();
  const choose = (zd: ZakatDay) => {
    save({ ...my, zakatDay: zd });
    setEditing(false);
  };
  const todayHijri = gregorianToHijri(new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())), "umalqura");

  if (my.zakatDay && !editing) {
    const zd = my.zakatDay;
    const next = nextZakatDay(zd, today);
    const left = daysUntil(next, today);
    const progress = Math.max(0, Math.min(1, 1 - left / 354));
    function remind() {
      const events = zakatDays(zd, today, 5).map((d) => ({
        day: d.toISOString().slice(0, 10),
        summary: "Zakat day",
        description:
          "Your zakat day from Mizan: update your figures, work out your zakat, and give it. The date follows the Umm al-Qura calendar; check your local moon sighting.",
      }));
      download("zakat-day.ics", daysCalendar({ events, uid: `zakat-day-${zd.month}-${zd.day}` }), "text/calendar;charset=utf-8");
    }
    return (
      <Card id="zakat-day" title="Your zakat day">
        <p className="mt-3 font-serif text-3xl text-pine">
          {zd.day} {HIJRI_MONTHS[zd.month - 1]}
        </p>
        <p className="mt-1 text-base text-ink nums">
          {left === 0 ? "Today." : `${longDate(next)}, in ${left} ${left === 1 ? "day" : "days"}.`}
        </p>
        <div className="mt-3 h-2 overflow-hidden bg-mist" aria-hidden>
          <div className="h-full bg-brass" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <p className="mt-1 text-xs text-sage">How far through the year you are, counted in the Islamic calendar.</p>
        <div className="mt-4 flex flex-wrap gap-3 print:hidden">
          <button type="button" className="btn-primary px-5 py-3 text-base" onClick={remind}>
            Remind me every year
          </button>
          <button type="button" className="btn-ghost px-5 py-3 text-base" onClick={() => setEditing(true)}>
            Change the day
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card id="zakat-day" title="Choose your zakat day" className="border-2 border-brass/50">
      <p className="mt-2 text-base leading-relaxed text-sage">
        Pick one day in the Islamic year to work out and give your zakat, and keep it every year. If you do not know
        when your savings first reached the nisab, any day you keep to is fine. Many choose 1 Ramadan.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button type="button" className="btn-primary min-h-[52px] flex-col px-4 text-base" onClick={() => choose({ month: 9, day: 1 })}>
          1 Ramadan
          <span className="block text-xs font-normal opacity-90">next on {shortDay(nextZakatDay({ month: 9, day: 1 }, today).toISOString().slice(0, 10))}</span>
        </button>
        <button
          type="button"
          className="btn-ghost min-h-[52px] px-4 text-base"
          onClick={() => choose({ month: todayHijri.month, day: Math.min(29, todayHijri.day) })}
        >
          Today: {Math.min(29, todayHijri.day)} {HIJRI_MONTHS[todayHijri.month - 1]}
        </button>
      </div>
      <fieldset className="mt-4">
        <legend className="label mb-1.5">Or another day</legend>
        <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto]">
          <label className="sr-only" htmlFor="zd-day">
            Day
          </label>
          <select id="zd-day" className="field" value={day} onChange={(e) => setDay(Number(e.target.value))}>
            {Array.from({ length: 29 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="zd-month">
            Month
          </label>
          <select id="zd-month" className="field" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {HIJRI_MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <button type="button" className="btn-ghost col-span-2 min-h-[44px] px-4 sm:col-span-1" onClick={() => choose({ month, day })}>
            Use this day
          </button>
        </div>
        <p className="mt-1.5 text-xs text-sage nums">
          {day} {HIJRI_MONTHS[month - 1]} is next on {longDate(nextZakatDay({ month, day }, today))}.
        </p>
      </fieldset>
    </Card>
  );
}

/**
 * My zakat: one person's zakat year, from every page that knows something
 * about it, with what to do next. Kept in this browser only.
 */
export default function MyZakatHub({ neighbours = false }: { neighbours?: boolean }) {
  const hydrated = useHydrated();
  const [visitorCurrency] = useVisitorCurrency();
  const mine = useMyDraft(visitorCurrency);
  const [my, save] = useStoredState(MY_KEY, parseMy);
  // Every other tool that remembers something, from the one registry.
  const phone = useStoredValues(PHONE_KEYS);
  const [amount, setAmount] = useState("");
  const [to, setTo] = useState("");
  const [when, setWhen] = useState("");
  const [restored, setRestored] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const signedIn = useSignedIn();
  const [moving, setMoving] = useState(false);
  // On a first visit the day picker waits until the to-do list asks for it.
  const [askDay, setAskDay] = useState(() => typeof window !== "undefined" && window.location.hash === "#zakat-day");
  function openDay() {
    setAskDay(true);
    requestAnimationFrame(() => document.getElementById("zakat-day")?.scrollIntoView({ block: "start" }));
  }
  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === "#zakat-day") openDay();
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (!hydrated) return <div className="card min-h-[24rem]" aria-busy="true" />;

  const today = new Date();
  const { draft, outcome, started, update } = mine;
  const currency = draft.currency;
  const money = (n: number) => formatMoney(n, currency, INTL);
  const visitorMoney = (n: number) => formatMoney(n, visitorCurrency, INTL);
  const { result, needsPrices } = outcome;
  const given = parseAmount(draft.given, draft.decimal);
  const due = started && !needsPrices ? result.zakatDue : 0;
  const left = Math.max(0, due - given);

  const decimal = decimalMarkFor(INTL);
  const phoneCtx = { today, money: visitorMoney, decimal, intl: INTL };
  // Whether this phone keeps anything yet: until it does, there is nothing to
  // save, move or print, and the page says so less.
  const keepsAnything =
    Boolean(my.zakatDay) || started || my.payments.length > 0 || my.history.length > 0 || phoneLines(phone, phoneCtx).length > 0;
  const dues = phoneDues(phone, phoneCtx);
  // Nothing kept yet: the to-do list says what to do, and the cards that
  // would repeat it wait until there is something in them.
  const firstVisit = !keepsAnything && !signedIn;
  const ramadan = ramadanStatus(new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())));
  const pricesAgeDays = draft.pricesAsOf
    ? Math.floor((today.getTime() - new Date(draft.pricesAsOf).getTime()) / 86_400_000)
    : null;

  // What is left, a share a month until the zakat day, once there is a day.
  const zakatDue = my.zakatDay ? nextZakatDay(my.zakatDay, today) : null;
  const lastPaid = my.payments.reduce((latest, p) => (p.day > latest ? p.day : latest), "");
  const givenThisMonth = lastPaid !== "" && daysUntil(new Date(`${lastPaid}T00:00:00Z`), today) > -28;
  // Zakat whose day has passed is owed now: no plan then.
  const overdue = overdueDays(my, today);
  const plan = zakatDue && left > 0.005 && overdue === null ? monthlyPlan(left, zakatDue, today, givenThisMonth) : [];
  const list = todos(
    {
      zakatDay: my.zakatDay,
      zakat: started && !needsPrices
        ? { due, given, pricesAgeDays, plan: plan.length ? (plan[0].day === isoToday() ? "now" : "later") : undefined }
        : null,
      ...dues,
      ramadanIn: ramadan.inRamadan ? 0 : ramadan.daysUntil,
      signedIn,
      overdueDays: overdue,
    },
    today,
  );

  function addGiven(e: React.FormEvent) {
    e.preventDefault();
    const n = parseAmount(amount, draft.decimal ?? decimal);
    if (!(n > 0)) return;
    save(addPayment(my, { day: when || isoToday(), amount: n, to: to.trim() }));
    update({ given: draftAmount(given + n, draft.decimal) });
    setAmount("");
    setTo("");
    setWhen("");
  }
  function removeGiven(id: string) {
    const p = my.payments.find((x) => x.id === id);
    if (!p) return;
    save(removePayment(my, id));
    update({ given: draftAmount(Math.max(0, given - p.amount), draft.decimal) });
  }
  function remindMonthly() {
    const events = plan.map((p) => ({
      day: p.day,
      summary: `Zakat: give or put aside ${money(p.amount)}`,
      description: "This month’s share of your zakat, from your plan in Mizan. When you give it, note it in My zakat.",
    }));
    download("zakat-each-month.ics", daysCalendar({ events, uid: "zakat-month", weekBefore: false }), "text/calendar;charset=utf-8");
  }

  const summary = summaryText({
    money,
    hijriYear: hijriYearOf(today),
    zakatDay: my.zakatDay
      ? `${my.zakatDay.day} ${HIJRI_MONTHS[my.zakatDay.month - 1]} (${longDate(nextZakatDay(my.zakatDay, today))})`
      : null,
    isDue: result.isDue,
    zakat: result.zakatDue,
    net: result.netZakatable,
    nisab: result.nisab,
    given,
    lines: outcome.lines.map((l) => ({ label: l.label, amount: l.amount * l.zakatablePortion })),
    debts: result.deductibleLiabilities,
    link: `${window.location.origin}/my`,
  });

  function close() {
    save(closeYear(my, { hijriYear: hijriYearOf(today), currency, due, given }, today));
    update({ given: "" });
  }
  function restore(file: File) {
    file.text().then((body) => {
      const data = readBackup(body);
      if (!data) {
        setRestored("That file is not a Mizan copy.");
        return;
      }
      for (const [key, value] of Object.entries(data)) setStoredValue(key, value);
      setRestored("Restored. Everything from your copy is back.");
    });
  }

  // Ramadan always comes round, kept or not.
  const also = [
    ...phoneLines(phone, phoneCtx),
    {
      key: "ramadan",
      icon: "ramadan",
      title: "Ramadan",
      status: ramadan.inRamadan ? `Day ${ramadan.day} of Ramadan` : `In ${ramadan.daysUntil} days`,
      href: "/ramadan",
    },
  ].map((l) => ({ ...l, Icon: PAGE_ICONS[l.icon] ?? IconQuestion }));

  return (
    <div className="space-y-6">
      {/* Arriving from the old phone's code or picture. */}
      {/* The Menu's "Move to a new phone" lands here: on a phone with nothing
          kept yet, that means bringing it over, so the code form opens. */}
      <MoveFromLink asked={moving || (!keepsAnything && window.location.hash === "#move")} />

      {list.length ? (
        <section className="border-2 border-pine/40 bg-pine/5 p-5 print:hidden" aria-labelledby="todo-title">
          <h2 id="todo-title" className="font-serif text-2xl text-ink">
            What to do next
          </h2>
          <ol className="mt-3 space-y-2">
            {list.slice(0, 4).map((t, i) => (
              <li key={t.key}>
                <Link
                  href={t.href}
                  onClick={t.href === "#zakat-day" ? openDay : undefined}
                  className="group flex items-center gap-3 border border-mist bg-surface px-3 py-2.5 transition hover:border-pine"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine text-sm font-medium text-surface nums" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-base font-medium text-ink">{t.text}</span>
                  <span className="text-pine transition group-hover:translate-x-0.5" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <p className="flex items-center gap-2 border-2 border-pine/40 bg-pine/5 p-4 text-base font-medium text-pine print:hidden">
          <IconCheckCircle className="h-6 w-6" /> Nothing to do for now. May Allah accept it from you.
        </p>
      )}

      {/* Someone new here may have it all on another phone already. */}
      {!moving && !keepsAnything ? (
        <div className="text-base text-sage print:hidden">
          <p>Used Mizan on another phone?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" onClick={() => setMoving(true)}>
              Bring everything over with a code
            </button>
            <button type="button" className="btn-ghost" onClick={() => fileInput.current?.click()}>
              Restore a saved copy
            </button>
          </div>
        </div>
      ) : null}
      {restored && !keepsAnything ? (
        <p className="text-sm font-medium text-danger" role="alert">
          {restored}
        </p>
      ) : null}

      {firstVisit ? null : (
        <Card id="this-year" title="This year’s zakat">
          {started && !needsPrices ? (
            <div className="mt-3 grid gap-5 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-center">
              <div>
                <p className="font-serif text-4xl text-pine nums">{result.isDue ? money(result.zakatDue) : "Not due"}</p>
                <p className="mt-1 text-sm text-sage nums">
                  {result.isDue
                    ? `2.5% of ${money(result.netZakatable)}, above the nisab of ${money(result.nisab)}.`
                    : `${money(result.netZakatable)} is below the nisab of ${money(result.nisab)}.`}
                </p>
                <ul className="mt-3 space-y-1 text-sm">
                  {outcome.lines.map((l) => (
                    <li key={l.key} className="flex justify-between gap-3 border-b border-mist/70 pb-1">
                      <span className="text-sage">{l.label}</span>
                      <span className="text-ink nums">{money(l.amount * l.zakatablePortion)}</span>
                    </li>
                  ))}
                  {result.deductibleLiabilities > 0 ? (
                    <li className="flex justify-between gap-3 border-b border-mist/70 pb-1">
                      <span className="text-sage">Debts due now</span>
                      <span className="text-danger nums">−{money(result.deductibleLiabilities)}</span>
                    </li>
                  ) : null}
                </ul>
              </div>
              <BalanceScale net={result.netZakatable} nisab={result.nisab} money={money} labels={{ you: "Yours", nisab: "Nisab" }} />
            </div>
          ) : signedIn && !started ? (
            <p className="mt-2 text-base text-sage">
              Your account keeps this year’s zakat, worked out from everything you have put in it, and what you have given.
            </p>
          ) : (
            <p className="mt-2 text-base text-sage">
              {started ? "Today’s gold and silver prices are needed to finish. " : "Nothing worked out yet. "}
              It takes a few minutes, step by step.
            </p>
          )}
          {signedIn && !started ? (
            <div className="mt-4 flex flex-wrap gap-3 print:hidden">
              <Link href="/dashboard" className="btn-primary px-5 py-3 text-base">
                Open my account
              </Link>
              <Link href="/giving?type=zakat" className="btn-ghost px-5 py-3 text-base">
                Note zakat I gave
              </Link>
            </div>
          ) : (
            // One clear button; everything else as a quiet link beside it.
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 print:hidden">
              {started ? (
                <Link href="/calculator" className="btn-primary px-5 py-3 text-base">
                  Change my figures
                </Link>
              ) : (
                <Link href="/guide" className="btn-primary px-5 py-3 text-base">
                  Work it out, step by step
                </Link>
              )}
              {started ? (
                <Link href="/guide" className="text-base font-medium text-pine hover:underline">
                  Go through it step by step
                </Link>
              ) : null}
              {started && !needsPrices ? <SendSummary text={summary} /> : null}
            </div>
          )}
        </Card>
      )}

      {due > 0 ? (
        <Card id="given" title="What you have given">
          <div className="mt-3 h-3 overflow-hidden bg-mist" aria-hidden>
            <div className="h-full bg-pine transition-all" style={{ width: `${Math.min(100, Math.round((given / due) * 100))}%` }} />
          </div>
          <p className="mt-2 text-base font-medium text-ink nums" aria-live="polite">
            {money(given)} of {money(due)} · {left > 0.005 ? `${money(left)} left` : "all given"}
          </p>
          {neighbours && left > 0.005 ? (
            <Link href="/neighbours?zakat=1" className="mt-2 inline-flex min-h-[44px] items-center text-base font-medium text-pine hover:underline">
              Give it to a family near you, checked by a mosque →
            </Link>
          ) : null}

          {plan.length ? (
            <section className="mt-4 border border-brass/50 bg-brass/5 p-4" aria-labelledby="plan-title">
              <h3 id="plan-title" className="text-base font-medium text-ink nums">
                Too much at once? {money(plan[0].amount)} a month
              </h3>
              <p className="mt-1 text-sm text-sage">
                Give it, or put it aside, a little each month, and it is all done by your zakat day.
              </p>
              <ol className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {plan.map((p) => (
                  <li key={p.day} className="border border-mist bg-surface px-2 py-2 text-center">
                    <span className="block text-xs text-sage">{p.day === isoToday() ? "Today" : monthDay(p.day)}</span>
                    <span className="block text-sm font-medium text-ink nums">{money(p.amount)}</span>
                  </li>
                ))}
              </ol>
              <button type="button" className="btn-ghost mt-3 px-4 print:hidden" onClick={remindMonthly}>
                Remind me each month
              </button>
            </section>
          ) : left > 0.005 && overdue !== null && overdue > 0 ? (
            <p className="mt-3 border-s-2 border-brass ps-3 text-sm text-ink">
              Your zakat day was {overdue} {overdue === 1 ? "day" : "days"} ago, so what is left is owed now. Give it as
              soon as you can.
            </p>
          ) : left > 0.005 && !my.zakatDay ? (
            <p className="mt-3 text-sm text-sage">
              <Link href="#zakat-day" className="font-medium text-pine hover:underline">
                Choose your zakat day
              </Link>{" "}
              and what is left can be spread over the months before it.
            </p>
          ) : null}

          <form className="mt-4 grid gap-3 border-t border-mist pt-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] print:hidden" onSubmit={addGiven}>
            <MoneyInput id="my-amount" label="I gave" currency={currency} value={amount} onChange={setAmount} intl={INTL} decimal={draft.decimal ?? decimal} />
            <div>
              <label className="label mb-1.5" htmlFor="my-to">
                To (optional)
              </label>
              <input
                id="my-to"
                list="my-to-list"
                className="field"
                autoComplete="off"
                placeholder="A relative, the mosque…"
                value={to}
                maxLength={60}
                onChange={(e) => setTo(e.target.value)}
              />
              <datalist id="my-to-list">
                <option value="A relative in need" />
                <option value="A neighbour" />
                <option value="The mosque’s zakat fund" />
                <option value="A charity" />
              </datalist>
            </div>
            <div>
              <label className="label mb-1.5" htmlFor="my-when">
                On
              </label>
              <input id="my-when" type="date" className="field" value={when || isoToday()} max={isoToday()} onChange={(e) => setWhen(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary min-h-[48px] w-full px-5 text-base">
                Add to what I have given
              </button>
            </div>
          </form>

          {my.payments.length ? (
            <ul className="mt-4 divide-y divide-mist border-y border-mist">
              {[...my.payments].reverse().map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink nums">{money(p.amount)}</span>
                    <span className="block text-xs text-sage">
                      {shortDay(p.day)}
                      {p.to ? ` · ${p.to}` : ""}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center text-xl text-sage hover:text-ink print:hidden"
                    aria-label={`Remove ${money(p.amount)} given on ${shortDay(p.day)}`}
                    onClick={() => removeGiven(p.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {left <= 0.005 ? (
            <div className="mt-4 border-2 border-pine/40 bg-pine/5 p-4 text-center">
              <p lang="ar" dir="rtl" className="quran text-2xl text-pine">
                رَبَّنَا تَقَبَّلْ مِنَّا ۖ إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ
              </p>
              <p className="mt-1 text-sm text-sage">“Our Lord, accept this from us. You are the All-Hearing, the All-Knowing.” (Quran 2:127)</p>
              <button type="button" className="btn-primary mt-4 px-5 py-3 text-base print:hidden" onClick={close}>
                Close this year and keep a record
              </button>
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* After the zakat itself, as the to-do list puts it: work it out first. */}
      {firstVisit && !askDay ? null : <ZakatDayCard my={my} save={save} />}

      <section aria-labelledby="also-title">
        <h2 id="also-title" className="font-serif text-2xl text-ink">
          Everything else
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {also.map(({ key, Icon, title, status, href }) => (
            <li key={key}>
              <Link href={href} className="card group flex h-full items-center gap-3 px-4 py-3 transition hover:border-pine">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-pine/30 bg-pine/5 text-pine" aria-hidden>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-medium text-ink">{title}</span>
                  <span className="block text-sm text-sage nums">{status}</span>
                </span>
                <span className="text-pine transition group-hover:translate-x-0.5" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Once there is a day to come back for, keep the way back one tap away. */}
      {my.zakatDay ? (
        <InstallHint pitch="Keep My zakat one tap away: your zakat day, what is left, and what to do next open from your home screen like an app. No app store, and it works without the internet." />
      ) : null}

      {my.history.length ? (
        <Card id="record" title="Your record">
          <ul className="mt-3 divide-y divide-mist border-y border-mist">
            {[...my.history].reverse().map((h) => (
              <li key={h.hijriYear} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="font-medium text-ink nums">{h.hijriYear} AH</span>
                <span className="text-sage nums">
                  {formatMoney(h.given, h.currency, INTL)} given of {formatMoney(h.due, h.currency, INTL)}
                </span>
                {h.given >= h.due ? <IconCheckCircle className="h-5 w-5 text-pine" /> : <span className="w-5" />}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* The one way in for a copy, whether or not anything is kept yet. */}
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-label="Choose a Mizan copy to restore"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) restore(file);
          e.target.value = "";
        }}
      />

      {/* Nothing to keep safe until something is kept. */}
      {keepsAnything ? (
        <Card id="keep" title="Keep it safe" className="print:hidden">
          <p className="mt-2 text-base text-sage">
            All of this stays on this phone, and nowhere else. Clearing the browser deletes it.
          </p>
          <MovePhone />
          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-mist pt-4 text-sm">
            <button
              type="button"
              className="font-medium text-pine hover:underline"
              onClick={() => download(`mizan-${isoToday()}.json`, backupFile(readStoredValue, new Date()), "application/json")}
            >
              Save a copy as a file
            </button>
            <button type="button" className="font-medium text-pine hover:underline" onClick={() => fileInput.current?.click()}>
              Restore a copy
            </button>
            <button type="button" className="font-medium text-pine hover:underline" onClick={() => window.print()}>
              Print
            </button>
          </p>
          {restored ? (
            <p className="mt-3 text-sm font-medium text-pine" role="status">
              {restored}
            </p>
          ) : null}
          {signedIn ? null : (
            <p className="mt-4 text-sm text-sage">
              Want it on every device?{" "}
              <Link href={started ? "/register?from=calculator" : "/register"} className="font-medium text-pine hover:underline">
                Open a free account
              </Link>{" "}
              and your figures, zakat day and payments come with you.
            </p>
          )}
        </Card>
      ) : null}
    </div>
  );
}
