"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Tells the server the browser's time zone when it differs from the saved
 * one (first visit, travel, a new device), then refreshes so dates match.
 */
export default function TimezoneSync({ saved }: { saved: string | null }) {
  const router = useRouter();
  useEffect(() => {
    let zone: string;
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (!zone || zone === saved) return;
    fetch("/api/settings/timezone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: zone }),
    })
      .then((res) => {
        if (res.ok) router.refresh();
      })
      .catch(() => {
        /* dates fall back to UTC until the next visit */
      });
  }, [saved, router]);
  return null;
}
