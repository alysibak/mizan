"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNextPath } from "@/lib/redirect";
import GoogleButton, { OrEmail } from "@/components/GoogleButton";

/** Why a sign-in with Google came back here instead of signing in. */
const GOOGLE_TROUBLE: Record<string, string> = {
  failed: "Could not sign in with Google. Try again, or use your email.",
  taken: "This email is joined to a different Google account. Sign in with your email and password.",
  busy: "Too many tries. Wait a few minutes, then try again.",
};

/** `google`: this server offers "Continue with Google". */
export default function LoginForm({ google = false }: { google?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const [error, setError] = useState<string | null>(() => GOOGLE_TROUBLE[params.get("google") ?? ""] ?? null);
  const [busy, setBusy] = useState(false);
  // Set once the password (or Google) is right and the account has two-step
  // sign-in. Google's way back carries it in the address.
  const [ticket, setTicket] = useState<string | null>(() => params.get("ticket"));
  const justReset = params.get("reset") === "1";

  // Keep the ticket out of the address bar and history once it is read.
  useEffect(() => {
    if (params.get("ticket") || params.get("google")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("ticket");
      url.searchParams.delete("google");
      window.history.replaceState(null, "", url);
    }
  }, [params]);

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
      {google ? (
        <div className="mt-8">
          <GoogleButton next={params.get("next")} />
          <OrEmail />
        </div>
      ) : null}
      <form onSubmit={onSubmit} className={(google ? "" : "mt-8 ") + "space-y-4"}>
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

      <p className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
        <Link href="/forgot" className="text-pine underline-offset-2 hover:underline">
          Forgot your password?
        </Link>
        <Link href="/register" className="text-pine underline-offset-2 hover:underline">
          New here? Make an account
        </Link>
      </p>
    </>
  );
}
