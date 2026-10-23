"use client";

import Link from "next/link";

/** Persistent reminder on reckoning screens — estimate, not a fatwa. */
export default function EstimateBanner() {
  return (
    <aside
      className="border border-brass/30 bg-brass/5 px-4 py-3 text-xs leading-relaxed text-sage print:border-mist"
      role="note"
    >
      Mizan adds up what you enter. For your own case, ask someone of knowledge
      you trust.{" "}
      <Link href="/method" className="text-pine hover:underline">
        How it works
      </Link>
    </aside>
  );
}
