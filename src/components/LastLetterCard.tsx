"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(KEY);
      setHidden(dismissed === snapshotId);
    } catch {
      setHidden(false);
    }
  }, [snapshotId]);

  if (hidden) return null;

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
          onClick={() => {
            try {
              localStorage.setItem(KEY, snapshotId);
            } catch {
              /* ignore */
            }
            setHidden(true);
          }}
        >
          Dismiss
        </button>
      </div>
    </section>
  );
}
