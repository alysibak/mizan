"use client";

import { setStoredValue, useStoredValue } from "@/lib/client-store";

/** Kept in this browser; the root layout applies it before the first paint. */
export const TEXT_SIZE_KEY = "mizan-text-size";

/** "Aa": every page a size larger, for anyone who finds the text small. */
export default function TextSizeToggle({ label, className = "" }: { label: string; className?: string }) {
  const large = useStoredValue(TEXT_SIZE_KEY) === "large";

  function toggle() {
    document.documentElement.classList.toggle("text-large", !large);
    setStoredValue(TEXT_SIZE_KEY, large ? null : "large");
  }

  return (
    <button
      type="button"
      aria-pressed={large}
      aria-label={label}
      title={label}
      onClick={toggle}
      className={
        "inline-flex min-h-[36px] min-w-[36px] items-center justify-center border px-1.5 font-serif leading-none transition " +
        (large ? "border-pine bg-pine/10 text-pine" : "border-mist text-sage hover:text-ink") +
        " " +
        className
      }
    >
      <span aria-hidden>
        <span className="text-xs">A</span>
        <span className="text-base">A</span>
      </span>
    </button>
  );
}
