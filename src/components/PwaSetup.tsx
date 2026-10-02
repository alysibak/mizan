"use client";

import { useEffect } from "react";
import {
  captureInstallPrompt,
  type BeforeInstallPromptEvent,
} from "@/lib/install-prompt";

/** Registers the service worker and keeps the install prompt for later. */
export default function PwaSetup() {
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      captureInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => captureInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Development rebuilds chunks constantly; a worker there only serves stale code.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* the app works without it */
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}
