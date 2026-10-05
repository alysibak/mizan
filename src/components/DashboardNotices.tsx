"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setStoredValue, useHydrated, useStoredValue } from "@/lib/client-store";
import {
  getInstallPrompt,
  promptInstall,
  subscribeInstallPrompt,
} from "@/lib/install-prompt";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac with touch.
  return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

const INSTALL_KEY = "mizan-install-dismissed";
const CHECKLIST_KEY = "mizan-checklist-dismissed";

type Item = { done: boolean; label: string; href: string };

export default function DashboardNotices({
  items,
  metalsStale = false,
  metalsReason = null,
  metalsAgeDays = null,
  welcome = false,
  part = "all",
}: {
  items: Item[];
  metalsStale?: boolean;
  metalsReason?: "defaults" | "never" | "aged" | null;
  metalsAgeDays?: number | null;
  /** Setup just finished (the wizard lands on /dashboard?welcome=1). */
  welcome?: boolean;
  /**
   * "top": what needs attention before reading the figures (the welcome and
   * stale prices). "bottom": the getting-started list and install hint.
   */
  part?: "all" | "top" | "bottom";
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [metalsHidden, setMetalsHidden] = useState(false);
  const installDismissed = useStoredValue(INSTALL_KEY) === "1";
  const checklistDismissed = useStoredValue(CHECKLIST_KEY) === "1";
  const installEvent = useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallPrompt,
    () => null,
  );
  const [installedNow, setInstalledNow] = useState(false);

  // Browser-only facts: shown after hydration so server and client agree.
  const ios = hydrated && isIos();
  const install = hydrated && !installDismissed && !installedNow && !isStandalone();
  const checklistHidden = !hydrated || checklistDismissed;

  function dismissWelcome() {
    router.replace("/dashboard", { scroll: false });
  }

  const remaining = items.filter((i) => !i.done);
  const top = part !== "bottom";
  const bottom = part !== "top";

  const shown =
    (top && (welcome || (metalsStale && !metalsHidden))) ||
    (bottom && ((!checklistHidden && remaining.length > 0) || install));
  if (!shown) return null;

  return (
    <div className="space-y-6">
      {top && welcome ? (
        <section className="border border-pine/40 bg-pine/5 px-5 py-5">
          <p className="label text-pine">Ready</p>
          <p className="mt-1 font-serif text-xl text-ink">Your ledger is open.</p>
          <p className="mt-1 text-sm text-sage">
            Add holdings, confirm prices as they move, and watch the year. When
            you pay, freeze a snapshot under The year.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/assets" className="btn-primary">
              Open the ledger
            </Link>
            <Link href="/tools/reckoning-night" className="btn-ghost">
              Reckoning night
            </Link>
            <button
              type="button"
              className="text-xs text-sage hover:text-ink"
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
              <p className="label text-brassDeep">
                {metalsReason === "aged"
                  ? "Metal prices may be stale"
                  : metalsReason === "never"
                    ? "Confirm metal prices"
                    : "Starter metal prices"}
              </p>
              <p className="mt-1 text-sm text-sage">
                {metalsReason === "aged"
                  ? `Gold and silver were last saved ${metalsAgeDays ?? "30+"} days ago. Reconfirm or update before you trust the nisab line.`
                  : metalsReason === "never"
                    ? "Prices look custom but have no save date yet. Confirm them in settings."
                    : "Gold and silver still match the seed defaults. Suggest or enter today’s prices before you trust the nisab line."}
              </p>
              <Link href="/settings" className="mt-2 inline-block text-sm text-pine hover:underline">
                Update in settings
              </Link>
            </div>
            <button
              type="button"
              className="shrink-0 text-xs text-sage hover:text-ink"
              onClick={() => setMetalsHidden(true)}
            >
              Dismiss
            </button>
          </div>
        </section>
      ) : null}

      {bottom && !checklistHidden && remaining.length > 0 ? (
        <section className="border border-mist bg-paper px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="label text-brassDeep">Getting started</p>
              <p className="mt-1 font-serif text-lg text-ink">
                {remaining.length} step{remaining.length === 1 ? "" : "s"} left
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-sage hover:text-ink"
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

      {bottom && install ? (
        <section className="border border-dashed border-mist px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="label text-brassDeep">On your home screen</p>
              {installEvent ? (
                <>
                  <p className="mt-1 text-sm text-sage">
                    Install Mizan for a ledger that opens from your home screen
                    like a notebook — no app store.
                  </p>
                  <button
                    type="button"
                    className="btn-primary mt-3"
                    onClick={async () => {
                      if (await promptInstall()) setInstalledNow(true);
                    }}
                  >
                    Install Mizan
                  </button>
                </>
              ) : ios ? (
                <p className="mt-1 text-sm text-sage">
                  In Safari, tap <span className="text-ink">Share</span>, then{" "}
                  <span className="text-ink">Add to Home Screen</span>. Mizan
                  opens full-screen like an app — no app store.
                </p>
              ) : (
                <p className="mt-1 text-sm text-sage">
                  Mizan is a web app. In your browser menu, choose{" "}
                  <span className="text-ink">Install</span> or{" "}
                  <span className="text-ink">Add to Home Screen</span> for a
                  ledger that opens like a notebook — no app store.
                </p>
              )}
            </div>
            <button
              type="button"
              className="shrink-0 text-xs text-sage hover:text-ink"
              onClick={() => setStoredValue(INSTALL_KEY, "1")}
            >
              Dismiss
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
