"use client";

import Link from "next/link";

/** Shown when a page fails to render. The digest matches the server log line. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-6 py-16">
      <p className="label text-brassDeep">Something went wrong</p>
      <h1 className="mt-2 font-serif text-3xl text-ink">This page could not be shown</h1>
      <p className="mt-4 leading-relaxed text-sage">
        Nothing you saved has been lost. Try again; if it keeps happening, check
        your connection or come back in a few minutes.
      </p>
      {error.digest ? (
        <p className="mt-3 text-xs text-sage">
          Reference: <span className="font-mono">{error.digest}</span>
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/dashboard" className="btn-ghost">
          Back to your balance
        </Link>
      </div>
    </main>
  );
}
