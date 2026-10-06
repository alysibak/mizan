"use client";

import { useState } from "react";
import { sendJson } from "@/lib/client-fetch";

interface Setup {
  secret: string;
  uri: string;
  qr: string;
}

/** Two-step sign-in with an authenticator app: set up, or turn off. */
export default function TwoFactorPanel({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function begin() {
    setBusy(true);
    setError(null);
    setMessage(null);
    const res = await sendJson<Setup>("/api/account/two-factor", "POST", undefined, "Could not start");
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setSetup(res.data);
  }

  async function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const code = new FormData(e.currentTarget).get("code");
    const res = await sendJson("/api/account/two-factor", "PUT", { code }, "Could not turn it on");
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setSetup(null);
    setOn(true);
    setMessage(
      "Two-step sign-in is on. Keep your recovery code: it is the way back in if you lose this phone.",
    );
  }

  async function turnOff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await sendJson(
      "/api/account/two-factor",
      "DELETE",
      { password: form.get("password"), code: form.get("code") },
      "Could not turn it off",
    );
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setOn(false);
    setMessage("Two-step sign-in is off.");
  }

  return (
    <div id="two-step" className="scroll-mt-20 space-y-3">
      <h3 className="font-serif text-base text-ink">Two-step sign-in</h3>
      <p className="text-sm text-sage">
        {on
          ? "On. Signing in asks for your password and a code from your authenticator app."
          : "After your password, ask for a six-digit code from an authenticator app on your phone (Google Authenticator, Authy, 1Password, Aegis, and others). Someone who learns your password still cannot get in."}
      </p>

      {message ? (
        <p className="border border-pine/30 bg-pine/5 px-4 py-3 text-sm text-ink" role="status">
          {message}
        </p>
      ) : null}

      {!on && !setup ? (
        <button type="button" className="btn-ghost" onClick={begin} disabled={busy}>
          Set up two-step sign-in
        </button>
      ) : null}

      {setup ? (
        <form onSubmit={confirm} className="space-y-4 border border-mist p-4">
          <p className="text-sm text-ink">1. Scan this with your authenticator app.</p>
          <div
            className="h-44 w-44 bg-white p-1 [&>svg]:h-full [&>svg]:w-full"
            role="img"
            aria-label="QR code for your authenticator app"
            // Rendered on the server from the otpauth link below.
            dangerouslySetInnerHTML={{ __html: setup.qr }}
          />
          <p className="text-sm text-sage">
            On this phone?{" "}
            <a href={setup.uri} className="text-pine hover:underline">
              Open it in your app
            </a>
            . Or type this key:
          </p>
          <p className="select-all break-all font-mono text-sm tracking-wider text-ink">
            {setup.secret}
          </p>
          <div className="max-w-xs">
            <label className="label mb-1.5" htmlFor="totp-confirm">
              2. Enter the code it shows
            </label>
            <input
              id="totp-confirm"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]{6,7}"
              maxLength={7}
              required
              className="field nums tracking-widest"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary" disabled={busy}>
              Turn on
            </button>
            <button type="button" className="btn-ghost" onClick={() => setSetup(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {on ? (
        <details className="text-sm">
          <summary className="cursor-pointer text-sage hover:text-ink">Turn off</summary>
          <form onSubmit={turnOff} className="mt-3 grid max-w-md gap-3 sm:grid-cols-2">
            <div>
              <label className="label mb-1.5" htmlFor="totp-off-password">
                Password
              </label>
              <input
                id="totp-off-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="field"
              />
            </div>
            <div>
              <label className="label mb-1.5" htmlFor="totp-off-code">
                Code from your app
              </label>
              <input
                id="totp-off-code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9 ]{6,7}"
                maxLength={7}
                required
                className="field nums"
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-danger" disabled={busy}>
                Turn off two-step sign-in
              </button>
            </div>
          </form>
        </details>
      ) : null}

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
