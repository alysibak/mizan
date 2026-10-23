"use client";

import { useState, useSyncExternalStore } from "react";
import { setStoredValue, useHydrated, useStoredValue } from "@/lib/client-store";
import { getInstallPrompt, promptInstall, subscribeInstallPrompt } from "@/lib/install-prompt";

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

/** Whether to offer "add to home screen": not once installed, opened from it, or dismissed. */
export function useInstallHint() {
  const hydrated = useHydrated();
  const dismissed = useStoredValue(INSTALL_KEY) === "1";
  const event = useSyncExternalStore(subscribeInstallPrompt, getInstallPrompt, () => null);
  const [installedNow, setInstalledNow] = useState(false);
  // Browser-only facts: read after hydration so server and client agree.
  return {
    show: hydrated && !dismissed && !installedNow && !isStandalone(),
    ios: hydrated && isIos(),
    event,
    async install() {
      if (await promptInstall()) setInstalledNow(true);
    },
    dismiss() {
      setStoredValue(INSTALL_KEY, "1");
    },
  };
}

/**
 * "On your home screen": the browser's own install button where there is
 * one, and the steps for Safari and the rest where there is not.
 */
export default function InstallHint({ pitch, className = "" }: { pitch: string; className?: string }) {
  const hint = useInstallHint();
  if (!hint.show) return null;
  return (
    <section className={"border border-dashed border-mist px-5 py-4 print:hidden " + className} aria-labelledby="install-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="install-title" className="eyebrow">
            On your home screen
          </h2>
          <p className="mt-1 text-sm text-sage">{pitch}</p>
          {hint.event ? (
            <button type="button" className="btn-primary mt-3" onClick={() => void hint.install()}>
              Install Mizan
            </button>
          ) : hint.ios ? (
            <p className="mt-2 text-sm text-sage">
              In Safari, tap <span className="text-ink">Share</span>, then{" "}
              <span className="text-ink">Add to Home Screen</span>.
            </p>
          ) : (
            <p className="mt-2 text-sm text-sage">
              In your browser menu, choose <span className="text-ink">Install</span> or{" "}
              <span className="text-ink">Add to Home Screen</span>.
            </p>
          )}
        </div>
        <button type="button" className="shrink-0 text-xs text-sage hover:text-ink" onClick={hint.dismiss}>
          Dismiss
        </button>
      </div>
    </section>
  );
}
