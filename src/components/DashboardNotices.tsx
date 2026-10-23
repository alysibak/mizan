"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setStoredValue, useHydrated, useStoredValue } from "@/lib/client-store";
import { sendJson } from "@/lib/client-fetch";
import InstallHint, { useInstallHint } from "@/components/InstallHint";

const CHECKLIST_KEY = "mizan-checklist-dismissed";

type Item = { done: boolean; label: string; href: string };

export default function DashboardNotices({
  items,
  metalsStale = false,
  metalsReason = null,
  metalsAgeDays = null,
  welcome = false,
  hasAssets = false,
  part = "all",
  currency = "USD",
}: {
  items: Item[];
  metalsStale?: boolean;
  metalsReason?: "defaults" | "never" | "aged" | null;
  metalsAgeDays?: number | null;
  /** Setup just finished (the wizard lands on /dashboard?welcome=1). */
  welcome?: boolean;
  /** Something was added in setup, so the welcome asks for the rest. */
  hasAssets?: boolean;
  /**
   * "top": what needs attention before reading the figures (the welcome and
   * stale prices). "bottom": the getting-started list and install hint.
   */
  part?: "all" | "top" | "bottom";
  /** The ledger's currency, for fetching today's metal prices. */
  currency?: string;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [metalsHidden, setMetalsHidden] = useState(false);
  const checklistDismissed = useStoredValue(CHECKLIST_KEY) === "1";
  const install = useInstallHint().show;
  const [updating, setUpdating] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  /** Fetch today's gold and silver prices and save them, in one tap. */
  async function applyTodaysPrices() {
    setUpdating(true);
    setPriceError(null);
    const res = await fetch(`/api/metals?currency=${encodeURIComponent(currency)}`).catch(
      () => null,
    );
    const data = (await res?.json().catch(() => null)) as {
      goldPricePerGram?: number;
      silverPricePerGram?: number;
    } | null;
    if (!res?.ok || !data?.goldPricePerGram || !data.silverPricePerGram) {
      setUpdating(false);
      setPriceError(
        "Today’s prices could not be fetched. Try again shortly, or type them in yourself.",
      );
      return;
    }
    const saved = await sendJson(
      "/api/settings/metals",
      "PUT",
      { goldPricePerGram: data.goldPricePerGram, silverPricePerGram: data.silverPricePerGram },
      "Could not save today’s prices.",
    );
    setUpdating(false);
    if (!saved.ok) {
      setPriceError(saved.error);
      return;
    }
    router.refresh();
  }

  const checklistHidden = !hydrated || checklistDismissed;

  function dismissWelcome() {
    router.replace("/dashboard", { scroll: false });
  }

  const remaining = items.filter((i) => !i.done);
  const checklistShown = !checklistHidden && remaining.length > 0;
  // One thing at a time: the home-screen tip waits for the list to be done.
  const installShown = install && hydrated && !checklistShown;
  const top = part !== "bottom";
  const bottom = part !== "top";

  const shown =
    (top && (welcome || (metalsStale && !metalsHidden))) ||
    (bottom && (checklistShown || installShown));
  if (!shown) return null;

  return (
    <div className="space-y-6">
      {top && welcome ? (
        <section className="border border-pine/40 bg-pine/5 px-5 py-5">
          <p className="eyebrow text-pine">Ready</p>
          <p className="mt-1 font-serif text-xl text-ink">You are set up.</p>
          <p className="mt-1 text-base text-sage">
            {hasAssets
              ? "Add anything else you own, such as cash at home or gold. Mizan adds it up."
              : "Add your savings, cash and gold. Mizan works out your zakat."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href="/assets" className="btn-primary">
              {hasAssets ? "Add more" : "Add what I own"}
            </Link>
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center px-2 text-sm text-sage hover:text-ink"
              onClick={dismissWelcome}
            >
              Dismiss
            </button>
          </div>
        </section>
      ) : null}

      {top && metalsStale && !metalsHidden ? (
        <section className="border border-brass/40 bg-brass/5 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">
                {metalsReason === "aged"
                  ? "Gold and silver prices are old"
                  : "Check gold and silver prices"}
              </p>
              <p className="mt-1 text-sm text-sage">
                {metalsReason === "aged"
                  ? `They were saved ${metalsAgeDays ?? "30+"} days ago. Prices move, and the minimum (nisab) moves with them.`
                  : "The minimum (nisab) is a weight of gold or silver, so Mizan needs today’s prices to know it."}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={updating}
                  onClick={() => void applyTodaysPrices()}
                >
                  {updating ? "Fetching today’s prices…" : "Use today’s prices"}
                </button>
                <Link href="/settings#metal-prices" className="inline-flex min-h-[44px] items-center text-sm text-pine hover:underline">
                  Type them in myself
                </Link>
              </div>
              {priceError ? (
                <p className="mt-2 text-sm text-danger" role="alert">
                  {priceError}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="inline-flex min-h-[44px] shrink-0 items-center px-2 text-sm text-sage hover:text-ink"
              onClick={() => setMetalsHidden(true)}
            >
              Dismiss
            </button>
          </div>
        </section>
      ) : null}

      {bottom && checklistShown ? (
        <section className="border border-mist bg-paper px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Getting started</p>
              <p className="mt-1 font-serif text-lg text-ink">
                {remaining.length} {remaining.length === 1 ? "thing" : "things"} left to do
              </p>
            </div>
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center px-2 text-sm text-sage hover:text-ink"
              onClick={() => setStoredValue(CHECKLIST_KEY, "1")}
            >
              Dismiss
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {items.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm">
                <span className={item.done ? "text-gain" : "text-sage"}>
                  {item.done ? "✓" : "○"}
                </span>
                {item.done ? (
                  <span className="text-sage line-through">{item.label}</span>
                ) : (
                  <Link href={item.href} className="text-pine hover:underline">
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {bottom && installShown ? (
        <InstallHint pitch="Put Mizan on your home screen, so it opens like an app. No app store needed." />
      ) : null}
    </div>
  );
}
