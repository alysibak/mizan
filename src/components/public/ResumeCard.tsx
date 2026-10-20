"use client";

import Link from "next/link";
import { IconCoins, IconSmile, IconUsers, IconYear } from "@/components/icons";
import { useVisitorCurrency } from "@/components/public/VisitorCurrency";
import {
  CALC_STORAGE_KEY,
  computeDraft,
  decimalMarkFor,
  draftIsEmpty,
  parseAmount,
  parseDraft,
} from "@/lib/calculator";
import { useHydrated, useStoredValue } from "@/lib/client-store";
import { MISSED_KEY, missedZakat, parseTally, tallyAmounts } from "@/lib/missed";
import { formatMoney } from "@/lib/money";
import { DEED_DAYS_KEY, parseDays, streak } from "@/lib/streak";
import { LOCALE_INFO, fmt, localePath, type Locale } from "@/i18n/config";

export interface ResumeLabels {
  title: string;
  continue: string;
  /** "Your zakat is {amount}". */
  zakatIs: string;
  /** "Still to give: {amount}". */
  stillToGive: string;
  allGiven: string;
  missed: string;
}

interface Row {
  key: string;
  Icon: typeof IconCoins;
  title: string;
  status: string;
  href: string;
}

/**
 * For someone coming back: what they worked out last time and what is left
 * to do, each a tap from where they stopped. Read from this browser only;
 * shows nothing to a first-time visitor.
 */
export default function ResumeCard({ locale, labels }: { locale: Locale; labels: ResumeLabels }) {
  const hydrated = useHydrated();
  const [currency] = useVisitorCurrency();
  const draftRaw = useStoredValue(CALC_STORAGE_KEY);
  const missedRaw = useStoredValue(MISSED_KEY);
  const daysRaw = useStoredValue(DEED_DAYS_KEY);
  const familyRaw = useStoredValue("mizan-family-v1");
  if (!hydrated) return null;

  const intl = LOCALE_INFO[locale].intl;
  const rows: Row[] = [];
  const left = (due: number, given: number, money: (n: number) => string) =>
    due - given > 0.005 ? fmt(labels.stillToGive, { amount: money(due - given) }) : labels.allGiven;

  // The zakat worked out in the calculator or the step-by-step guide.
  const draft = parseDraft(draftRaw);
  if (draft && !draftIsEmpty(draft)) {
    const { result, needsPrices } = computeDraft(draft);
    if (!needsPrices && result.isDue) {
      const money = (n: number) => formatMoney(n, draft.currency, intl);
      rows.push({
        key: "zakat",
        Icon: IconCoins,
        title: fmt(labels.zakatIs, { amount: money(result.zakatDue) }),
        status: left(result.zakatDue, parseAmount(draft.given, draft.decimal), money),
        // In English, My zakat holds the whole year; elsewhere, the calculator.
        href: locale === "en" ? "/my" : localePath(locale, "/calculator"),
      });
    }
  }

  // Years being caught up on.
  const tally = parseTally(missedRaw);
  const decimal = decimalMarkFor(intl);
  const missed = missedZakat(tallyAmounts(tally, decimal), tally.months);
  if (missed.valid) {
    const money = (n: number) => formatMoney(n, currency, intl);
    rows.push({
      key: "missed",
      Icon: IconYear,
      title: labels.missed,
      status: left(missed.total, parseAmount(tally.given, decimal), money),
      href: localePath(locale, "/missed-years"),
    });
  }

  // Pages in English only so far.
  if (locale === "en") {
    const days = parseDays(daysRaw);
    if (days.size) {
      const run = streak(days, new Date());
      rows.push({
        key: "deeds",
        Icon: IconSmile,
        title: "Your good deeds",
        status: run > 0 ? `${run} ${run === 1 ? "day" : "days"} in a row` : "Start a new run today",
        href: "/sadaqah",
      });
    }
    try {
      const people = familyRaw ? (JSON.parse(familyRaw) as { members?: unknown[] }).members : null;
      if (Array.isArray(people) && people.length > 1) {
        rows.push({
          key: "family",
          Icon: IconUsers,
          title: "Your family’s zakat",
          status: `${people.length} people`,
          href: "/family",
        });
      }
    } catch {
      /* nothing readable kept */
    }
  }

  if (!rows.length) return null;
  return (
    <section className="border-2 border-pine/40 bg-pine/5 p-4" aria-labelledby="resume-title">
      <h2 id="resume-title" className="font-serif text-xl text-ink">
        {labels.title}
      </h2>
      <ul className="mt-3 space-y-2">
        {rows.map(({ key, Icon, title, status, href }) => (
          <li key={key}>
            <Link
              href={href}
              className="group flex items-center gap-3 border border-mist bg-surface px-3 py-2.5 transition hover:border-pine"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-pine/30 bg-pine/5 text-pine"
                aria-hidden
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-medium text-ink nums">{title}</span>
                <span className="block text-sm text-sage nums">{status}</span>
              </span>
              <span className="shrink-0 text-sm font-medium text-pine">
                {labels.continue}
                <span className="ms-1 inline-block transition group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden>
                  →
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {locale === "en" ? (
        <Link href="/my" className="mt-3 inline-block text-base font-medium text-pine hover:underline">
          See all of it in My zakat →
        </Link>
      ) : null}
    </section>
  );
}
