"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BEGUN_KEY = "mizan-just-begun";
const INSTALL_KEY = "mizan-install-dismissed";
const CHECKLIST_KEY = "mizan-checklist-dismissed";

type Item = { done: boolean; label: string; href: string };

export default function DashboardNotices({
  items,
  metalsStale = false,
  metalsReason = null,
  metalsAgeDays = null,
}: {
  items: Item[];
  metalsStale?: boolean;
  metalsReason?: "defaults" | "never" | "aged" | null;
  metalsAgeDays?: number | null;
}) {
  const [begun, setBegun] = useState(false);
  const [install, setInstall] = useState(false);
  const [checklistHidden, setChecklistHidden] = useState(true);
  const [metalsHidden, setMetalsHidden] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(BEGUN_KEY) === "1") {
        setBegun(true);
        localStorage.removeItem(BEGUN_KEY);
      }
      if (localStorage.getItem(INSTALL_KEY) !== "1") {
        const standalone =
          window.matchMedia("(display-mode: standalone)").matches ||
          ("standalone" in navigator &&
            Boolean(
              (navigator as Navigator & { standalone?: boolean }).standalone,
            ));
        if (!standalone) setInstall(true);
      }
      setChecklistHidden(localStorage.getItem(CHECKLIST_KEY) === "1");
    } catch {
      setChecklistHidden(false);
    }
  }, []);

  const remaining = items.filter((i) => !i.done);

  return (
    <div className="space-y-6">
      {begun ? (
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
              onClick={() => setBegun(false)}
            >
              Dismiss
            </button>
          </div>
        </section>
      ) : null}

      {metalsStale && !metalsHidden ? (
        <section className="border border-brass/40 bg-brass/5 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="label text-brass">
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

      {!checklistHidden && remaining.length > 0 ? (
        <section className="border border-mist bg-paper px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="label text-brass">Getting started</p>
              <p className="mt-1 font-serif text-lg text-ink">
                {remaining.length} step{remaining.length === 1 ? "" : "s"} left
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-sage hover:text-ink"
              onClick={() => {
                try {
                  localStorage.setItem(CHECKLIST_KEY, "1");
                } catch {
                  /* ignore */
                }
                setChecklistHidden(true);
              }}
            >
              Dismiss
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {items.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm">
                <span className={item.done ? "text-gain" : "text-mist"}>
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

      {install ? (
        <section className="border border-dashed border-mist px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="label text-brass">On your home screen</p>
              <p className="mt-1 text-sm text-sage">
                Mizan is a web app. In your browser menu, choose{" "}
                <span className="text-ink">Add to Home Screen</span> or{" "}
                <span className="text-ink">Install</span> for a ledger that opens
                like a notebook — no app store.
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 text-xs text-sage hover:text-ink"
              onClick={() => {
                try {
                  localStorage.setItem(INSTALL_KEY, "1");
                } catch {
                  /* ignore */
                }
                setInstall(false);
              }}
            >
              Dismiss
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
