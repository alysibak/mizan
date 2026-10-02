"use client";

import Link from "next/link";
import { setStoredValue, useHydrated, useStoredValue } from "@/lib/client-store";

const KEY = "mizan-letter-dismissed";

/** Surface the sealed letter from the most recent freeze. */
export default function LastLetterCard({
  snapshotId,
  takenAt,
  letter,
}: {
  snapshotId: string;
  takenAt: string;
  letter: string;
}) {
  const hydrated = useHydrated();
  const dismissed = useStoredValue(KEY);
  // Hidden until hydrated so a dismissed letter never flashes on load.
  if (!hydrated || dismissed === snapshotId) return null;

  return (
    <section className="border border-brass/40 bg-brass/5 px-5 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label text-brass">From last freeze</p>
          <p className="mt-1 text-xs text-sage">Sealed {takenAt}</p>
          <p className="mt-3 whitespace-pre-wrap font-serif text-lg leading-relaxed text-ink">
            {letter}
          </p>
          <Link
            href={`/year/snapshots/${snapshotId}`}
            className="mt-3 inline-block text-sm text-pine hover:underline"
          >
            Open that freeze
          </Link>
        </div>
        <button
          type="button"
          className="shrink-0 text-xs text-sage hover:text-ink"
          onClick={() => setStoredValue(KEY, snapshotId)}
        >
          Dismiss
        </button>
      </div>
    </section>
  );
}
