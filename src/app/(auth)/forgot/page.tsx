"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client-fetch";

export default function ForgotPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    if (form.get("newPassword") !== form.get("confirmPassword")) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    const res = await sendJson(
      "/api/auth/recover",
      "POST",
      {
        email: form.get("email"),
        code: form.get("code"),
        newPassword: form.get("newPassword"),
      },
      "Could not reset your password",
    );
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.push("/settings?recovered=1");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <Link href="/" className="mb-8 font-serif text-xl text-ink">
        Mizan
      </Link>
      <h1 className="font-serif text-3xl text-ink">Reset your password</h1>
      <p className="mt-2 text-sm text-sage">
        Use the recovery code you saved from Settings. Mizan sends no email, so
        the code is the only way back in without your password. It works once.
      </p>

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
          <label className="label mb-1.5" htmlFor="code">
            Recovery code
          </label>
          <input
            id="code"
            name="code"
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
            required
            className="field font-mono"
          />
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="newPassword">
            New password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
            className="field"
          />
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="confirmPassword">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
            className="field"
          />
        </div>

        {error && (
          <p
            className="rounded-card border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full py-2.5">
          {busy ? "Resetting…" : "Reset password"}
        </button>
      </form>

      <p className="mt-6 text-sm text-sage">
        No recovery code? If you run your own Mizan, whoever manages the server
        can reset the password; otherwise the account cannot be recovered.{" "}
        <Link href="/login" className="text-pine underline-offset-2 hover:underline">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
