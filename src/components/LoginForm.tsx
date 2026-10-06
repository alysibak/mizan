"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNextPath } from "@/lib/redirect";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Set once the password is right and the account has two-step sign-in.
  const [ticket, setTicket] = useState<string | null>(null);
  const justReset = params.get("reset") === "1";

  async function onCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login/two-factor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket, code: form.get("code") }),
    }).catch(() => null);
    if (!res) {
      setError("Could not reach Mizan. Check your connection and try again.");
      setBusy(false);
      return;
    }
    if (res.ok) {
      router.push(next);
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error || "Could not sign in");
    setBusy(false);
    // An expired ticket means starting over from the password.
    if (data.restart) setTicket(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    }).catch(() => null);
    if (!res) {
      setError("Could not reach Mizan. Check your connection and try again.");
      setBusy(false);
      return;
    }
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.twoFactor && data.ticket) {
        setTicket(data.ticket);
        setBusy(false);
        return;
      }
      router.push(next);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not sign in");
      setBusy(false);
    }
  }

  if (ticket) {
    return (
      <form onSubmit={onCode} className="mt-8 space-y-4">
        <div>
          <label className="label mb-1.5" htmlFor="code">
            Code from your authenticator app
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,7}"
            maxLength={7}
            required
            autoFocus
            className="field nums text-lg tracking-widest"
          />
        </div>
        {error && (
          <p
            className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-primary w-full py-2.5">
          {busy ? "Checking…" : "Sign in"}
        </button>
        <p className="text-sm text-sage">
          Lost the phone with your app?{" "}
          <Link href="/forgot" className="text-pine underline-offset-2 hover:underline">
            Use your recovery code
          </Link>
          .
        </p>
      </form>
    );
  }

  return (
    <>
      {justReset ? (
        <p className="mt-6 border border-pine/30 bg-pine/5 px-3 py-2 text-sm text-ink" role="status">
          Password changed. Sign in with it and the code from your authenticator app.
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="label mb-1.5" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            className="field"
          />
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="field"
          />
        </div>

        {error && (
          <p
            className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full py-2.5">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-sm">
        <Link href="/forgot" className="text-pine underline-offset-2 hover:underline">
          Forgot your password?
        </Link>
      </p>
      <p className="mt-2 text-sm text-sage">
        New here?{" "}
        <Link href="/register" className="text-pine underline-offset-2 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
