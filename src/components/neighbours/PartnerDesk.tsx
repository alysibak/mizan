"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Need, Partner } from "@/db/schema";
import { MoneyInput } from "@/components/MoneyInput";
import { NeedIcon } from "@/components/neighbours/NeedBits";
import { parseAmount } from "@/lib/calculator";
import { sendJson } from "@/lib/client-fetch";
import { COMMON_CURRENCIES } from "@/lib/currencies";
import { readableDay } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import {
  EXPIRY_CHOICES,
  NEED_KINDS,
  REPORT_REASONS,
  STORY_MAX,
  THANKS_MAX,
  TITLE_MAX,
  pledgeHolds,
  readTime,
  showPledgeCode,
  type NeedProgress,
  type NeedState,
} from "@/lib/neighbours";

interface DeskPledge {
  id: string;
  code: string;
  amount: number;
  received: number | null;
  name: string | null;
  contact: string | null;
  status: string;
  createdAt: string;
}

interface DeskItem {
  need: Need;
  progress: NeedProgress;
  state: NeedState;
  daysLeft: number | null;
  pledges: DeskPledge[];
  reports: { id: string; reason: string; note: string | null; createdAt: string }[];
  events: { id: string; actor: string; action: string; createdAt: string }[];
}

interface Member {
  userId: string;
  name: string;
  email: string;
  role: string;
}

interface DeskContext {
  partner: Partner;
  role: "lead" | "member";
  userId: string;
  readOnly: boolean;
  members: Member[];
  busy: boolean;
  money: (n: number) => string;
  act: (url: string, method: "POST" | "PATCH" | "DELETE", body: unknown) => Promise<boolean>;
}

const Desk = createContext<DeskContext | null>(null);

function useDesk(): DeskContext {
  const ctx = useContext(Desk);
  if (!ctx) throw new Error("Outside the desk");
  return ctx;
}

const STATE_LABELS: Record<NeedState, string> = {
  draft: "Waiting for a check",
  open: "Listed",
  covered: "Fully promised",
  met: "Met",
  ended: "Time ran out",
  paused: "Off the list",
  closed: "Closed",
  removed: "Removed",
};

const day = (stamp: string) => readableDay(readTime(stamp));

/**
 * A mosque's desk: write needs, check and list them, mark payments received,
 * answer reports, and keep the mosque's page right. One page, plain words.
 */
