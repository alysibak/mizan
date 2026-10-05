import type { Metadata } from "next";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };

/**
 * Shown by the service worker when a page cannot load. Static on purpose: it
 * is cached at install time and must never carry anyone's figures.
 */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6">
      <p className="font-serif text-xl text-ink">Mizan</p>
      <h1 className="mt-6 font-serif text-3xl text-ink">You are offline</h1>
      <p className="mt-3 text-sm leading-relaxed text-sage">
        Your ledger lives on the server, not on this device, so it needs a
        connection to open. Nothing you saved is lost — reconnect and try
        again.
      </p>
      {/* A plain link on purpose: a full page load is the retry. */}
      <a href="/dashboard" className="btn-primary mt-8 self-start">
        Try again
      </a>
    </main>
  );
}
