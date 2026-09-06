"use client";

import Link from "next/link";

/** Persistent reminder on reckoning screens — estimate, not a fatwa. */
export default function EstimateBanner() {
  return (
    <aside
      className="border border-brass/30 bg-brass/5 px-4 py-3 text-xs leading-relaxed text-sage print:border-mist"
      role="note"
    >
      <span className="font-medium text-ink">Estimate, not a ruling. </span>
      Mizan verifies the arithmetic you enter. It does not replace a qualified
      person of knowledge.{" "}
      <Link href="/trust" className="text-pine hover:underline">
        What is verified
      </Link>
    </aside>
  );
}
