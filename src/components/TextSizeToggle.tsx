"use client";

import { setStoredValue, useStoredValue } from "@/lib/client-store";

/** Kept in this browser; the root layout applies it before the first paint. */
export const TEXT_SIZE_KEY = "mizan-text-size";

/**
 * "Aa": every page a size larger, for anyone who finds the text small.
 * `withLabel` shows the words beside the letters, as in the Menu.
 */
export default function TextSizeToggle({
  label,
  className = "",
  withLabel = false,
}: {
  label: string;
  className?: string;
  withLabel?: boolean;
}) {
  const large = useStoredValue(TEXT_SIZE_KEY) === "large";

  function toggle() {
    document.documentElement.classList.toggle("text-large", !large);
    setStoredValue(TEXT_SIZE_KEY, large ? null : "large");
  }

  return (
    <button
      type="button"
      aria-pressed={large}
      aria-label={withLabel ? undefined : label}
      title={label}
      onClick={toggle}
      className={
        "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 border px-2 font-serif leading-none transition " +
        (large ? "border-pine bg-pine/10 text-pine" : "border-mist text-sage hover:text-ink") +
        " " +
        className
      }
    >
      <span aria-hidden>
        <span className="text-[0.75rem]">A</span>
        <span className="text-base">A</span>
      </span>
      {withLabel ? <span className="font-sans text-sm font-medium">{label}</span> : null}
    </button>
  );
}
