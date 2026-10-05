"use client";

import "./globals.css";

/** Last resort when the root layout itself fails. Keeps its own <html>. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
          <p className="label text-brassDeep">Mizan</p>
          <h1 className="mt-2 font-serif text-3xl text-ink">Mizan could not load</h1>
          <p className="mt-4 leading-relaxed text-sage">
            Nothing you saved has been lost. Please try again in a moment.
          </p>
          {error.digest ? (
            <p className="mt-3 text-xs text-sage">
              Reference: <span className="font-mono">{error.digest}</span>
            </p>
          ) : null}
          <div className="mt-8">
            <button type="button" className="btn-primary" onClick={() => reset()}>
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