export default function PartnerDesk({
  partner,
  role,
  userId,
  readOnly,
  desk,
  members,
}: {
  partner: Partner;
  role: "lead" | "member";
  userId: string;
  readOnly: boolean;
  desk: DeskItem[];
  members: Member[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const money = (n: number) => formatMoney(n, partner.currency);

  async function act(url: string, method: "POST" | "PATCH" | "DELETE", body: unknown): Promise<boolean> {
    setBusy(true);
    setError(null);
    const res = await sendJson(url, method, body);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return false;
    }
    router.refresh();
    return true;
  }

  const drafts = desk.filter((d) => d.state === "draft");
  const listed = desk.filter((d) => ["open", "covered", "paused", "ended"].includes(d.state));
  const finished = desk.filter((d) => d.state === "met" || d.state === "closed");
  const toConfirm = desk.flatMap((d) => d.pledges.filter((p) => p.status === "pledged")).length;
  const reports = desk.reduce((n, d) => n + d.reports.length, 0);
  const toCheck = drafts.filter((d) => !partner.twoPerson || d.need.createdBy !== userId).length;

  return (
    <Desk.Provider value={{ partner, role, userId, readOnly, members, busy, money, act }}>
      <div className="space-y-8">
        <header className="space-y-2">
          <p className="eyebrow">Mosque desk</p>
          <h1 className="font-serif text-3xl leading-tight text-ink">{partner.name}</h1>
          <p className="flex flex-wrap gap-x-5 text-base">
            <Link href={`/neighbours/at/${partner.slug}`} className="inline-flex min-h-[44px] items-center text-pine hover:underline">
              Your page
            </Link>
            <Link href={`/neighbours/at/${partner.slug}/poster`} className="inline-flex min-h-[44px] items-center text-pine hover:underline">
              Poster
            </Link>
            <Link href="/neighbours/for-mosques" className="inline-flex min-h-[44px] items-center text-pine hover:underline">
              What you agreed to
            </Link>
          </p>
        </header>

        {readOnly ? (
          <p role="note" className="border border-mist bg-paper px-4 py-3 text-base text-ink">
            This is the shared example. You can look around, but nothing can be changed.
          </p>
        ) : null}

        <ul className="grid gap-3 sm:grid-cols-3" aria-label="To do">
          <ToDo count={toCheck} label={toCheck === 1 ? "need to check" : "needs to check"} />
          <ToDo count={toConfirm} label={toConfirm === 1 ? "payment to confirm" : "payments to confirm"} />
          <ToDo count={reports} label={reports === 1 ? "report to answer" : "reports to answer"} />
        </ul>

        {error ? (
          <p role="alert" className="border border-danger/40 bg-danger/5 px-4 py-3 text-base text-danger">
            {error}
          </p>
        ) : null}

        <section aria-labelledby="write" className="space-y-3">
          {writing ? (
            <NeedForm
              currency={partner.currency}
              busy={busy || readOnly}
              onCancel={() => setWriting(false)}
              onSave={async (fields) => {
                if (await act("/api/neighbours/manage/needs", "POST", { partnerId: partner.id, ...fields })) setWriting(false);
              }}
            />
          ) : (
            <button id="write" type="button" className="btn-primary w-full py-3 text-base sm:w-auto" onClick={() => setWriting(true)} disabled={readOnly}>
              Write a new need
            </button>
          )}
        </section>

        <NeedGroup title="Waiting for a check" items={drafts} empty="Nothing is waiting." />
        <NeedGroup title="Listed" items={listed} empty="Nothing is listed right now." />
        {finished.length ? (
          <details>
            <summary className="font-serif text-xl text-ink">Met or closed ({finished.length})</summary>
            <NeedGroup title="" items={finished} empty="" />
          </details>
        ) : null}

        <Settings />
      </div>
    </Desk.Provider>
  );
}

function NeedGroup({ title, items, empty }: { title: string; items: DeskItem[]; empty: string }) {
  return (
    <section aria-label={title || undefined} className="space-y-3">
      {title ? <h2 className="font-serif text-2xl text-ink">{title}</h2> : null}
      {items.length ? (
        <ul className="space-y-3">
          {items.map((d) => (
            <NeedRow key={d.need.id} item={d} />
          ))}
        </ul>
      ) : empty ? (
        <p className="text-base text-sage">{empty}</p>
      ) : null}
    </section>
  );
}

function NeedRow({ item }: { item: DeskItem }) {
  const { partner, userId, readOnly, busy, money, act } = useDesk();
  const { need, progress, state } = item;
  const [editing, setEditing] = useState(false);
  const [closing, setClosing] = useState(false);
  const [thanks, setThanks] = useState("");
  const [office, setOffice] = useState("");
  const url = `/api/neighbours/manage/needs/${need.id}`;
  const waiting = item.pledges.filter((p) => p.status === "pledged");
  const attention = waiting.length > 0 || item.reports.length > 0 || state === "draft";

  return (
    <li className="border-2 border-mist" data-need={need.title}>
      <details open={attention}>
        <summary className="flex items-center gap-3 px-4">
          <NeedIcon kind={need.kind} />
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-ink">{need.title}</span>
            <span className="block text-sm text-sage nums">
              {STATE_LABELS[state]} · {money(progress.received)} of {money(need.amount)}
              {progress.pledged > 0 ? ` · ${money(progress.pledged)} promised` : ""}
              {state === "open" || state === "covered"
                ? item.daysLeft === 1
                  ? " · 1 day left"
                  : ` · ${item.daysLeft} days left`
                : ""}
            </span>
          </span>
        </summary>
        <div className="space-y-4 border-t border-mist px-4 py-4">
          {editing ? (
            <NeedForm
              currency={partner.currency}
              initial={need}
              busy={busy || readOnly}
              onCancel={() => setEditing(false)}
              onSave={async (fields) => {
                if (await act(url, "PATCH", { action: "edit", ...fields })) setEditing(false);
              }}
            />
          ) : (
            <>
              {need.story ? <p className="whitespace-pre-line text-base text-ink">{need.story}</p> : null}
              <p className="text-sm text-sage">{need.zakat ? "Zakat can go here" : "Charity only, not zakat"}</p>
              <div className="flex flex-wrap gap-2">
                {state === "draft" ? (
                  <button type="button" className="btn-primary" disabled={busy || readOnly} onClick={() => act(url, "PATCH", { action: "publish" })}>
                    Check it and list it
                  </button>
                ) : null}
                {state === "open" || state === "covered" ? (
                  <button type="button" className="btn-ghost" disabled={busy || readOnly} onClick={() => act(url, "PATCH", { action: "pause" })}>
                    Take it off the list
                  </button>
                ) : null}
                {state === "paused" ? (
                  <button type="button" className="btn-primary" disabled={busy || readOnly} onClick={() => act(url, "PATCH", { action: "resume" })}>
                    Put it back on the list
                  </button>
                ) : null}
                {state === "ended" || state === "open" || state === "covered" ? (
                  <button type="button" className="btn-ghost" disabled={busy || readOnly} onClick={() => act(url, "PATCH", { action: "extend" })}>
                    Give it {need.days} more days
                  </button>
                ) : null}
                {state !== "closed" && state !== "met" ? (
                  <button type="button" className="btn-ghost" disabled={busy || readOnly} onClick={() => setEditing(true)}>
                    Change it
                  </button>
                ) : null}
                {state !== "draft" && state !== "closed" ? (
                  <button type="button" className="btn-ghost" disabled={busy || readOnly} onClick={() => setClosing((c) => !c)}>
                    Close it
                  </button>
                ) : null}
                {state !== "closed" ? (
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={busy || readOnly}
                    onClick={() => {
                      if (window.confirm(`Remove “${need.title}”? It will no longer be shown anywhere.`)) {
                        void act(url, "PATCH", { action: "remove" });
                      }
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              {state === "draft" && partner.twoPerson && need.createdBy === userId ? (
                <p className="text-sm text-sage">Someone else at the mosque checks and lists what you wrote.</p>
              ) : null}

              {closing ? (
                <form
                  className="space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void act(url, "PATCH", { action: "close", thanks });
                  }}
                >
                  <label className="label" htmlFor={`thanks-${need.id}`}>
                    A line to everyone who gave (optional)
                  </label>
                  <input
                    id={`thanks-${need.id}`}
                    className="field"
                    maxLength={THANKS_MAX}
                    value={thanks}
                    onChange={(e) => setThanks(e.target.value)}
                    placeholder="All of it arrived and the rent is paid. Jazakum Allahu khayran."
                  />
                  <button type="submit" className="btn-primary" disabled={busy || readOnly}>
                    Close it
                  </button>
                </form>
              ) : null}

              {state !== "draft" && state !== "closed" ? (
                <form
                  className="flex flex-wrap items-end gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (await act(url, "PATCH", { action: "received", amount: parseAmount(office, ".") })) setOffice("");
                  }}
                >
                  <div className="max-w-[12rem]">
                    <MoneyInput
                      id={`office-${need.id}`}
                      label="Given at the office"
                      currency={partner.currency}
                      value={office}
                      onChange={setOffice}
                    />
                  </div>
                  <button type="submit" className="btn-ghost" disabled={busy || readOnly || !(parseAmount(office, ".") > 0)}>
                    Add it
                  </button>
                </form>
              ) : null}
            </>
          )}

          {item.pledges.length ? (
            <div>
              <h3 className="label">Promises</h3>
              <ul className="mt-2 divide-y divide-mist border-y border-mist">
                {item.pledges.map((p) => (
                  <PledgeRow key={p.id} p={p} />
                ))}
              </ul>
            </div>
          ) : null}

          {item.reports.length ? (
            <div>
              <h3 className="label">Reports from visitors</h3>
              <ul className="mt-2 space-y-2">
                {item.reports.map((r) => (
                  <li key={r.id} className="border border-brass/40 bg-brass/5 p-3">
                    <p className="text-base text-ink">
                      {REPORT_REASONS.find((x) => x.key === r.reason)?.label ?? r.reason}
                      <span className="text-sm text-sage"> · {day(r.createdAt)}</span>
                    </p>
                    {r.note ? <p className="mt-1 whitespace-pre-line text-base text-ink">{r.note}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-ghost"
                        disabled={busy || readOnly}
                        onClick={() => act(`/api/neighbours/manage/reports/${r.id}`, "PATCH", { action: "dismiss" })}
                      >
                        Nothing is wrong
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        disabled={busy || readOnly}
                        onClick={() => act(`/api/neighbours/manage/reports/${r.id}`, "PATCH", { action: "uphold" })}
                      >
                        They are right: remove it
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {item.events.length ? (
            <details>
              <summary className="text-sm text-sage">What happened</summary>
              <ul className="space-y-1 pb-2 text-sm text-sage">
                {item.events.map((e) => (
                  <li key={e.id}>
                    {day(e.createdAt)} · {e.actor}: {e.action}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      </details>
    </li>
  );
}

function PledgeRow({ p }: { p: DeskPledge }) {
  const { partner, readOnly, busy, money, act } = useDesk();
  const [amount, setAmount] = useState(String(p.amount));
  const url = `/api/neighbours/manage/pledges/${p.id}`;
  const holds = pledgeHolds(p, new Date());
  const status =
    p.status === "received"
      ? `Received ${money(p.received ?? p.amount)}`
      : p.status === "cancelled"
        ? "Cancelled"
        : holds
          ? "Waiting for the money"
          : "Nothing arrived in time";
  return (
    <li className="space-y-2 py-3" data-code={p.code}>
      <p className="text-base text-ink">
        <span className="font-mono">{showPledgeCode(p.code)}</span> · {money(p.amount)}
        {p.name ? ` · ${p.name}` : ""}
        {p.contact ? <span className="text-sage"> · {p.contact}</span> : null}
      </p>
      <p className="text-sm text-sage">
        {status} · promised {day(p.createdAt)}
      </p>
      {p.status === "pledged" ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="max-w-[12rem]">
            <MoneyInput id={`got-${p.id}`} label="What arrived" currency={partner.currency} value={amount} onChange={setAmount} />
          </div>
          <button
            type="button"
            className="btn-primary"
            disabled={busy || readOnly || !(parseAmount(amount, ".") > 0)}
            onClick={() => act(url, "PATCH", { action: "received", amount: parseAmount(amount, ".") })}
          >
            It arrived
          </button>
          <button type="button" className="btn-ghost" disabled={busy || readOnly} onClick={() => act(url, "PATCH", { action: "cancel" })}>
            Cancel it
          </button>
        </div>
      ) : p.status === "received" ? (
        <button type="button" className="inline-flex min-h-[44px] items-center text-sm text-sage underline" disabled={busy || readOnly} onClick={() => act(url, "PATCH", { action: "undo" })}>
          Undo “it arrived”
        </button>
      ) : null}
    </li>
  );
}

function Settings() {
  const { partner, role, userId, readOnly, members, busy, act } = useDesk();
  const [form, setForm] = useState({
    name: partner.name,
    city: partner.city,
    currency: partner.currency,
    about: partner.about,
    howToGive: partner.howToGive,
    contact: partner.contact,
    twoPerson: partner.twoPerson,
  });
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const lead = role === "lead";
  const currencies = Array.from(new Set([partner.currency, ...COMMON_CURRENCIES]));
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <details className="border-t border-mist pt-2">
      <summary className="font-serif text-xl text-ink">Your mosque’s page and people</summary>
      <div className="space-y-6 pt-3">
        {!lead ? <p className="text-base text-sage">Only the lead can change these.</p> : null}
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaved(false);
            if (await act(`/api/neighbours/manage/partner/${partner.id}`, "PATCH", form)) setSaved(true);
          }}
        >
          <fieldset disabled={!lead || readOnly} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label mb-1.5" htmlFor="p-name">Name</label>
                <input id="p-name" className="field" value={form.name} onChange={set("name")} maxLength={80} />
              </div>
              <div>
                <label className="label mb-1.5" htmlFor="p-city">City</label>
                <input id="p-city" className="field" value={form.city} onChange={set("city")} maxLength={60} />
              </div>
            </div>
            <div className="max-w-[12rem]">
              <label className="label mb-1.5" htmlFor="p-currency">Currency</label>
              <select id="p-currency" className="field" value={form.currency} onChange={set("currency")}>
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label mb-1.5" htmlFor="p-about">How you check each need</label>
              <textarea id="p-about" className="field min-h-[6rem] resize-y" value={form.about} onChange={set("about")} maxLength={1200} />
            </div>
            <div>
              <label className="label mb-1.5" htmlFor="p-give">How to pay you</label>
              <textarea id="p-give" className="field min-h-[5rem] resize-y" value={form.howToGive} onChange={set("howToGive")} maxLength={600} />
              <p className="mt-1 text-sm text-sage">Bank or mobile money details, or “in cash at the office”. Givers add their code.</p>
            </div>
            <div>
              <label className="label mb-1.5" htmlFor="p-contact">For questions</label>
              <input id="p-contact" className="field" value={form.contact} onChange={set("contact")} maxLength={120} />
            </div>
            <label className="flex min-h-[44px] items-center gap-3 text-base text-ink">
              <input type="checkbox" checked={form.twoPerson} onChange={(e) => setForm({ ...form, twoPerson: e.target.checked })} />
              A second person checks and lists each need
            </label>
            <button type="submit" className="btn-primary" disabled={busy}>
              Save
            </button>
            {saved ? (
              <p role="status" className="text-base text-pine">
                Saved.
              </p>
            ) : null}
          </fieldset>
        </form>

        <div className="space-y-3">
          <h3 className="font-serif text-lg text-ink">People at this desk</h3>
          <ul className="divide-y divide-mist border-y border-mist">
            {members.map((m) => (
              <li key={m.userId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-base">
                <span>
                  {m.name} <span className="text-sage">· {m.email}{m.role === "lead" ? " · lead" : ""}</span>
                </span>
                {lead && !readOnly && m.userId !== userId ? (
                  <button
                    type="button"
                    className="inline-flex min-h-[44px] items-center text-sm text-danger underline"
                    disabled={busy}
                    onClick={() => act(`/api/neighbours/manage/partner/${partner.id}`, "DELETE", { userId: m.userId })}
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          {lead && !readOnly ? (
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await act(`/api/neighbours/manage/partner/${partner.id}`, "POST", { email })) setEmail("");
              }}
            >
              <div className="min-w-[14rem] flex-1">
                <label className="label mb-1.5" htmlFor="p-add">Add someone by the email of their Mizan account</label>
                <input id="p-add" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button type="submit" className="btn-ghost" disabled={busy || !email.trim()}>
                Add
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </details>
  );
}

function ToDo({ count, label }: { count: number; label: string }) {
  return (
    <li className={"border-2 p-3 " + (count > 0 ? "border-brass/60 bg-brass/5" : "border-mist")}>
      <span className="block font-serif text-3xl text-ink nums">{count}</span>
      <span className="text-base text-ink">{label}</span>
    </li>
  );
}

/** Writing or changing a need: what for, a few words, how much, zakat or not, how long. */
function NeedForm({
  currency,
  initial,
  busy,
  onSave,
  onCancel,
}: {
  currency: string;
  initial?: Need;
  busy: boolean;
  onSave: (fields: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [kind, setKind] = useState(initial?.kind ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [story, setStory] = useState(initial?.story ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [zakat, setZakat] = useState<boolean | null>(initial ? initial.zakat : null);
  const [days, setDays] = useState(initial?.days ?? 30);
  const prefix = initial ? `edit-${initial.id}` : "new";

  return (
    <form
      className="space-y-4 border-2 border-pine/40 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ kind, title, story, amount: parseAmount(amount, "."), zakat, days });
      }}
    >
      <h2 className="font-serif text-xl text-ink">{initial ? "Change this need" : "Write a new need"}</h2>
      <p className="border-s-4 border-brass bg-brass/5 px-3 py-2 text-base text-ink">
        Never write a name, an address, a phone number, or anything that could show who the family is. Say what is
        needed, not who needs it.
      </p>
      <fieldset>
        <legend className="label">What is it for?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {NEED_KINDS.map((k) => (
            <button
              key={k.key}
              type="button"
              aria-pressed={kind === k.key}
              onClick={() => setKind(k.key)}
              className={
                "flex min-h-[84px] flex-col items-center justify-center gap-2 border-2 px-2 py-2 text-center text-sm font-medium text-ink " +
                (kind === k.key ? "border-pine bg-pine/10" : "border-mist bg-surface hover:border-sage")
              }
            >
              <NeedIcon kind={k.key} />
              {k.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label mb-1.5" htmlFor={`${prefix}-title`}>
          In a few words
        </label>
        <input
          id={`${prefix}-title`}
          className="field"
          value={title}
          maxLength={TITLE_MAX}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Rent for a mother of three, two months behind"
        />
      </div>
      <div>
        <label className="label mb-1.5" htmlFor={`${prefix}-story`}>
          A little more (optional)
        </label>
        <textarea
          id={`${prefix}-story`}
          className="field min-h-[5rem] resize-y"
          value={story}
          maxLength={STORY_MAX}
          onChange={(e) => setStory(e.target.value)}
        />
      </div>
      <div className="max-w-xs">
        <MoneyInput id={`${prefix}-amount`} label="How much is needed" currency={currency} value={amount} onChange={setAmount} />
      </div>
      <fieldset>
        <legend className="label">Can zakat go to it? Ask your scholar.</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          <label className="flex min-h-[44px] items-center gap-2 text-base text-ink">
            <input type="radio" name={`${prefix}-zakat`} checked={zakat === true} onChange={() => setZakat(true)} />
            Yes, zakat can go here
          </label>
          <label className="flex min-h-[44px] items-center gap-2 text-base text-ink">
            <input type="radio" name={`${prefix}-zakat`} checked={zakat === false} onChange={() => setZakat(false)} />
            No, charity only
          </label>
        </div>
      </fieldset>
      <div className="max-w-[12rem]">
        <label className="label mb-1.5" htmlFor={`${prefix}-days`}>
          List it for
        </label>
        <select id={`${prefix}-days`} className="field" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {EXPIRY_CHOICES.map((d) => (
            <option key={d} value={d}>
              {d} days
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary" disabled={busy}>
          {initial ? "Save the change" : "Save it"}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
